import { NextRequest, NextResponse } from 'next/server';
import { getContracts, addContract, updateContract } from '@/lib/data-store';

export async function GET() {
  const contracts = await getContracts();
  return NextResponse.json({ success: true, data: contracts });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.customerId || !body.officeId || !body.startDate || !body.endDate) {
      return NextResponse.json({ success: false, error: 'Customer, Office, dan Tanggal Sewa wajib diisi' }, { status: 400 });
    }
    const contractNumber = `CTR/NOC/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;
    const newContract = await addContract({
      ...body,
      contractNumber,
      status: 'active',
      autoRenew: body.autoRenew ?? true,
    });
    return NextResponse.json({ success: true, data: newContract });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Contract ID required' }, { status: 400 });

    const updated = await updateContract(id, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
