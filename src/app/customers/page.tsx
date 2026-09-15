'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Send,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  X,
  RefreshCw,
  Filter,
  ShieldCheck,
  Clock,
  Check,
  Search,
} from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [sendingWaId, setSendingWaId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Add Customer / Contract Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    entityType: 'PT',
    serviceType: 'virtual_office',
    branchId: '',
    picName: '',
    phone: '',
    email: '',
    address: '',
    npwp: '',
    nib: '',
    officeId: '',
    rentalType: 'virtual',
    billingCycle: 'yearly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    rentPrice: 6000000,
  });

  const fetchData = async () => {
    try {
      const [cRes, ctrRes, bRes, oRes] = await Promise.all([
        fetch('/api/customers').then((r) => r.json()),
        fetch('/api/contracts').then((r) => r.json()),
        fetch('/api/branches').then((r) => r.json()),
        fetch('/api/offices').then((r) => r.json()),
      ]);
      setCustomers(cRes.data || []);
      setContracts(ctrRes.data || []);
      setBranches(bRes.data || []);
      setOffices(oRes.data || []);

      if (bRes.data?.length) {
        setForm((prev) => ({ ...prev, branchId: bRes.data[0].id }));
      }
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

  const handleVerifyTenant = async (customer: any) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customer,
          status: 'aktif',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice(`Tenant "${customer.companyName}" berhasil diverifikasi dan diaktifkan!`);
        fetchData();
      }
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleSendWaReminder = async (contract: any, customer: any) => {
    setSendingWaId(contract.id);
    setNotice(null);
    try {
      const branch = branches.find((b) => b.id === contract.branchId);
      const message =
        `*PENGINGAT PERPANJANGAN KONTRAK SEWA — BOffice*\n\n` +
        `Yth. Bapak/Ibu ${customer.picName} (${customer.companyName}),\n` +
        `Kami menginformasikan bahwa kontrak sewa layanan Anda di *BOffice ${branch?.name || ''}* akan berakhir pada tanggal *${contract.endDate}*.\n\n` +
        `Mohon konfirmasi perpanjangan sewa Anda agar hak operasional, legalitas domisili, dan kuota Meeting Room 8 jam/bulan tetap aktif tanpa jeda.\n\n` +
        `Terima kasih! 🙏\nTim BOffice Indonesia`;

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
      const cusRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName,
          entityType: form.entityType,
          serviceType: form.serviceType,
          branchId: form.branchId,
          picName: form.picName,
          phone: form.phone,
          email: form.email,
          address: form.address,
          npwp: form.npwp,
          nib: form.nib,
          status: 'aktif',
          startDate: form.startDate,
        }),
      });
      const cusData = await cusRes.json();
      if (!cusData.success) throw new Error(cusData.error);

      // Create Initial Contract
      await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: cusData.data.id,
          branchId: form.branchId,
          officeId: form.officeId,
          rentalType: form.rentalType,
          billingCycle: form.billingCycle,
          startDate: form.startDate,
          endDate: form.endDate,
          rentPrice: form.rentPrice,
        }),
      });

      setShowModal(false);
      setNotice('Data Tenant dan Kontrak Sewa baru berhasil dibuat!');
      fetchData();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesBranch = selectedBranch === 'all' || c.branchId === selectedBranch;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    const matchesSearch =
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.picName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    return matchesBranch && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Profil Data Penyewa (Tenant BOffice)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Database induk penyewa Virtual Office & Private Office lintas cabang, status verifikasi, dan manajemen siklus kontrak.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/register"
            target="_blank"
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all border border-slate-300 flex items-center gap-1.5"
          >
            <span>Tautan Form Registrasi Publik</span>
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tenant Baru</span>
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
            placeholder="Cari perusahaan, PIC, WhatsApp..."
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
              <option value="calon_tenant">Menunggu Verifikasi</option>
              <option value="aktif">Aktif</option>
              <option value="tidak_aktif">Tidak Aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenant Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Memuat data penyewa...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          Tidak ada data tenant yang sesuai dengan filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCustomers.map((customer) => {
            const customerContracts = contracts.filter((c) => c.customerId === customer.id);
            const branch = branches.find((b) => b.id === customer.branchId);
            const isPendingVerification = customer.status === 'calon_tenant';

            return (
              <div
                key={customer.id}
                className={`bg-white rounded-2xl border p-6 shadow-sm space-y-4 transition-all ${
                  isPendingVerification ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {customer.entityType || 'PT'}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">{customer.companyName}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> PIC: {customer.picName}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <Phone className="w-3.5 h-3.5" /> {customer.phone}
                      </span>
                    </div>
                  </div>

                  {isPendingVerification ? (
                    <button
                      onClick={() => handleVerifyTenant(customer)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Verifikasi & Aktifkan</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      Tenant Aktif
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Layanan:</span>
                    <span className="font-bold text-slate-800">
                      {customer.serviceType === 'virtual_office' ? 'Virtual Office' : 'Private Office'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Cabang Domisili:</span>
                    <span className="font-semibold text-blue-700">{branch?.name || 'Cabang BOffice'}</span>
                  </div>
                  {customer.npwp && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">NPWP:</span>
                      <span className="font-mono text-[11px]">{customer.npwp}</span>
                    </div>
                  )}
                  {customer.nib && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">NIB:</span>
                      <span className="font-mono text-[11px]">{customer.nib}</span>
                    </div>
                  )}
                </div>

                {/* Contracts List */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Kontrak Sewa:
                  </div>

                  {customerContracts.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">Belum ada kontrak sewa aktif diterbitkan.</div>
                  ) : (
                    customerContracts.map((contract) => {
                      const isExpiring = contract.status === 'expiring_soon';
                      return (
                        <div
                          key={contract.id}
                          className={`p-3.5 rounded-xl border space-y-2 ${
                            isExpiring ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50/60 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">{contract.contractNumber}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isExpiring ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isExpiring ? '⚠️ Akan Berakhir' : 'Aktif'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">
                              Masa Sewa: <strong className="text-slate-800">{contract.startDate}</strong> s/d <strong className="text-slate-900">{contract.endDate}</strong>
                            </span>
                            <span className="font-extrabold text-slate-900">
                              Rp {contract.rentPrice?.toLocaleString('id-ID')}
                            </span>
                          </div>

                          <div className="pt-1 flex justify-end">
                            <button
                              onClick={() => handleSendWaReminder(contract, customer)}
                              disabled={sendingWaId === contract.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm text-[11px] disabled:opacity-50"
                            >
                              {sendingWaId === contract.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>Kirim Remind WA H-30/H-14/H-1</span>
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Tambah Tenant & Kontrak Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Badan Usaha *</label>
                  <select
                    value={form.entityType}
                    onChange={(e) => setForm({ ...form, entityType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="PT">PT</option>
                    <option value="CV">CV</option>
                    <option value="Perorangan">Perorangan</option>
                    <option value="Yayasan">Yayasan</option>
                    <option value="Firma">Firma</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan *</label>
                  <input
                    type="text"
                    required
                    placeholder="PT Example Solusi"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Layanan *</label>
                  <select
                    value={form.serviceType}
                    onChange={(e) => setForm({ ...form, serviceType: e.target.value as any, rentalType: e.target.value === 'virtual_office' ? 'virtual' : 'physical' })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="virtual_office">Virtual Office</option>
                    <option value="private_office">Private Office</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cabang *</label>
                  <select
                    value={form.branchId}
                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama PIC *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama PIC"
                    value={form.picName}
                    onChange={(e) => setForm({ ...form, picName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="081234567890"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email PIC *</label>
                <input
                  type="email"
                  required
                  placeholder="pic@perusahaan.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tgl Mulai Sewa *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tgl Berakhir Sewa *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nilai Sewa (Rp) *</label>
                <input
                  type="number"
                  required
                  value={form.rentPrice}
                  onChange={(e) => setForm({ ...form, rentPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-600/20"
                >
                  Simpan Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
