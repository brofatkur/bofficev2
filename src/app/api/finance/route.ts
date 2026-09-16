import { NextRequest, NextResponse } from 'next/server';
import { addFinancialTransaction, getBranches, getFinancialTransactions, getInvoices, readableError, updateFinancialTransaction } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const branchId = new URL(req.url).searchParams.get('branchId') || undefined;
    const [transactions, branches, invoices] = await Promise.all([getFinancialTransactions(branchId), getBranches(), getInvoices(branchId)]);
    const approved = transactions.filter((item) => item.status === 'approved');
    const income = approved.filter((item) => item.direction === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
    const expense = approved.filter((item) => item.direction === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
    const receivable = invoices.reduce((sum, invoice) => sum + Number(invoice.remainingAmount), 0);
    return NextResponse.json({ success: true, data: { transactions, branches, summary: { income, expense, net: income - expense, receivable } } });
  } catch (error) {
    return NextResponse.json({ success: false, error: readableError(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.branchId || !body.transactionDate || !body.direction || !body.amount || !body.description) return NextResponse.json({ success: false, error: 'Cabang, tanggal, jenis, nilai, dan keterangan wajib diisi.' }, { status: 400 });
    return NextResponse.json({ success: true, data: await addFinancialTransaction({ ...body, amount: Number(body.amount), sourceType: body.sourceType || 'manual', status: body.status || 'approved' }) });
  } catch (error) {
    return NextResponse.json({ success: false, error: readableError(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });
    return NextResponse.json({ success: true, data: await updateFinancialTransaction(id, updates) });
  } catch (error) {
    return NextResponse.json({ success: false, error: readableError(error) }, { status: 500 });
  }
}
