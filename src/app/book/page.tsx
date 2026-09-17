'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  Building2,
  Phone,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  MapPin,
  QrCode,
  ExternalLink,
} from 'lucide-react';

function BookingFormInner() {
  const searchParams = useSearchParams();
  const branchParam = searchParams.get('branch');

  const [branches, setBranches] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success State
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    phone: '',
    tenantId: '',
    branchId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '15:00',
    endTime: '16:00',
    title: 'Rapat / Koordinasi Bisnis',
  });

  useEffect(() => {
    async function init() {
      try {
        const [bRes, cRes] = await Promise.all([
          fetch('/api/branches').then((r) => r.json()),
          fetch('/api/customers').then((r) => r.json()),
        ]);

        const branchList = bRes.data || [];
        // Only active verified tenants can be chosen per requirement!
        const tenantList = (cRes.data || []).filter((c: any) => c.status === 'aktif');

        setBranches(branchList);
        setTenants(tenantList);

        let initialBranchId = branchList.length > 0 ? branchList[0].id : '';
        if (branchParam) {
          const match = branchList.find(
            (b: any) => b.id === branchParam || b.code.toUpperCase() === branchParam.toUpperCase()
          );
          if (match) initialBranchId = match.id;
        }

        const initialTenantId = tenantList.length > 0 ? tenantList[0].id : '';

        setForm((prev) => ({
          ...prev,
          branchId: initialBranchId,
          tenantId: initialTenantId,
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [branchParam]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.name.trim() || !form.phone.trim() || !form.tenantId || !form.branchId) {
      setErrorMsg('Semua kolom wajib diisi lengkap.');
      return;
    }

    if (form.startTime >= form.endTime) {
      setErrorMsg('Jam selesai harus lebih besar dari jam mulai (contoh: 15.00 hingga 16.00).');
      return;
    }

    setSubmitting(true);
    try {
      const selectedTenant = tenants.find((t) => t.id === form.tenantId);
      const tenantName = selectedTenant ? selectedTenant.companyName : '';

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: form.branchId,
          customerId: form.tenantId,
          bookerName: form.name.trim(),
          bookerPhone: form.phone.trim(),
          title: `${form.title} (${form.name} - ${tenantName})`,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          createdBy: 'tenant',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || 'Gagal membuat booking.');
      } else {
        const branch = branches.find((b) => b.id === form.branchId);
        setConfirmedBooking({
          booking: data.data,
          branch,
          tenantName,
          bookerName: form.name,
          bookerPhone: form.phone,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBranchObj = branches.find((b) => b.id === form.branchId);

  return (
    <div
      className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white"
      style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}
    >
      <div
        className="max-w-xl w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-300/60 space-y-6 relative overflow-hidden"
        style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-400" />

        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 inline-flex items-center justify-center">
              <img
                src="/logo.webp"
                alt="BOffice Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Reservasi Ruang Rapat Publik</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Booking Meeting Room BOffice
          </h1>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            Silakan reservasi jadwal terlebih dahulu. Setelah berhasil booking, Anda dapat melakukan Check-In saat tiba di ruangan.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {confirmedBooking ? (
          /* SUCCESS SCREEN WITH DIRECT CHECK-IN BUTTON & BRANCH LINK */
          <div className="bg-emerald-50/70 p-6 rounded-2xl border border-emerald-200 text-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Booking Berhasil Dikonfirmasi!</h2>
              <p className="text-xs text-slate-600 mt-1">
                Jadwal ruang meeting Anda telah tersimpan di sistem BOffice.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl text-xs text-left space-y-2 border border-slate-200 font-sans shadow-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Cabang Ruang:</span>
                <span className="font-bold text-slate-900 text-right">
                  {confirmedBooking.branch?.name} ({confirmedBooking.branch?.code})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lembaga / Tenant:</span>
                <span className="font-bold text-blue-600">{confirmedBooking.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penanggung Jawab:</span>
                <span className="font-semibold text-slate-900">
                  {confirmedBooking.bookerName} ({confirmedBooking.bookerPhone})
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-500">Tanggal & Jam Sesi:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {confirmedBooking.booking.date} • {confirmedBooking.booking.startTime} - {confirmedBooking.booking.endTime}
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-blue-900 text-left leading-relaxed">
              💡 <strong>Langkah Selanjutnya:</strong> Saat tiba di lokasi cabang BOffice, masukkan nomor HP Anda <strong>({confirmedBooking.bookerPhone})</strong> pada halaman Check-In untuk memulai sesi rapat.
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/attendance/${confirmedBooking.branch?.code}`}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <span>Buka Check-In Cabang Ini</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setConfirmedBooking(null)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-all"
              >
                Booking Sesi Lain
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
            Memuat data cabang dan tenant...
          </div>
        ) : (
          /* BOOKING FORM */
          <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
            {/* Cabang Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" /> Pilih Cabang Ruang Meeting BOffice *
              </label>
              <select
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city}) — {b.code}
                  </option>
                ))}
              </select>
              {selectedBranchObj && (
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <span>📍 Alamat: {selectedBranchObj.address}</span>
                </p>
              )}
            </div>

            {/* Tenant / Lembaga Dropdown (MUST CHOOSE, NO MANUAL INPUT per user rule) */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" /> Lembaga / Perusahaan Tenant *
                </span>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Wajib Terdaftar
                </span>
              </label>

              <select
                value={form.tenantId}
                onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.companyName} ({t.entityType || 'Tenant'} - PIC: {t.picName})
                  </option>
                ))}
              </select>

              {/* Requirement Note: Lembaga harus terdaftar dulu */}
              <div className="mt-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Lembaga/perusahaan harus berstatus tenant aktif di BOffice.{' '}
                  <span className="text-slate-500">Belum terdaftar?</span>{' '}
                  <a
                    href="https://wa.me/628119876543?text=Halo%20Admin%20BOffice,%20saya%20ingin%20mendaftarkan%20lembaga/perusahaan%20saya%20sebagai%20tenant%20BOffice"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold underline hover:text-blue-700"
                  >
                    Hubungi Admin BOffice via WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Nama Booker & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" /> Nama Penanggung Jawab Rapat *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> No. WhatsApp / HP (Kunci Check-In) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="081234567890"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Nomor ini digunakan saat Check-In di depan ruangan.
                </p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-500" /> Tanggal *
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Dari Jam *
                </label>
                <input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Hingga Jam *
                </label>
                <input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Topic / Keperluan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Topik / Keperluan Rapat
              </label>
              <input
                type="text"
                placeholder="Contoh: Rapat Evaluasi Proyek / Diskusi Klien"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{submitting ? 'Memeriksa Jadwal & Menyimpan...' : 'Konfirmasi Booking Ruangan'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer info & Direct Check-in link */}
        <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sudah punya booking sebelumnya?</span>
          <Link
            href="/attendance"
            className="text-blue-600 hover:text-blue-700 font-bold underline"
          >
            Masuk ke Halaman Check-In Cabang →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PublicBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-slate-500 text-xs animate-pulse">Memuat formulir booking...</div>
        </div>
      }
    >
      <BookingFormInner />
    </Suspense>
  );
}
