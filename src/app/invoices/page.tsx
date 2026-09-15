'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Send,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  DollarSign,
  X,
  Building2,
} from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Invoice for Printable Preview Modal
  const [previewInvoice, setPreviewInvoice] = useState<any | null>(null);

  // New Invoice Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    customerId: '',
    dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    itemDesc: 'Perpanjangan Sewa Kantor / Virtual Office',
    itemPrice: 160000000,
    itemQty: 1,
  });

  const [sendingWaId, setSendingWaId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [invRes, cusRes] = await Promise.all([
        fetch('/api/invoices').then((r) => r.json()),
        fetch('/api/customers').then((r) => r.json()),
      ]);
      setInvoices(invRes.data || []);
      setCustomers(cusRes.data || []);
      if (cusRes.data?.length) {
        setNewInvoiceForm((prev) => ({ ...prev, customerId: cusRes.data[0].id }));
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

  const handleSendInvoiceWa = async (invoice: any) => {
    setSendingWaId(invoice.id);
    setNotice(null);
    try {
      const customer = customers.find((c) => c.id === invoice.customerId);
      if (!customer) return;

      const message =
        `Halo Bapak/Ibu ${customer.picName} (${customer.companyName}),\n\n` +
        `Berikut diterbitkan tagihan faktur resmi *${invoice.invoiceNumber}*:\n` +
        `• Total Tagihan: *Rp ${invoice.totalAmount?.toLocaleString('id-ID')}*\n` +
        `• Jatuh Tempo: *${invoice.dueDate}*\n\n` +
        `Rincian item:\n` +
        invoice.items.map((i: any) => `- ${i.description}: Rp ${i.total?.toLocaleString('id-ID')}`).join('\n') +
        `\n\nPembayaran dapat ditransfer ke:\n` +
        `*BCA 8800-1234-5678* a.n. PT Nusantara Office Center.\n\n` +
        `Mohon upload atau konfirmasi bukti transfer jika sudah melakukan pembayaran. Terima kasih! 🙏`;

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
        setNotice(`Faktur Invoice ${invoice.invoiceNumber} berhasil dikirim via WhatsApp ke ${customer.companyName}!`);
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

  const handleMarkPaid = async (id: string) => {
    try {
      const res = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'paid' }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice('Status tagihan berhasil diubah menjadi LUNAS (Paid).');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: newInvoiceForm.customerId,
          dueDate: newInvoiceForm.dueDate,
          items: [
            {
              description: newInvoiceForm.itemDesc,
              amount: newInvoiceForm.itemPrice,
              quantity: newInvoiceForm.itemQty,
              total: newInvoiceForm.itemPrice * newInvoiceForm.itemQty,
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNotice(`Invoice ${data.data.invoiceNumber} baru berhasil diterbitkan!`);
        fetchData();
      }
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    const customer = customers.find((c) => c.id === inv.customerId);
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer && customer.companyName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sistem Invoicing & Faktur Tagihan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Penerbitan faktur tagihan sewa kantor, charge overage meeting room, status pembayaran, dan pengiriman otomatis via WhatsApp KirimDev.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Invoice Baru</span>
        </button>
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

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari no. invoice, nama customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {['all', 'pending', 'paid', 'overdue'].map((statusKey) => (
            <button
              key={statusKey}
              onClick={() => setFilterStatus(statusKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                filterStatus === statusKey
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {statusKey === 'all' ? 'Semua Status' : statusKey}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Memuat daftar invoice...</div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          Tidak ada invoice yang sesuai.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-4">No. Invoice & Tgl</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Rincian Item</th>
                  <th className="p-4 font-bold">Total Tagihan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => {
                  const customer = customers.find((c) => c.id === invoice.customerId);
                  const isPaid = invoice.status === 'paid';

                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{invoice.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-500">Jatuh Tempo: {invoice.dueDate}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-900">
                        <div>{customer?.companyName || 'N/A'}</div>
                        <div className="text-[11px] font-normal text-slate-400">{customer?.picName}</div>
                      </td>
                      <td className="p-4">
                        <ul className="space-y-1">
                          {invoice.items?.map((item: any, idx: number) => (
                            <li key={idx} className="text-slate-700">
                              • {item.description}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-4 font-extrabold text-slate-900 text-sm">
                        Rp {invoice.totalAmount?.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isPaid ? 'LUNAS (PAID)' : 'MENUNGGU PEMBAYARAN'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setPreviewInvoice(invoice)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                          title="Cetak / Preview Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {!isPaid && (
                          <button
                            onClick={() => handleMarkPaid(invoice.id)}
                            className="text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold px-2.5 py-1 rounded-lg transition-all border border-emerald-200"
                          >
                            Set Lunas
                          </button>
                        )}

                        <button
                          onClick={() => handleSendInvoiceWa(invoice)}
                          disabled={sendingWaId === invoice.id}
                          className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{sendingWaId === invoice.id ? 'Mengirim...' : 'Kirim WA Invoice'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Faktur Tagihan (Invoice)</h2>
                <p className="text-xs text-slate-500">{previewInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setPreviewInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Invoice Print Details */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <div className="font-bold text-slate-400 uppercase tracking-wider">Diterbitkan Oleh:</div>
                <div className="font-bold text-slate-900 text-sm mt-1">Nusantara Office Center</div>
                <div className="text-slate-500 mt-0.5">Gedung Menara Nusantara Lt. 12, Jakarta</div>
                <div className="text-slate-500">Telp: +62 811-9876-543</div>
              </div>
              <div>
                <div className="font-bold text-slate-400 uppercase tracking-wider">Ditujukan Kepada:</div>
                <div className="font-bold text-slate-900 text-sm mt-1">
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
                    <th className="p-3">Deskripsi Layanan</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Harga Satuan</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewInvoice.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-3 text-slate-800 font-medium">{item.description}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">Rp {item.amount?.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right font-bold">Rp {item.total?.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
              <div className="text-slate-500">
                <div className="font-bold text-slate-700">Instruksi Pembayaran:</div>
                <div>Bank BCA: 8800-1234-5678 a.n. PT Nusantara Office Center</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 uppercase font-semibold text-[10px]">Total Pembayaran:</div>
                <div className="text-xl font-black text-emerald-700">
                  Rp {previewInvoice.totalAmount?.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 text-xs flex items-center gap-1.5"
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Terbitkan Invoice Faktur Baru</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer / Tenant *</label>
                <select
                  value={newInvoiceForm.customerId}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.picName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Item Tagihan *</label>
                <input
                  type="text"
                  required
                  value={newInvoiceForm.itemDesc}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, itemDesc: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={newInvoiceForm.itemPrice}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, itemPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah (Qty) *</label>
                  <input
                    type="number"
                    required
                    value={newInvoiceForm.itemQty}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, itemQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tgl Jatuh Tempo *</label>
                <input
                  type="date"
                  required
                  value={newInvoiceForm.dueDate}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md shadow-emerald-600/20"
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
