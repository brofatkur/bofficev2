import { NextRequest, NextResponse } from 'next/server';
import { recordInvoicePayment, getCustomers, getSettings } from '@/lib/data-store';
import { sendWhatsAppMessage } from '@/lib/kirimdev';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceId, amount, paymentDate, paymentMethod, notes, recordedBy } = body;

    if (!invoiceId || !amount || amount <= 0 || !paymentDate) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID, jumlah pembayaran valid, dan tanggal bayar wajib diisi' },
        { status: 400 }
      );
    }

    const result = await recordInvoicePayment({
      invoiceId,
      amount: Number(amount),
      paymentDate,
      paymentMethod: paymentMethod || 'Transfer Bank',
      notes,
      recordedBy,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Auto notification via WhatsApp if enabled
    const settings = await getSettings();
    if (settings.autoNotificationEnabled && result.invoice) {
      const customers = await getCustomers();
      const customer = customers.find((c) => c.id === result.invoice?.customerId);
      if (customer) {
        const msg =
          `*BUKTI PEMBAYARAN (KUITANSI) — BOffice*\n\n` +
          `Yth. ${customer.companyName} (PIC: ${customer.picName}),\n` +
          `Pembayaran Anda sebesar *Rp ${Number(amount).toLocaleString('id-ID')}* telah kami terima dengan rincian:\n` +
          `• No. Kuitansi: *${result.payment?.receiptNumber}*\n` +
          `• No. Invoice: *${result.invoice.invoiceNumber}*\n` +
          `• Tanggal Bayar: ${paymentDate}\n` +
          `• Status Invoice: *${result.invoice.status.toUpperCase().replace('_', ' ')}*\n` +
          (result.invoice.remainingAmount > 0
            ? `• Sisa Tagihan: *Rp ${result.invoice.remainingAmount.toLocaleString('id-ID')}*\n`
            : `• Status: *LUNAS SEPENUHNYA*\n`) +
          `\nTerima kasih telah mempercayai BOffice sebagai solusi ruang kantor Anda! 🙏`;

        sendWhatsAppMessage({
          to: customer.phone,
          message: msg,
          messageType: 'receipt',
        }).catch(console.error);
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
