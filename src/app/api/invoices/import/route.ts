import { NextRequest, NextResponse } from 'next/server';
import {
  addCustomer,
  addInvoice,
  calculateInvoiceTotals,
  getBranches,
  getContracts,
  getCustomers,
  getInvoices,
  normalizePhone,
  readableError,
  recordInvoicePayment,
} from '@/lib/data-store';

type ImportRow = Record<string, string>;

const requiredColumns = [
  'invoice_number',
  'branch_code',
  'customer_company',
  'customer_pic',
  'customer_phone',
  'issue_date',
  'due_date',
  'description',
  'quantity',
  'amount',
];

function numberValue(value: string | undefined, fallback = 0) {
  const source = String(value || '').replace(/\s|Rp/gi, '');
  const normalized = source.includes(',') ? source.replace(/\./g, '').replace(',', '.') : source;
  const result = Number(normalized);
  return Number.isFinite(result) ? result : fallback;
}

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

function boolValue(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  return ['1', 'true', 'ya', 'yes'].includes(value.trim().toLowerCase());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows = Array.isArray(body.rows) ? (body.rows as ImportRow[]) : [];
    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'Tidak ada baris invoice untuk diimpor.' }, { status: 400 });
    }
    if (rows.length > 2000) {
      return NextResponse.json({ success: false, error: 'Maksimal 2.000 baris dalam satu proses impor.' }, { status: 400 });
    }

    const missingColumns = requiredColumns.filter((column) => !(column in rows[0]));
    if (missingColumns.length) {
      return NextResponse.json(
        { success: false, error: `Kolom wajib belum ada: ${missingColumns.join(', ')}` },
        { status: 400 }
      );
    }

    const grouped = new Map<string, Array<ImportRow & { _row: string }>>();
    rows.forEach((row, index) => {
      const invoiceNumber = String(row.invoice_number || '').trim();
      const group = grouped.get(invoiceNumber) || [];
      group.push({ ...row, _row: String(index + 2) });
      grouped.set(invoiceNumber, group);
    });

    const [branches, customers, contracts, invoices] = await Promise.all([
      getBranches(),
      getCustomers(),
      getContracts(),
      getInvoices(),
    ]);
    const knownNumbers = new Set(invoices.map((invoice) => invoice.invoiceNumber.toLowerCase()));
    const mutableCustomers = [...customers];
    const errors: Array<{ invoiceNumber: string; row: number; message: string }> = [];
    const imported: string[] = [];
    const skipped: string[] = [];

    for (const [invoiceNumber, invoiceRows] of grouped) {
      const first = invoiceRows[0];
      const firstRow = Number(first._row);
      try {
        if (!invoiceNumber) throw new Error('Nomor invoice wajib diisi.');
        if (knownNumbers.has(invoiceNumber.toLowerCase())) {
          skipped.push(invoiceNumber);
          continue;
        }

        for (const row of invoiceRows) {
          const empty = requiredColumns.filter((column) => !String(row[column] || '').trim());
          if (empty.length) throw new Error(`Baris ${row._row}: nilai wajib kosong (${empty.join(', ')}).`);
          if (row.branch_code.trim().toUpperCase() !== first.branch_code.trim().toUpperCase()) {
            throw new Error(`Baris ${row._row}: satu nomor invoice tidak boleh memiliki cabang berbeda.`);
          }
          if (!isDate(row.issue_date) || !isDate(row.due_date)) {
            throw new Error(`Baris ${row._row}: tanggal harus berformat YYYY-MM-DD.`);
          }
          if (row.due_date < row.issue_date) throw new Error(`Baris ${row._row}: jatuh tempo mendahului tanggal terbit.`);
          if (numberValue(row.quantity) <= 0 || numberValue(row.amount) < 0) {
            throw new Error(`Baris ${row._row}: quantity harus lebih dari 0 dan amount tidak boleh negatif.`);
          }
        }

        const branchCode = first.branch_code.trim().toUpperCase();
        const branch = branches.find((item) => item.code.toUpperCase() === branchCode);
        if (!branch) throw new Error(`Kode cabang ${branchCode} tidak ditemukan.`);

        const phone = normalizePhone(first.customer_phone);
        const email = first.customer_email?.trim().toLowerCase() || '';
        let customer = mutableCustomers.find(
          (item) => item.branchId === branch.id && ((email && item.email.toLowerCase() === email) || normalizePhone(item.phone) === phone)
        );
        if (!customer) {
          customer = await addCustomer({
            companyName: first.customer_company.trim(),
            entityType: (first.entity_type || 'Lainnya') as any,
            serviceType: (first.service_type || 'virtual_office') as any,
            branchId: branch.id,
            picName: first.customer_pic.trim(),
            phone,
            email,
            address: first.customer_address?.trim() || '-',
            status: 'aktif',
            startDate: first.issue_date,
            notes: 'Dibuat otomatis melalui migrasi invoice massal',
          });
          mutableCustomers.push(customer);
        }

        const contract = first.contract_number
          ? contracts.find((item) => item.contractNumber.toLowerCase() === first.contract_number.trim().toLowerCase())
          : undefined;
        const items = invoiceRows.map((row) => ({
          id: '',
          description: row.description.trim(),
          itemType: (row.item_type === 'barang' ? 'barang' : 'jasa') as 'barang' | 'jasa',
          quantity: numberValue(row.quantity),
          amount: numberValue(row.amount),
          discountType: (row.discount_type === 'percentage' ? 'percentage' : 'nominal') as 'percentage' | 'nominal',
          discountValue: numberValue(row.discount_value),
          discountAmount: 0,
          taxName: row.tax_name?.trim() || 'PPN',
          taxPercent: numberValue(row.tax_percent),
          taxAmount: 0,
          total: 0,
        }));
        const totalTaxPercent = numberValue(first.total_tax_percent);
        const totalDiscountType = first.total_discount_type === 'percentage' ? 'percentage' : 'nominal';
        const totalTaxes = totalTaxPercent > 0 ? [{ name: first.total_tax_name?.trim() || 'PPN', percent: totalTaxPercent }] : [];
        const estimated = calculateInvoiceTotals(items, totalDiscountType, numberValue(first.total_discount_value), totalTaxes);
        const totalPaid = numberValue(first.total_paid);
        if (totalPaid < 0 || totalPaid > estimated.totalAmount) {
          throw new Error(`Total pembayaran harus berada di antara 0 dan ${estimated.totalAmount}.`);
        }
        const invoice = await addInvoice({
          invoiceNumber,
          branchId: branch.id,
          customerId: customer.id,
          contractId: contract?.id,
          issueDate: first.issue_date,
          dueDate: first.due_date,
          items,
          totalDiscountType,
          totalDiscountValue: numberValue(first.total_discount_value),
          totalTaxes,
          autoNotification: boolValue(first.auto_notification, false),
        });

        if (totalPaid > 0) {
          const paymentDate = first.payment_date || first.issue_date;
          if (!isDate(paymentDate)) throw new Error('Tanggal pembayaran harus berformat YYYY-MM-DD.');
          const payment = await recordInvoicePayment({
            invoiceId: invoice.id,
            amount: totalPaid,
            paymentDate,
            paymentMethod: first.payment_method?.trim() || 'Migrasi Sistem Lama',
            notes: 'Saldo awal hasil migrasi invoice',
            recordedBy: 'Import Migrasi',
          });
          if (!payment.success) throw new Error(payment.error || 'Pembayaran awal gagal disimpan.');
        }

        knownNumbers.add(invoiceNumber.toLowerCase());
        imported.push(invoiceNumber);
      } catch (error) {
        errors.push({ invoiceNumber: invoiceNumber || '(kosong)', row: firstRow, message: readableError(error) });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      data: { imported: imported.length, skipped: skipped.length, failed: errors.length, invoiceNumbers: imported, skippedNumbers: skipped, errors },
      error: errors.length ? `${errors.length} invoice gagal divalidasi atau disimpan.` : undefined,
    }, { status: imported.length || skipped.length ? 200 : errors.length ? 422 : 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: readableError(error, 'Impor invoice gagal diproses') }, { status: 500 });
  }
}
