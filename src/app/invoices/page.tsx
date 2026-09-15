'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Send,
  Printer,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  X,
  CreditCard,
  Building2,
  Trash2,
  Check,
  Receipt,
  Download,
  UploadCloud,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { terbilang } from '@/lib/terbilang';
import { csvEscape, parseCsv, type CsvRow } from '@/lib/csv';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [previewInvoice, setPreviewInvoice] = useState<any | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<{ payment: any; invoice: any } | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<CsvRow[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Transfer Bank BCA',
    notes: 'Pembayaran tagihan invoice',
    recordedBy: 'Admin BOffice',
  });

  // Create Invoice Form State
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    branchId: '',
    customerId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    autoNotification: true,
    totalDiscountType: 'nominal',
    totalDiscountValue: 0,
    totalTaxName: 'PPN 11%',
    totalTaxPercent: 0,
  });

  const [invoiceItems, setInvoiceItems] = useState<any[]>([
    {
      description: 'Sewa Virtual Office / Private Office BOffice',
      itemType: 'jasa',
      quantity: 1,
      amount: 6000000,
      discountType: 'nominal',
      discountValue: 0,
      taxName: 'PPN',
      taxPercent: 11,
    },
  ]);

  const [sendingWaId, setSendingWaId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const downloadImportTemplate = () => {
    const headers = ['invoice_number','branch_code','customer_company','customer_pic','customer_phone','customer_email','customer_address','entity_type','service_type','contract_number','issue_date','due_date','description','item_type','quantity','amount','discount_type','discount_value','tax_name','tax_percent','total_discount_type','total_discount_value','total_tax_name','total_tax_percent','total_paid','payment_date','payment_method','auto_notification'];
    const example = ['INV/DPS-DIP/2026/001','DPS-DIP','PT Contoh Tenant','Made Contoh','081234567890','finance@contoh.id','Denpasar','PT','virtual_office','','2026-09-01','2026-09-15','Sewa Virtual Office September','jasa','1','6000000','nominal','0','PPN','11','nominal','0','','0','0','','','false'];
    const content = [headers, example].map((row) => row.map(csvEscape).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'template-import-invoice-boffice.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file?: File) => {
    setImportRows([]);
    setImportResult(null);
    setImportError(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportError('Gunakan file CSV. Unduh template agar urutan kolom sesuai.');
      return;
    }
    try {
      const rows = parseCsv(await file.text());
      setImportRows(rows);
      setImportFileName(file.name);
    } catch (error: any) {
      setImportError(error?.message || 'File CSV tidak dapat dibaca.');
    }
  };

  const handleImportInvoices = async () => {
    if (!importRows.length) return;
    setImporting(true);
    setImportError(null);
    try {
      const response = await fetch('/api/invoices/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: importRows }),
      });
      const result = await response.json();
      setImportResult(result.data || null);
      if (!response.ok && !result.data) setImportError(typeof result.error === 'string' ? result.error : 'Impor invoice gagal.');
      if (result.data?.imported > 0) {
        setNotice(`${result.data.imported} invoice berhasil diimpor dari ${importFileName}.`);
        await fetchData();
      }
    } catch (error: any) {
      setImportError(error?.message || 'Tidak dapat menghubungi server.');
    } finally {
      setImporting(false);
    }
  };

  const fetchData = async () => {
    try {
      const [invRes, cusRes, bRes] = await Promise.all([
        fetch('/api/invoices').then((r) => r.json()),
        fetch('/api/customers').then((r) => r.json()),
        fetch('/api/branches').then((r) => r.json()),
      ]);
      setInvoices(invRes.data || []);
      setCustomers(cusRes.data || []);
      setBranches(bRes.data || []);

      if (bRes.data?.length) {
        setNewInvoiceForm((f) => ({ ...f, branchId: bRes.data[0].id }));
      }
      if (cusRes.data?.length) {
        setNewInvoiceForm((f) => ({ ...f, customerId: cusRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItemRow = () => {
    setInvoiceItems([
      ...invoiceItems,
      {
        description: '',
        itemType: 'jasa',
        quantity: 1,
        amount: 0,
        discountType: 'nominal',
        discountValue: 0,
        taxName: 'PPN',
        taxPercent: 0,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalTaxes =
        newInvoiceForm.totalTaxPercent > 0
          ? [{ name: newInvoiceForm.totalTaxName, percent: Number(newInvoiceForm.totalTaxPercent) }]
          : [];

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: newInvoiceForm.branchId,
          customerId: newInvoiceForm.customerId,
          issueDate: newInvoiceForm.issueDate,
          dueDate: newInvoiceForm.dueDate,
          items: invoiceItems,
          totalDiscountType: newInvoiceForm.totalDiscountType,
          totalDiscountValue: Number(newInvoiceForm.totalDiscountValue || 0),
          totalTaxes,
          autoNotification: newInvoiceForm.autoNotification,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNotice(`Invoice ${data.data.invoiceNumber} baru berhasil diterbitkan!`);
        fetchData();
      } else {
        alert(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleOpenPaymentModal = (invoice: any) => {
    setPaymentModalInvoice(invoice);
    setPaymentForm({
      amount: invoice.remainingAmount > 0 ? invoice.remainingAmount : invoice.totalAmount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Transfer Bank BCA',
      notes: 'Pembayaran sewa BOffice',
      recordedBy: 'Admin BOffice',
    });
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;
    try {
      const res = await fetch('/api/invoices/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: paymentModalInvoice.id,
          amount: Number(paymentForm.amount),
          paymentDate: paymentForm.paymentDate,
          paymentMethod: paymentForm.paymentMethod,
          notes: paymentForm.notes,
          recordedBy: paymentForm.recordedBy,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const payment = data.data.payment;
        const updatedInvoice = data.data.invoice;
        setPaymentModalInvoice(null);
        setNotice(`Pembayaran Rp ${Number(payment.amount).toLocaleString('id-ID')} berhasil dicatat! Kuitansi ${payment.receiptNumber} diterbitkan.`);
        fetchData();
        // Auto-open receipt modal
        setPreviewReceipt({ payment, invoice: updatedInvoice });
      } else {
        alert(`Gagal mencatat pembayaran: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSendInvoiceWa = async (invoice: any) => {
    setSendingWaId(invoice.id);
    setNotice(null);
    try {
      const customer = customers.find((c) => c.id === invoice.customerId);
      if (!customer) return;

      const message =
        `*TAGIHAN RESMI (INVOICE) — BOffice*\n\n` +
        `Yth. ${customer.companyName} (PIC: ${customer.picName}),\n` +
        `Berikut pengingat tagihan invoice *${invoice.invoiceNumber}*:\n` +
        `• Total Tagihan: *Rp ${invoice.totalAmount?.toLocaleString('id-ID')}*\n` +
        `• Total Terbayar: Rp ${invoice.totalPaid?.toLocaleString('id-ID')}\n` +
        `• Sisa Tagihan: *Rp ${invoice.remainingAmount?.toLocaleString('id-ID')}*\n` +
        `• Jatuh Tempo: *${invoice.dueDate}*\n` +
        `• Status: *${invoice.status.toUpperCase().replace('_', ' ')}*\n\n` +
        `Pembayaran dapat ditransfer ke:\n` +
        `*BCA 8800-1234-5678* a.n. PT BOffice Solusi Ruang.\n\n` +
        `Terima kasih! 🙏\nTim BOffice Indonesia`;

      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customer.phone,
          message,
          messageType: 'invoice',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotice(`Invoice ${invoice.invoiceNumber} berhasil dikirim via WhatsApp ke ${customer.companyName}!`);
        fetchData();
      } else {
        setNotice(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    } finally {
      setSendingWaId(null);
      setTimeout(() => setNotice(null), 5000);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesBranch = selectedBranch === 'all' || inv.branchId === selectedBranch;
    const matchesStatus = selectedStatus === 'all' || inv.status === selectedStatus;
    const customer = customers.find((c) => c.id === inv.customerId);
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer && customer.companyName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesBranch && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Invoice, Penagihan & Kuitansi (BOffice)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Penerbitan faktur tagihan dengan diskon & pajak fleksibel per item/total, pembayaran bertahap, dan penerbitan kuitansi PDF resmi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowImportModal(true); setImportError(null); setImportResult(null); }}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            <span>Import Invoice</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Terbitkan Invoice Baru</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari no. invoice, nama tenant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Cabang:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Semua Cabang</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="belum_dibayar">Belum Dibayar</option>
              <option value="dibayar_sebagian">Dibayar Sebagian</option>
              <option value="lunas">Lunas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Memuat data invoice & pembayaran...</div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          Tidak ada invoice yang sesuai dengan filter.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-4">No. Invoice & Cabang</th>
                  <th className="p-4">Tenant / Customer</th>
                  <th className="p-4">Total Tagihan</th>
                  <th className="p-4">Terbayar & Sisa</th>
                  <th className="p-4">Status Bayar</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => {
                  const customer = customers.find((c) => c.id === invoice.customerId);
                  const branch = branches.find((b) => b.id === invoice.branchId);

                  const isLunas = invoice.status === 'lunas';
                  const isSebagian = invoice.status === 'dibayar_sebagian';

                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 font-mono text-xs">
                          {invoice.invoiceNumber}
                        </div>
                        <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
                          {branch?.name || branch?.code}
                        </div>
                        <div className="text-[10px] text-slate-400">Jatuh Tempo: {invoice.dueDate}</div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-900">{customer?.companyName || 'N/A'}</div>
                        <div className="text-[11px] text-slate-500">{customer?.picName} ({customer?.phone})</div>
                      </td>

                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 text-sm">
                          Rp {invoice.totalAmount?.toLocaleString('id-ID')}
                        </div>
                        {invoice.totalTaxAmount > 0 && (
                          <div className="text-[10px] text-slate-500">
                            Termasuk Pajak: Rp {invoice.totalTaxAmount.toLocaleString('id-ID')}
                          </div>
                        )}
                        {invoice.totalDiscountAmount > 0 && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Diskon: -Rp {invoice.totalDiscountAmount.toLocaleString('id-ID')}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="text-emerald-700 font-bold">
                          Terbayar: Rp {(invoice.totalPaid || 0).toLocaleString('id-ID')}
                        </div>
                        <div className={`text-[11px] font-semibold mt-0.5 ${invoice.remainingAmount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          Sisa: Rp {(invoice.remainingAmount || 0).toLocaleString('id-ID')}
                        </div>
                        {invoice.payments && invoice.payments.length > 0 && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            {invoice.payments.length}x Pembayaran
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            isLunas
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isSebagian
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isLunas ? 'LUNAS' : isSebagian ? 'DIBAYAR SEBAGIAN' : 'BELUM DIBAYAR'}
                        </span>
                      </td>

                      <td className="p-4 text-right space-x-1.5">
                        {/* Print Invoice */}
                        <button
                          onClick={() => setPreviewInvoice(invoice)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                          title="Lihat / Cetak Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Record Payment Button */}
                        {!isLunas && (
                          <button
                            onClick={() => handleOpenPaymentModal(invoice)}
                            className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-all inline-flex items-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Catat Bayar</span>
                          </button>
                        )}

                        {/* Send WA */}
                        <button
                          onClick={() => handleSendInvoiceWa(invoice)}
                          disabled={sendingWaId === invoice.id}
                          className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50"
                          title="Kirim Tagihan via WhatsApp"
                        >
                          <Send className="w-3 h-3" />
                          <span>{sendingWaId === invoice.id ? 'Mengirim...' : 'WA'}</span>
                        </button>

                        {/* View Receipt if has payment */}
                        {invoice.payments && invoice.payments.length > 0 && (
                          <button
                            onClick={() =>
                              setPreviewReceipt({
                                payment: invoice.payments[invoice.payments.length - 1],
                                invoice,
                              })
                            }
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Cetak Kuitansi Terakhir"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL (PRD 5.6) */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Catat Pembayaran Invoice</h3>
                <p className="text-xs text-slate-500">{paymentModalInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setPaymentModalInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Tagihan:</span>
                <span className="font-bold text-slate-900">Rp {paymentModalInvoice.totalAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sudah Dibayar:</span>
                <span className="text-emerald-700 font-bold">Rp {(paymentModalInvoice.totalPaid || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span className="text-slate-700 font-semibold">Sisa Tagihan:</span>
                <span className="text-rose-600 font-extrabold text-sm">Rp {paymentModalInvoice.remainingAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jumlah Pembayaran Diterima (Rp) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Mendukung pembayaran bertahap / cicilan. Sistem otomatis menghitung sisa tagihan.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Pembayaran *</label>
                <input
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Metode Pembayaran *</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Transfer Bank BCA">Transfer Bank BCA (8800-1234-5678)</option>
                  <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                  <option value="QRIS / Virtual Account">QRIS / Virtual Account</option>
                  <option value="Tunai / Cash">Tunai / Cash di Resepsionis</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dicatat Oleh *</label>
                <input
                  type="text"
                  required
                  value={paymentForm.recordedBy}
                  onChange={(e) => setPaymentForm({ ...paymentForm, recordedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20"
                >
                  Simpan & Terbitkan Kuitansi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT / KUITANSI MODAL (PRD 5.6 & Versi 4.0) */}
      {previewReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 text-slate-900 border border-slate-200">
            {/* Receipt Header with Logo */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.webp"
                  alt="BOffice"
                  className="h-10 w-auto object-contain"
                />
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">PT BOffice Solusi Ruang</h2>
                  <p className="text-[11px] text-slate-500">Gedung Menara BOffice • Virtual Office & Private Office</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black tracking-widest uppercase bg-slate-900 text-white px-3 py-1 rounded-md">
                  KUITANSI RESMI
                </span>
                <div className="font-mono text-xs font-bold text-slate-900 mt-1">
                  {previewReceipt.payment.receiptNumber}
                </div>
              </div>
            </div>

            {/* Receipt Body Table */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-500">Telah Diterima Dari:</span>
                <span className="col-span-2 font-bold text-slate-900 text-sm">
                  {customers.find((c) => c.id === previewReceipt.invoice.customerId)?.companyName}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-500">Uang Sejumlah:</span>
                <span className="col-span-2 font-bold italic text-blue-900 bg-blue-50/80 p-2.5 rounded-xl border border-blue-200 text-xs leading-relaxed">
                  # {terbilang(previewReceipt.payment.amount)} #
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-500">Untuk Pembayaran:</span>
                <span className="col-span-2 text-slate-800">
                  Pembayaran tagihan invoice <strong className="font-mono">{previewReceipt.invoice.invoiceNumber}</strong> ({previewReceipt.payment.notes || 'Layanan Sewa Kantor BOffice'})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-500">Metode & Tanggal:</span>
                <span className="col-span-2 text-slate-800">
                  {previewReceipt.payment.paymentMethod} • Tanggal {previewReceipt.payment.paymentDate}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Total Diterima:</span>
                  <span className="text-xl font-black text-emerald-700">
                    Rp {previewReceipt.payment.amount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Status & Sisa Tagihan:</span>
                  <span className="font-bold text-slate-800 block">
                    {previewReceipt.invoice.status === 'lunas' ? '✅ LUNAS SEPENUHNYA' : `Sisa: Rp ${previewReceipt.invoice.remainingAmount.toLocaleString('id-ID')}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="flex justify-between items-end pt-6 text-xs">
              <div className="text-slate-400 text-[10px]">
                Dokumen bukti pembayaran sah diterbitkan secara otomatis oleh Sistem BOffice v4.0.
              </div>
              <div className="text-center space-y-12">
                <div className="text-slate-600 font-medium">BOffice Indonesia,</div>
                <div className="border-b border-slate-900 pb-1 font-bold text-slate-900">
                  {previewReceipt.payment.recordedBy || 'Finance BOffice'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Print Kuitansi</span>
              </button>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE INVOICE MODAL (PRD 5.6) */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 text-slate-900 border border-slate-200">
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.webp"
                  alt="BOffice"
                  className="h-9 w-auto object-contain"
                />
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">PT BOffice Solusi Ruang</h2>
                  <p className="text-[11px] text-slate-500">Penyedia Layanan Virtual Office & Private Office</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black tracking-widest uppercase bg-blue-600 text-white px-3 py-1 rounded-md">
                  FAKTUR INVOICE
                </span>
                <div className="font-mono text-xs font-bold text-slate-900 mt-1">
                  {previewInvoice.invoiceNumber}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Diterbitkan Oleh:</span>
                <div className="font-bold text-slate-900 text-sm">
                  {branches.find((b) => b.id === previewInvoice.branchId)?.name || 'BOffice'}
                </div>
                <div className="text-slate-500 mt-0.5">
                  {branches.find((b) => b.id === previewInvoice.branchId)?.address}
                </div>
                <div className="text-slate-500">
                  Telp: {branches.find((b) => b.id === previewInvoice.branchId)?.phone}
                </div>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Ditujukan Kepada:</span>
                <div className="font-bold text-slate-900 text-sm">
                  {customers.find((c) => c.id === previewInvoice.customerId)?.companyName}
                </div>
                <div className="text-slate-500 mt-0.5">
                  PIC: {customers.find((c) => c.id === previewInvoice.customerId)?.picName}
                </div>
                <div className="text-slate-500">
                  WA: {customers.find((c) => c.id === previewInvoice.customerId)?.phone}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <th className="p-3">Deskripsi Item</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Harga</th>
                    <th className="p-3 text-right">Diskon/Pajak</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewInvoice.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-3 text-slate-800 font-medium">
                        <div>{item.description}</div>
                        <span className="text-[10px] text-slate-400 capitalize">{item.itemType}</span>
                      </td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">Rp {item.amount?.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right text-[11px] text-slate-500">
                        {item.discountAmount > 0 && <div className="text-emerald-600">-Rp {item.discountAmount.toLocaleString('id-ID')}</div>}
                        {item.taxAmount > 0 && <div className="text-slate-600">+{item.taxName} Rp {item.taxAmount.toLocaleString('id-ID')}</div>}
                      </td>
                      <td className="p-3 text-right font-bold">Rp {item.total?.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown */}
            <div className="flex items-start justify-between pt-2 border-t border-slate-200 text-xs">
              <div className="text-slate-500 space-y-1">
                <div className="font-bold text-slate-700">Instruksi Pembayaran:</div>
                <div>BCA 8800-1234-5678 a.n. PT BOffice Solusi Ruang</div>
                <div className="text-[11px] text-slate-400">Jatuh Tempo: {previewInvoice.dueDate}</div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-slate-500">Subtotal Item: Rp {previewInvoice.subtotal?.toLocaleString('id-ID')}</div>
                {previewInvoice.totalDiscountAmount > 0 && (
                  <div className="text-emerald-600 font-semibold">Diskon Total: -Rp {previewInvoice.totalDiscountAmount.toLocaleString('id-ID')}</div>
                )}
                {previewInvoice.totalTaxAmount > 0 && (
                  <div className="text-slate-600">Pajak Total: +Rp {previewInvoice.totalTaxAmount.toLocaleString('id-ID')}</div>
                )}
                <div className="text-xl font-black text-blue-700 pt-1 border-t border-slate-200">
                  Total: Rp {previewInvoice.totalAmount?.toLocaleString('id-ID')}
                </div>
                <div className="text-xs font-bold text-emerald-700">
                  Terbayar: Rp {(previewInvoice.totalPaid || 0).toLocaleString('id-ID')}
                </div>
                {previewInvoice.remainingAmount > 0 && (
                  <div className="text-xs font-extrabold text-rose-600">
                    Sisa: Rp {previewInvoice.remainingAmount.toLocaleString('id-ID')}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Print PDF</span>
              </button>
              <button
                onClick={() => setPreviewInvoice(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK INVOICE MIGRATION */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Migrasi Invoice Massal</h3>
                  <p className="text-[11px] text-slate-500">Unggah CSV, periksa data, lalu impor ke database BOffice.</p>
                </div>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-3 gap-2">
                {['1. Siapkan CSV', '2. Validasi data', '3. Import database'].map((step, index) => (
                  <div key={step} className={`rounded-xl border px-3 py-2 font-semibold ${index === 0 || importRows.length || importResult ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                    {step}
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-dashed border-blue-300 bg-blue-50/50 p-6 text-center">
                <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800">Pilih file CSV dari sistem lama</p>
                <p className="text-[11px] text-slate-500 mt-1">Maksimal 2.000 baris. Baris dengan nomor invoice sama akan digabung menjadi beberapa item.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
                    Pilih CSV
                    <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => handleImportFile(event.target.files?.[0])} />
                  </label>
                  <button type="button" onClick={downloadImportTemplate} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold inline-flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Unduh Template
                  </button>
                </div>
              </div>

              {importError && <div role="alert" className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700"><strong className="block mb-0.5">File belum dapat diproses</strong>{importError}</div>}

              {importRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div><strong className="text-slate-800">{importFileName}</strong><span className="text-slate-500"> · {importRows.length} baris · {new Set(importRows.map((row) => row.invoice_number)).size} invoice</span></div>
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 font-semibold">CSV terbaca</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="min-w-full text-[11px]">
                      <thead className="bg-slate-50 text-slate-500"><tr>{['Baris','Invoice','Cabang','Tenant','Tanggal','Deskripsi','Nilai'].map((label) => <th key={label} className="px-3 py-2 text-left font-semibold">{label}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {importRows.slice(0, 6).map((row, index) => <tr key={index}><td className="px-3 py-2 text-slate-400">{index + 2}</td><td className="px-3 py-2 font-mono font-semibold whitespace-nowrap">{row.invoice_number || '—'}</td><td className="px-3 py-2 whitespace-nowrap">{row.branch_code || '—'}</td><td className="px-3 py-2 whitespace-nowrap">{row.customer_company || '—'}</td><td className="px-3 py-2 whitespace-nowrap">{row.issue_date || '—'}</td><td className="px-3 py-2 min-w-44">{row.description || '—'}</td><td className="px-3 py-2 text-right whitespace-nowrap">Rp {Number(row.amount || 0).toLocaleString('id-ID')}</td></tr>)}
                      </tbody>
                    </table>
                  </div>
                  {importRows.length > 6 && <p className="text-[10px] text-slate-400">Pratinjau 6 dari {importRows.length} baris.</p>}
                </div>
              )}

              {importResult && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div><div className="text-lg font-black text-emerald-700">{importResult.imported}</div><div className="text-[10px] text-slate-500">Berhasil</div></div>
                    <div><div className="text-lg font-black text-amber-600">{importResult.skipped}</div><div className="text-[10px] text-slate-500">Duplikat dilewati</div></div>
                    <div><div className="text-lg font-black text-rose-600">{importResult.failed}</div><div className="text-[10px] text-slate-500">Gagal</div></div>
                  </div>
                  {importResult.errors?.length > 0 && <div className="max-h-32 overflow-y-auto space-y-1">{importResult.errors.map((item: any, index: number) => <div key={index} className="text-rose-700 bg-white border border-rose-100 rounded-lg px-3 py-2">Baris {item.row} · {item.invoiceNumber}: {item.message}</div>)}</div>}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowImportModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Tutup</button>
                <button type="button" disabled={!importRows.length || importing} onClick={handleImportInvoices} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold inline-flex items-center gap-2">
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  {importing ? 'Mengimpor...' : 'Import ke Database'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL WITH FLEXIBLE DISCOUNTS & TAXES (PRD 5.6) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Terbitkan Invoice Baru BOffice</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cabang Penerbit *</label>
                  <select
                    value={newInvoiceForm.branchId}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, branchId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penyewa (Tenant) *</label>
                  <select
                    value={newInvoiceForm.customerId}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, customerId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.picName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Terbit *</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceForm.issueDate}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jatuh Tempo *</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceForm.dueDate}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Baris Item Tagihan:</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris Item</span>
                  </button>
                </div>

                {invoiceItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[11px] text-slate-600">Item #{idx + 1}</span>
                      {invoiceItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-2">
                        <input
                          type="text"
                          required
                          placeholder="Deskripsi Item / Layanan"
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...invoiceItems];
                            updated[idx].description = e.target.value;
                            setInvoiceItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <select
                          value={item.itemType}
                          onChange={(e) => {
                            const updated = [...invoiceItems];
                            updated[idx].itemType = e.target.value;
                            setInvoiceItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="jasa">Jasa</option>
                          <option value="barang">Barang</option>
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...invoiceItems];
                            updated[idx].quantity = Number(e.target.value);
                            setInvoiceItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-center"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Harga Satuan (Rp)</label>
                        <input
                          type="number"
                          required
                          value={item.amount}
                          onChange={(e) => {
                            const updated = [...invoiceItems];
                            updated[idx].amount = Number(e.target.value);
                            setInvoiceItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Diskon Item (Rp)</label>
                        <input
                          type="number"
                          value={item.discountValue || 0}
                          onChange={(e) => {
                            const updated = [...invoiceItems];
                            updated[idx].discountValue = Number(e.target.value);
                            setInvoiceItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Pajak Item (%)</label>
                        <input
                          type="number"
                          value={item.taxPercent || 0}
                          onChange={(e) => {
                            const updated = [...invoiceItems];
                            updated[idx].taxPercent = Number(e.target.value);
                            setInvoiceItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Discount & Taxes */}
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
                <span className="font-bold text-slate-800 text-xs">Diskon & Pajak Total Invoice (Opsional):</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Diskon Total (Nominal Rp):</label>
                    <input
                      type="number"
                      value={newInvoiceForm.totalDiscountValue}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, totalDiscountValue: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Pajak Total (%):</label>
                    <input
                      type="number"
                      placeholder="Contoh: 11"
                      value={newInvoiceForm.totalTaxPercent}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, totalTaxPercent: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Auto Notification Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700">Kirim Notifikasi Otomatis via WhatsApp:</span>
                <input
                  type="checkbox"
                  checked={newInvoiceForm.autoNotification}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, autoNotification: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20"
                >
                  Terbitkan Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
