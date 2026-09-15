'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  CalendarDays,
  CreditCard,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Send,
  Clock,
  DollarSign,
  CheckCircle2,
  GitFork,
  UserCheck,
  MapPin,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingWaId, setSendingWaId] = useState<string | null>(null);
  const [waNotice, setWaNotice] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [leadsRes, officesRes, customersRes, contractsRes, bookingsRes, invoicesRes, branchesRes] = await Promise.all([
        fetch('/api/leads').then((r) => r.json()),
        fetch('/api/offices').then((r) => r.json()),
        fetch('/api/customers').then((r) => r.json()),
        fetch('/api/contracts').then((r) => r.json()),
        fetch('/api/bookings').then((r) => r.json()),
        fetch('/api/invoices').then((r) => r.json()),
        fetch('/api/branches').then((r) => r.json()),
      ]);

      const leads = leadsRes.data || [];
      const offices = officesRes.data || [];
      const customers = customersRes.data || [];
      const contracts = contractsRes.data || [];
      const bookings = bookingsRes.data || [];
      const invoices = invoicesRes.data || [];
      const branches = branchesRes.data || [];

      const totalTenants = customers.filter((c: any) => c.status === 'aktif').length;
      const pendingVerifications = customers.filter((c: any) => c.status === 'calon_tenant').length;

      const activeContracts = contracts.filter((c: any) => c.status === 'active' || c.status === 'expiring_soon');
      const physicalRentals = activeContracts.filter((c: any) => c.rentalType === 'physical').length;
      const virtualRentals = activeContracts.filter((c: any) => c.rentalType === 'virtual').length;

      const totalRevenue = invoices.reduce((sum: number, i: any) => sum + (i.totalPaid || 0), 0);
      const totalOutstanding = invoices.reduce((sum: number, i: any) => sum + (i.remainingAmount || 0), 0);

      // Expiring Contracts (within 30 days)
      const expiringContracts = contracts.filter((c: any) => c.status === 'expiring_soon');

      setData({
        totalTenants,
        pendingVerifications,
        branchesCount: branches.length,
        activeContractsCount: activeContracts.length,
        physicalRentals,
        virtualRentals,
        totalRevenue,
        totalOutstanding,
        expiringContracts,
        customers,
        branches,
        bookings,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSendSingleWaReminder = async (contract: any) => {
    setSendingWaId(contract.id);
    setWaNotice(null);
    try {
      const customer = data.customers.find((c: any) => c.id === contract.customerId);
      const branch = data.branches.find((b: any) => b.id === contract.branchId);

      if (!customer) return;

      const message =
        `*PENGINGAT KONTRAK SEWA — BOffice*\n\n` +
        `Yth. ${customer.picName} (${customer.companyName}),\n` +
        `Kontrak sewa Anda di *BOffice ${branch?.name || ''}* akan berakhir pada *${contract.endDate}*.\n` +
        `Mohon konfirmasi perpanjangan sewa Anda agar operasional dan hak kuota Meeting Room 8 jam/bulan tetap aktif.\n\n` +
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

      const resData = await res.json();
      if (resData.success) {
        setWaNotice(`Pesan WhatsApp berhasil dikirim ke ${customer.companyName}!`);
        fetchDashboardData();
      } else {
        setWaNotice(`Gagal: ${resData.error}`);
      }
    } catch (err: any) {
      setWaNotice(`Error: ${err.message}`);
    } finally {
      setSendingWaId(null);
      setTimeout(() => setWaNotice(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with BOffice Logo & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-white/95 px-3 py-1.5 rounded-xl shadow-md">
              <img
                src="/logo.webp"
                alt="BOffice"
                className="h-7 w-auto object-contain"
              />
            </div>
            <span className="text-xs font-bold text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-800">
              Sistem Operasional v4.0
            </span>
          </div>
          <h1 className="text-xl font-extrabold tracking-wide">
            Pusat Pengelolaan BOffice Multi-Cabang
          </h1>
          <p className="text-slate-400 text-xs max-w-xl leading-relaxed">
            Manajemen operasional Virtual Office, Private Office, booking meeting room lintas cabang, invoice dengan kuitansi resmi, dan pengingat kontrak otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/attendance"
            target="_blank"
            className="text-xs bg-emerald-600 hover:bg-emerald-500 font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span>Portal Check-In Tamu</span>
          </Link>

          <Link
            href="/register"
            target="_blank"
            className="text-xs bg-blue-600 hover:bg-blue-500 font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Form Registrasi Tenant</span>
          </Link>
        </div>
      </div>

      {waNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{waNotice}</span>
        </div>
      )}

      {/* Pending Verifications Alert if any */}
      {data?.pendingVerifications > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-extrabold">{data.pendingVerifications} Pendaftaran Tenant Baru Menunggu Verifikasi!</span>
              <p className="text-amber-700 text-[11px] mt-0.5">Calon tenant telah mengisi form registrasi mandiri dan menunggu verifikasi admin.</p>
            </div>
          </div>
          <Link
            href="/customers"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[11px] transition-all shrink-0"
          >
            Lihat & Verifikasi
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Tenants */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Penyewa Aktif (Tenants)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{data?.totalTenants}</div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
              <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                {data?.physicalRentals} Private Office
              </span>
              <span>•</span>
              <span className="text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-medium">
                {data?.virtualRentals} Virtual Office
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Branches */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Cabang BOffice Beroperasi</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <GitFork className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{data?.branchesCount} Cabang</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Jakarta, Surabaya, Bali, Bandung
            </div>
          </div>
        </div>

        {/* Card 3: Total Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pembayaran Diterima</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700">
              Rp {data?.totalRevenue?.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Total pembayaran tercatat (Kuitansi)</div>
          </div>
        </div>

        {/* Card 4: Outstanding Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sisa Piutang Tagihan</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600">
              Rp {data?.totalOutstanding?.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Invoice belum lunas / bertahap</div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Expiring Contracts & WA Reminders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-slate-800 text-sm">Pengingat Kontrak Sewa (Mendekati Jatuh Tempo)</h2>
              </div>
              <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold border border-amber-200">
                {data?.expiringContracts?.length || 0} Kontrak
              </span>
            </div>

            {data?.expiringContracts?.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Tidak ada kontrak sewa yang mendekati masa habis.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3">Penyewa & Cabang</th>
                      <th className="pb-3">Layanan</th>
                      <th className="pb-3">Tgl Berakhir</th>
                      <th className="pb-3 text-right">Aksi WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.expiringContracts?.map((contract: any) => {
                      const customer = data.customers.find((c: any) => c.id === contract.customerId);
                      const branch = data.branches.find((b: any) => b.id === contract.branchId);

                      return (
                        <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 font-semibold text-slate-800">
                            <div>{customer?.companyName || 'N/A'}</div>
                            <div className="text-[11px] text-blue-600 font-normal">
                              BOffice {branch?.name || branch?.code}
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                              {contract.rentalType === 'physical' ? 'Private Office' : 'Virtual Office'} ({contract.billingCycle})
                            </span>
                          </td>
                          <td className="py-3 font-bold text-rose-600">
                            {contract.endDate}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleSendSingleWaReminder(contract)}
                              disabled={sendingWaId === contract.id}
                              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium text-[11px] shadow-sm transition-all disabled:opacity-50"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{sendingWaId === contract.id ? 'Mengirim...' : 'Kirim WA Reminder'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Branches Directory Quick Links */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-sm">Cabang BOffice & Check-In</h2>
              <Link href="/branches" className="text-xs text-blue-600 font-bold hover:underline">
                Kelola Cabang
              </Link>
            </div>

            <div className="space-y-3">
              {data?.branches?.map((b: any) => (
                <div key={b.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{b.name}</span>
                    <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                      {b.code}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">{b.city}</div>
                  <div className="pt-1 flex justify-end">
                    <Link
                      href={`/attendance/${b.code}`}
                      target="_blank"
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                    >
                      <span>Form Check-In Cabang</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
