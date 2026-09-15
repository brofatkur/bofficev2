import { NextResponse } from 'next/server';
import { getContracts, getCustomers, getOffices, updateContract } from '@/lib/data-store';
import { sendWhatsAppMessage } from '@/lib/kirimdev';

export async function POST() {
  try {
    const contracts = await getContracts();
    const customers = await getCustomers();
    const offices = await getOffices();

    const today = new Date();
    const sentResults: any[] = [];

    for (const contract of contracts) {
      if (contract.status === 'terminated') continue;

      const endDate = new Date(contract.endDate);
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

      // Remind if expiring within 30 days and hasn't been reminded today
      if (diffDays <= 30 && diffDays >= 0) {
        const customer = customers.find((c) => c.id === contract.customerId);
        const office = offices.find((o) => o.id === contract.officeId);

        if (customer && office) {
          const message = `Halo Bapak/Ibu ${customer.picName} (${customer.companyName}),\n\n` +
            `Salam hangat dari Nusantara Office Center.\n` +
            `Kami menginformasikan bahwa kontrak sewa *${office.name}* Anda akan berakhir pada tanggal *${contract.endDate}* (${diffDays} hari lagi).\n\n` +
            `Untuk menjaga keberlanjutan operasional dan penggunaan kuota Meeting Room 8 jam/bulan Anda, mohon konfirmasi perpanjangan sewa.\n\n` +
            `Terima kasih! 🙏`;

          const res = await sendWhatsAppMessage({
            to: customer.phone,
            message,
            messageType: 'contract_renewal',
          });

          await updateContract(contract.id, {
            status: 'expiring_soon',
            lastWaReminderSentAt: new Date().toISOString(),
          });

          sentResults.push({
            contractId: contract.id,
            company: customer.companyName,
            phone: customer.phone,
            daysLeft: diffDays,
            result: res,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: sentResults.length,
      details: sentResults,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
