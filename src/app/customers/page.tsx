'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Send,
  Building2,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  X,
  RefreshCw,
  FileCheck,
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [sendingWaId, setSendingWaId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Add Customer/Contract Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    picName: '',
    phone: '',
    email: '',
    address: '',
    officeId: '',
    rentalType: 'physical',
    billingCycle: 'yearly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    rentPrice: 160000000,
  });

  const fetchData = async () => {
    try {
      const [cRes, ctrRes, oRes] = await Promise.all([
        fetch('/api/customers').then((r) => r.json()),
        fetch('/api/contracts').then((r) => r.json()),
        fetch('/api/offices').then((r) => r.json()),
      ]);
      setCustomers(cRes.data || []);
      setContracts(ctrRes.data || []);
      setOffices(oRes.data || []);
      if (oRes.data?.length) {
        setForm((prev) => ({ ...prev, officeId: oRes.data[0].id }));
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

  const handleSendWaReminder = async (contract: any, customer: any, office: any) => {
    setSendingWaId(contract.id);
    setNotice(null);
    try {
      const message =
        `Halo Bapak/Ibu ${customer.picName} (${customer.companyName}),\n\n` +
        `Salam dari Nusantara Office Center.\n` +
        `Kami menginformasikan pengingat perpanjangan kontrak sewa *${office?.name || 'Kantor'}* Anda yang akan berakhir pada *${contract.endDate}*.\n\n` +
        `Manfaatkan perpanjangan tepat waktu untuk mempertahankan harga sewa dan jatah kuota Meeting Room 8 jam/bulan Anda.\n\n` +
        `Mohon balas pesan ini untuk konfirmasi perpanjangan sewa. Terima kasih! 🙏`;

      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customer.phone,
          message,
          messageType: 'contract_renewal',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotice(`Pesan Pengingat Perpanjangan WhatsApp berhasil dikirim ke ${customer.companyName}!`);
        // Update contract status
        await fetch('/api/contracts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: contract.id,
            status: 'expiring_soon',
            lastWaReminderSentAt: new Date().toISOString(),
          }),
        });
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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Create Customer
      const cusRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName,
          picName: form.picName,
          phone: form.phone,
          email: form.email,
          address: form.address,
        }),
      });
      const cusData = await cusRes.json();
      if (!cusData.success) throw new Error(cusData.error);

      // 2. Create Contract
      const ctrRes = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: cusData.data.id,
          officeId: form.officeId,
          rentalType: form.rentalType,
          billingCycle: form.billingCycle,
          startDate: form.startDate,
          endDate: form.endDate,
          rentPrice: form.rentPrice,
        }),
      });
      const ctrData = await ctrRes.json();
      if (ctrData.success) {
        setShowModal(false);
        setNotice('Customer dan Kontrak Sewa baru berhasil dibuat!');
        fetchData();
      }
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manajemen Customer & Kontrak Sewa</h1>
          <p className="text-xs text-slate-500 mt-1">
            Data tenant penyewa kantor fisik dan virtual office, tanggal berlaku masa sewa, dan pengingat perpanjangan via WhatsApp KirimDev API.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Customer & Kontrak</span>
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

      {/* Customer & Contract Cards */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Memuat data customer & kontrak...</div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          Belum ada customer terdaftar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {customers.map((customer) => {
            const customerContracts = contracts.filter((c) => c.customerId === customer.id);

            return (
              <div key={customer.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{customer.companyName}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> {customer.picName}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <Phone className="w-3.5 h-3.5" /> {customer.phone}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Tenant
                  </span>
                </div>

                {/* Contracts List */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Kontrak Sewa Aktif:
                  </div>

                  {customerContracts.length === 0 ? (
                    <div className="text-xs text-slate-400">Tidak ada kontrak aktif.</div>
                  ) : (
                    customerContracts.map((contract) => {
                      const office = offices.find((o) => o.id === contract.officeId);
                      const isExpiring = contract.status === 'expiring_soon';

                      return (
                        <div
                          key={contract.id}
                          className={`p-3.5 rounded-xl border space-y-2.5 ${
                            isExpiring ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">{contract.contractNumber}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isExpiring
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isExpiring ? '⚠️ Expiring Soon' : 'Aktif'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-700">
                            <div>
                              <div className="font-semibold">{office?.name || 'Kantor'}</div>
                              <div className="text-[11px] text-slate-500">
                                {contract.rentalType === 'physical' ? 'Kantor Fisik' : 'Virtual Office'} ({contract.billingCycle})
                              </div>
                            </div>
                            <div className="text-right font-bold text-slate-900">
                              Rp {contract.rentPrice?.toLocaleString('id-ID')}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                            <div className="text-slate-500">
                              Masa Sewa: <span className="font-semibold text-slate-800">{contract.startDate} s/d {contract.endDate}</span>
                            </div>

                            <button
                              onClick={() => handleSendWaReminder(contract, customer, office)}
                              disabled={sendingWaId === contract.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm text-[11px] disabled:opacity-50"
                            >
                              {sendingWaId === contract.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>Kirim Remind WA</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Tambah Customer & Kontrak Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan *</label>
                <input
                  type="text"
                  required
                  placeholder="PT Example Indonesia"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama PIC *</label>
                  <input
                    type="text"
                    required
                    placeholder="Bpk / Ibu..."
                    value={form.picName}
                    onChange={(e) => setForm({ ...form, picName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="+6281..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Ruangan / Virtual Office *</label>
                <select
                  value={form.officeId}
                  onChange={(e) => setForm({ ...form, officeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.type === 'physical' ? 'Kantor Fisik' : 'Virtual Office'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tgl Mulai Sewa *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tgl Berakhir Sewa *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nilai Kontrak Sewa (Rp) *</label>
                <input
                  type="number"
                  required
                  value={form.rentPrice}
                  onChange={(e) => setForm({ ...form, rentPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md shadow-emerald-600/20"
                >
                  Simpan Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
