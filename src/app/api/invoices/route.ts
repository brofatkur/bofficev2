import { NextRequest, NextResponse } from 'next/server';
import { getInvoices, addInvoice, updateInvoice } from '@/lib/data-store';

export async function GET() {
  const invoices = getInvoices();
  return NextResponse.json({ success: true, data: invoices });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, items, dueDate } = body;

    if (!customerId || !items || !items.length || !dueDate) {
      return NextResponse.json({ success: false, error: 'Customer, item tagihan, dan tanggal jatuh tempo wajib diisi' }, { status: 400 });
    }

    const invoiceNumber = `INV/NOC/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.total || item.amount * item.quantity), 0);
    const tax = 0; // Tax calculation can be added if needed
    const totalAmount = subtotal + tax;

    const newInvoice = addInvoice({
      invoiceNumber,
      customerId,
      contractId: body.contractId,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate,
      items,
      subtotal,
      tax,
      totalAmount,
      status: 'pending',
    });

    return NextResponse.json({ success: true, data: newInvoice });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Invoice ID dan Status required' }, { status: 400 });
    }

    const updated = updateInvoice(id, { status });
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
