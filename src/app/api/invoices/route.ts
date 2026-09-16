import { NextRequest, NextResponse } from 'next/server';
import { getInvoices, addInvoice, getCustomers } from '@/lib/data-store';
import { sendWhatsAppMessage } from '@/lib/kirimdev';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId') || undefined;
  const invoices = await getInvoices(branchId);
  return NextResponse.json({ success: true, data: invoices });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      branchId,
      customerId,
      contractId,
      issueDate,
      dueDate,
      items,
      totalDiscountType,
      totalDiscountValue,
      totalTaxes,
      autoNotification,
      resellerId,
      commissionModel,
      commissionRate,
      bofficeNetPrice,
    } = body;

    if (!branchId || !customerId || !items || !items.length || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'Cabang, Customer, rincian item, dan tanggal jatuh tempo wajib diisi' },
        { status: 400 }
      );
    }

    const newInvoice = await addInvoice({
      branchId,
      customerId,
      contractId,
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      dueDate,
      items,
      totalDiscountType,
      totalDiscountValue: Number(totalDiscountValue || 0),
      totalTaxes: totalTaxes || [],
      autoNotification: autoNotification ?? true,
      resellerId,
      commissionModel,
      commissionRate: commissionRate == null ? undefined : Number(commissionRate),
      bofficeNetPrice: bofficeNetPrice == null ? undefined : Number(bofficeNetPrice),
    });

    // Send WhatsApp notification if autoNotification is enabled
    if (newInvoice.autoNotification) {
      const customers = await getCustomers();
      const customer = customers.find((c) => c.id === customerId);
      if (customer) {
        const msg =
          `*TAGIHAN RESMI (INVOICE) — BOffice*\n\n` +
          `Yth. ${customer.companyName} (PIC: ${customer.picName}),\n` +
          `Berikut diterbitkan tagihan resmi:\n` +
          `• No. Invoice: *${newInvoice.invoiceNumber}*\n` +
          `• Jatuh Tempo: *${newInvoice.dueDate}*\n` +
          `• Total Tagihan: *Rp ${newInvoice.totalAmount.toLocaleString('id-ID')}*\n\n` +
          `Rincian item:\n` +
          newInvoice.items.map((i) => ` - ${i.description} (${i.quantity}x): Rp ${i.total.toLocaleString('id-ID')}`).join('\n') +
          `\n\nPembayaran dapat ditransfer ke:\n` +
          `*BCA 8800-1234-5678* a.n. PT BOffice Solusi Ruang.\n\n` +
          `Terima kasih! 🙏`;

        sendWhatsAppMessage({
          to: customer.phone,
          message: msg,
          messageType: 'invoice',
        }).catch(console.error);
      }
    }

    return NextResponse.json({ success: true, data: newInvoice });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
