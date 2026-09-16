import { NextRequest, NextResponse } from 'next/server';
import { addCustomer, getBranches, getCustomers, readableError } from '@/lib/data-store';

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json();
    if (!Array.isArray(rows) || !rows.length) return NextResponse.json({ success: false, error: 'Tidak ada data untuk diimpor.' }, { status: 400 });
    const [branches, existing] = await Promise.all([getBranches(), getCustomers()]);
    const result = { imported: 0, skipped: 0, errors: [] as Array<{ row: number; message: string }> };
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      try {
        const branch = branches.find((item) => item.code.toLowerCase() === String(row.branch_code || '').trim().toLowerCase());
        if (!branch) throw new Error(`Kode cabang ${row.branch_code || '-'} tidak ditemukan`);
        const duplicate = existing.find((item) => (row.nib && item.nib === row.nib) || item.phone.replace(/\D/g, '') === String(row.phone || '').replace(/\D/g, ''));
        if (duplicate) { result.skipped += 1; continue; }
        await addCustomer({ companyName: row.company_name, entityType: row.entity_type || 'PT', serviceType: row.service_type || 'virtual_office', branchId: branch.id, picName: row.pic_name, phone: row.phone, email: row.email || '', address: row.address || '', npwp: row.npwp || undefined, nib: row.nib || undefined, status: row.status || 'calon_tenant', startDate: row.start_date || new Date().toISOString().slice(0, 10), notes: row.notes || undefined, onboardingStatus: 'not_invited' });
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
