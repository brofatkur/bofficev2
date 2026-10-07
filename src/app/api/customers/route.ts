import { NextRequest, NextResponse } from 'next/server';
import { getCustomers, addCustomer, updateCustomer, updateLead } from '@/lib/data-store';

export async function GET() {
  const customers = await getCustomers();
  return NextResponse.json({ success: true, data: customers });
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'Customer ID wajib diisi' }, { status: 400 });
    if ('meetingRoomMonthlyFreeHours' in updates) {
      const quota=Number(updates.meetingRoomMonthlyFreeHours);
      if(!Number.isFinite(quota)||quota<0||quota>1000)return NextResponse.json({success:false,error:'Kuota meeting room harus antara 0–1.000 jam per bulan.'},{status:400});
      updates.meetingRoomMonthlyFreeHours=quota;
    }
    return NextResponse.json({ success: true, data: await updateCustomer(id, updates) });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.companyName || !body.picName || !body.phone) {
      return NextResponse.json({ success: false, error: 'Data perusahaan, PIC, dan telepon wajib diisi' }, { status: 400 });
    }
    const newCustomer = await addCustomer(body);

    // If converted from a lead, automatically update lead status to closed_won
    if (body.leadId) {
      await updateLead(body.leadId, { status: 'closed_won' });
    }

    return NextResponse.json({ success: true, data: newCustomer });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
