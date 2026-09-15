import { NextRequest, NextResponse } from 'next/server';
import { getLeads, addLead, updateLead } from '@/lib/data-store';

export async function GET() {
  const leads = getLeads();
  return NextResponse.json({ success: true, data: leads });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.companyName || !body.phone) {
      return NextResponse.json({ success: false, error: 'Nama, Perusahaan, dan WhatsApp wajib diisi' }, { status: 400 });
    }
    const newLead = addLead(body);
    return NextResponse.json({ success: true, data: newLead });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Lead ID required' }, { status: 400 });
    }
    const updated = updateLead(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
