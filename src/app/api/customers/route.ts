import { NextRequest, NextResponse } from 'next/server';
import { getCustomers, addCustomer, updateLead } from '@/lib/data-store';

export async function GET() {
  const customers = getCustomers();
  return NextResponse.json({ success: true, data: customers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.companyName || !body.picName || !body.phone) {
      return NextResponse.json({ success: false, error: 'Data perusahaan, PIC, dan telepon wajib diisi' }, { status: 400 });
    }
    const newCustomer = addCustomer(body);

    // If converted from a lead, automatically update lead status to closed_won
    if (body.leadId) {
      updateLead(body.leadId, { status: 'closed_won' });
    }

    return NextResponse.json({ success: true, data: newCustomer });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
