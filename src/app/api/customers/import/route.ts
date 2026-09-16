import { NextRequest, NextResponse } from 'next/server';
import { addCustomer, addContract, getBranches, getCustomers, getOffices, readableError } from '@/lib/data-store';

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json();
    if (!Array.isArray(rows) || !rows.length) return NextResponse.json({ success: false, error: 'Tidak ada data untuk diimpor.' }, { status: 400 });
    const [branches, existing, offices] = await Promise.all([getBranches(), getCustomers(), getOffices()]);
    const result = { imported: 0, skipped: 0, errors: [] as Array<{ row: number; message: string }> };

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      try {
        const branchCode = String(row.branch_code || row.kode_cabang || row.branch || '').trim().toLowerCase();
        const branch = branches.find((item) => item.code.toLowerCase() === branchCode || item.name.toLowerCase().includes(branchCode));
        if (!branch) throw new Error(`Kode cabang "${row.branch_code || row.kode_cabang || '-'}" tidak ditemukan. Pilihan kode: ${branches.map((b) => b.code).join(', ')}`);

        const phone = String(row.phone || row.telepon || row.no_hp || row.whatsapp || '').trim();
        const nib = String(row.nib || '').trim();
        const duplicate = existing.find((item) => (nib && item.nib === nib) || (phone && item.phone.replace(/\D/g, '') === phone.replace(/\D/g, '')));
        if (duplicate) { result.skipped += 1; continue; }

        const startDate = String(row.start_date || row.tgl_mulai || row.tanggal_mulai || new Date().toISOString().slice(0, 10)).trim();
        let endDate = String(row.end_date || row.tgl_berakhir || row.tanggal_berakhir || row.tgl_selesai || '').trim();
        if (!endDate) {
          const s = new Date(startDate);
          if (!isNaN(s.getTime())) {
            s.setFullYear(s.getFullYear() + 1);
            s.setDate(s.getDate() - 1);
            endDate = s.toISOString().slice(0, 10);
          } else {
            endDate = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);
          }
        }

        const rawService = String(row.service_type || row.layanan || 'virtual_office').toLowerCase();
        const serviceType = rawService.includes('private') ? 'private_office' : 'virtual_office';
        const rentPrice = Number(row.rent_price || row.harga_sewa || row.nilai_sewa) || (serviceType === 'virtual_office' ? 4500000 : 15000000);
        const status = row.status === 'calon_tenant' ? 'calon_tenant' : (row.status || 'aktif');

        const newCustomer = await addCustomer({
          companyName: row.company_name || row.nama_perusahaan || 'Tenant Tanpa Nama',
          entityType: row.entity_type || row.badan_usaha || 'PT',
          serviceType,
          branchId: branch.id,
          picName: row.pic_name || row.nama_pic || row.pic || '-',
          phone,
          email: row.email || '',
          address: row.address || row.alamat || '',
          npwp: row.npwp || undefined,
          nib: nib || undefined,
          status: status as any,
          startDate,
          endDate,
          notes: row.notes || row.catatan || undefined,
          onboardingStatus: 'not_invited',
        });

        // Terbitkan kontrak sewa awal agar masa sewa & reminder WA berjalan
        const branchOffice = offices.find((o) => o.branchId === branch.id) || offices[0];
        if (branchOffice) {
          const contractNumber = `CTR/${branch.code}/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;
          await addContract({
            contractNumber,
            customerId: newCustomer.id,
            branchId: branch.id,
            officeId: branchOffice.id,
            rentalType: serviceType === 'virtual_office' ? 'virtual' : 'physical',
            billingCycle: 'yearly',
            startDate,
            endDate,
            rentPrice,
            autoRenew: true,
            status: 'active',
          });
        }

        result.imported += 1;
      } catch (error) {
        result.errors.push({ row: index + 2, message: readableError(error) });
      }
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: readableError(error) }, { status: 500 });
  }
}
