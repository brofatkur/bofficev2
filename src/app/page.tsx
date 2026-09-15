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
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingWaId, setSendingWaId] = useState<string | null>(null);
  const [waNotice, setWaNotice] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [leadsRes, officesRes, customersRes, contractsRes, bookingsRes, invoicesRes] = await Promise.all([
        fetch('/api/leads').then((r) => r.json()),
        fetch('/api/offices').then((r) => r.json()),
        fetch('/api/customers').then((r) => r.json()),
        fetch('/api/contracts').then((r) => r.json()),
        fetch('/api/bookings').then((r) => r.json()),
        fetch('/api/invoices').then((r) => r.json()),
      ]);

      const leads = leadsRes.data || [];
      const offices = officesRes.data || [];
      const customers = customersRes.data || [];
      const contracts = contractsRes.data || [];
      const bookings = bookingsRes.data || [];
      const invoices = invoicesRes.data || [];

      // Calculate Metrics
      const totalLeads = leads.length;
      const closedWonLeads = leads.filter((l: any) => l.status === 'closed_won').length;
      const closingRate = totalLeads > 0 ? Math.round((closedWonLeads / totalLeads) * 100) : 0;

      const activeContracts = contracts.filter((c: any) => c.status === 'active' || c.status === 'expiring_soon');
      const physicalRentals = activeContracts.filter((c: any) => c.rentalType === 'physical').length;
      const virtualRentals = activeContracts.filter((c: any) => c.rentalType === 'virtual').length;

      const totalRevenue = invoices
        .filter((i: any) => i.status === 'paid')
        .reduce((sum: number, i: any) => sum + i.totalAmount, 0);

      const pendingInvoiceCount = invoices.filter((i: any) => i.status === 'pending' || i.status === 'overdue').length;

      // Expiring Contracts (within 30 days)
      const expiringContracts = contracts.filter((c: any) => c.status === 'expiring_soon');

      // Meeting Room Quota Usage per Customer for current month (2026-09)
      const currentMonth = '2026-09';
      const customerMeetingStats = customers.map((cus: any) => {
        const cusBookings = bookings.filter((b: any) => b.customerId === cus.id && b.date.startsWith(currentMonth));
        const usedHours = cusBookings.reduce((sum: number, b: any) => sum + b.durationHours, 0);
        const freeQuota = 8;
        const overageHours = Math.max(0, usedHours - freeQuota);
        const overageFee = overageHours * 90000;
        return {
          customer: cus,
          usedHours,
          remainingFree: Math.max(0, freeQuota - usedHours),
          overageHours,
          overageFee,
        };
      });

      setData({
        totalLeads,
        closingRate,
        closedWonLeads,
        activeContractsCount: activeContracts.length,
        physicalRentals,
        virtualRentals,
        totalRevenue,
        pendingInvoiceCount,
        expiringContracts,
        customerMeetingStats,
        customers,
        offices,
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
      const office = data.offices.find((o: any) => o.id === contract.officeId);

      if (!customer) return;

      const message = `Halo ${customer.picName} (${customer.companyName}),\n\n` +
        `Pengingat perpanjangan sewa *${office?.name || 'Kantor'}* yang akan berakhir pada *${contract.endDate}*.\n` +
        `Mohon konfirmasi kelanjutan sewa Anda.\n\n` +
        `Terima kasih,\nNusantara Office Center`;

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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stat Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <h1 className="text-xl font-bold">Dashboard Manajemen Penyewaan & CRM</h1>
          <p className="text-slate-300 text-xs mt-1">
            Ringkasan penyewaan kantor fisik, virtual office, CRM sales, dan kuota meeting room bulan ini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/crm"
            className="text-xs bg-emerald-600 hover:bg-emerald-500 font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
          >
            <span>+ Lead Sales Baru</span>
          </Link>
          <Link
            href="/meeting-rooms"
            className="text-xs bg-slate-800 hover:bg-slate-700 font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            <span>Booking Meeting</span>
          </Link>
        </div>
      </div>

      {waNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{waNotice}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Contracts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Kontrak Sewa Aktif</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{data?.activeContractsCount}</div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                {data?.physicalRentals} Fisik
              </span>
              <span>•</span>
              <span className="text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-medium">
                {data?.virtualRentals} Virtual Office
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: CRM Sales & Closing Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Closing Rate Sales</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{data?.closingRate}%</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {data?.closedWonLeads} dari {data?.totalLeads} Lead berhasil Closing
            </div>
          </div>
        </div>

        {/* Card 3: Pendapatan Lunas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pendapatan Terbayar</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              Rp {data?.totalRevenue?.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Total pembayaran sewa & overage</div>
          </div>
        </div>

        {/* Card 4: Meeting Room Usage & Overage Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Meeting Room Quota</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">8 Jam/Bln</div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">
              Over kuota: Rp 90.000 / jam
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Expiring Contracts & WA Reminders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expiring Contracts Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-slate-800 text-sm">Pengingat Perpanjangan Kontrak (Mendekati Expiry)</h2>
              </div>
              <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold border border-amber-200">
                {data?.expiringContracts?.length || 0} Kontrak
              </span>
            </div>

            {data?.expiringContracts?.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Tidak ada kontrak sewa yang mendekati masa habis dalam 30 hari ke depan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3">Perusahaan / Customer</th>
                      <th className="pb-3">Tipe Sewa</th>
                      <th className="pb-3">Tgl Berakhir</th>
                      <th className="pb-3 text-right">Aksi WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.expiringContracts?.map((contract: any) => {
                      const customer = data.customers.find((c: any) => c.id === contract.customerId);
                      const office = data.offices.find((o: any) => o.id === contract.officeId);
                      return (
                        <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 font-semibold text-slate-800">
                            <div>{customer?.companyName || 'N/A'}</div>
                            <div className="text-[11px] font-normal text-slate-400">{customer?.picName} ({customer?.phone})</div>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              contract.rentalType === 'physical' ? 'bg-emerald-50 text-emerald-700' : 'bg-teal-50 text-teal-700'
                            }`}>
                              {contract.rentalType === 'physical' ? 'Kantor Fisik' : 'Virtual Office'} ({contract.billingCycle})
                            </span>
                            <div className="text-[11px] text-slate-500 mt-0.5">{office?.name}</div>
                          </td>
                          <td className="py-3 text-slate-700 font-medium">
                            <div className="text-rose-600 font-bold">{contract.endDate}</div>
                            <div className="text-[10px] text-slate-400">Expiring Soon</div>
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

          {/* CRM Sales Pipeline Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 text-sm">Status Pipeline CRM Sales</h2>
              <Link href="/crm" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
                <span>Buka CRM Full</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-slate-400 font-semibold text-[10px] uppercase">Prospek</div>
                <div className="text-lg font-bold text-slate-800 mt-1">2</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                <div className="text-blue-600 font-semibold text-[10px] uppercase">Contacted</div>
                <div className="text-lg font-bold text-blue-700 mt-1">1</div>
              </div>
              <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                <div className="text-purple-600 font-semibold text-[10px] uppercase">Negotiation</div>
                <div className="text-lg font-bold text-purple-700 mt-1">1</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-emerald-700 font-semibold text-[10px] uppercase">Closing (Won)</div>
                <div className="text-lg font-bold text-emerald-800 mt-1">{data?.closedWonLeads}</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
                <div className="text-rose-600 font-semibold text-[10px] uppercase">Belum Closing</div>
                <div className="text-lg font-bold text-rose-700 mt-1">0</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Meeting Room Quota Tracker per Tenant */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Tracking Kuota Meeting Room</h2>
                <p className="text-[11px] text-slate-400">Pemakaian Bulan September 2026</p>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-200">
                Quota: 8 Jam/Bln
              </span>
            </div>

            <div className="space-y-4">
              {data?.customerMeetingStats?.map((stat: any) => (
                <div key={stat.customer.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{stat.customer.companyName}</span>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {stat.usedHours} / 8 Jam Terpakai
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stat.usedHours > 8 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (stat.usedHours / 8) * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    {stat.overageHours > 0 ? (
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        ⚠️ Over {stat.overageHours} Jam (+Rp {stat.overageFee.toLocaleString('id-ID')})
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium">
                        Sisa Kuota Gratis: {stat.remainingFree} Jam
                      </span>
                    )}

                    <Link
                      href="/meeting-rooms"
                      className="text-slate-500 hover:text-slate-800 underline text-[10px]"
                    >
                      Detail Booking
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              💡 *Setiap jam kelebihan setelah 8 jam otomatis dihitung Rp 90.000 / jam dan dimasukkan ke invoice.*
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
