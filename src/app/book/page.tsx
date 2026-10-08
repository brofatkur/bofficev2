'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, Building2, CalendarDays, CheckCircle2, Clock, LoaderCircle, MapPin, Phone, RefreshCw, Search, UserCheck, Users } from 'lucide-react';

type BookingBlock = { id: string; startTime: string; endTime: string; status: string };
type Availability = { room: { id: string; name: string }; bookings: BookingBlock[]; schedule: { isOpen: boolean; openTime?: string; closeTime?: string; reason?: 'closed_day'|'national_holiday'; holidayName?: string } };
const STEP_MINUTES = 30;
const DURATIONS = [30, 60, 120, 180, 240];
const toMinutes = (time: string) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const overlaps = (start: number, end: number, booking: BookingBlock) => start < toMinutes(booking.endTime) && end > toMinutes(booking.startTime);
const todayInBali = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' });

function BookingFormInner() {
  const searchParams = useSearchParams();
  const [branches, setBranches] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [tenantQuery, setTenantQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [searchingTenants, setSearchingTenants] = useState(false);
  const [tenantSearchComplete, setTenantSearchComplete] = useState(false);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);
  const [bookingType, setBookingType] = useState<'tenant' | 'general'>('tenant');
  const [duration, setDuration] = useState(60);
  const [generalOrganization, setGeneralOrganization] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', tenantId: '', branchId: '', date: todayInBali(), startTime: '', endTime: '', title: 'Rapat / Koordinasi Bisnis' });

  useEffect(() => {
    fetch('/api/branches').then(r => r.json())
      .then(branchResult => {
        const branchList = (branchResult.data || []).filter((branch: any) => branch.status === 'active');
        const requested = searchParams.get('branch');
        const selected = branchList.find((branch: any) => branch.id === requested || branch.code?.toUpperCase() === requested?.toUpperCase()) || branchList[0];
        setBranches(branchList);
        setForm(current => ({ ...current, branchId: selected?.id || '', tenantId: '' }));
      })
      .catch(() => setErrorMsg('Data booking gagal dimuat. Silakan coba lagi.'))
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    if (bookingType !== 'tenant' || selectedTenant) return;
    const words = tenantQuery.trim().split(/\s+/).filter(Boolean);
    setTenantSearchComplete(false);
    if (words.length < 2) { setTenants([]); setSearchingTenants(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchingTenants(true);
      try {
        const response = await fetch(`/api/bookings/tenant-search?q=${encodeURIComponent(tenantQuery.trim())}`, { cache: 'no-store', signal: controller.signal });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Pencarian perusahaan gagal.');
        setTenants(result.data || []); setTenantSearchComplete(true);
      } catch (error: any) {
        if (error.name !== 'AbortError') setErrorMsg(error.message);
      } finally { if (!controller.signal.aborted) setSearchingTenants(false); }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [tenantQuery, bookingType, selectedTenant]);

  const loadAvailability = useCallback(async (resetSelection = true) => {
    if (!form.branchId || !form.date) return;
    setLoadingSchedule(true); setErrorMsg(null);
    try {
      const response = await fetch(`/api/bookings/availability?branchId=${encodeURIComponent(form.branchId)}&date=${encodeURIComponent(form.date)}`, { cache: 'no-store' });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Jadwal gagal dimuat.');
      setAvailability(result.data);
      if (resetSelection) setForm(current => ({ ...current, startTime: '', endTime: '' }));
    } catch (error: any) { setAvailability(null); setErrorMsg(error.message); }
    finally { setLoadingSchedule(false); }
  }, [form.branchId, form.date]);

  useEffect(() => { loadAvailability(); }, [loadAvailability]);

  useEffect(() => {
    if (!form.branchId || !form.date || confirmedBooking) return;
    const refresh = () => { void loadAvailability(false); };
    const onVisibility = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    const timer = window.setInterval(refresh, 15000);
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', onVisibility); window.clearInterval(timer); };
  }, [form.branchId, form.date, confirmedBooking, loadAvailability]);

  const slots = useMemo(() => {
    if(!availability?.schedule.isOpen||!availability.schedule.openTime||!availability.schedule.closeTime)return [];
    const baliNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar' }));
    const currentMinutes = baliNow.getHours() * 60 + baliNow.getMinutes();
    const openMinutes=toMinutes(availability.schedule.openTime),closeMinutes=toMinutes(availability.schedule.closeTime);
    return Array.from({ length: Math.max(0,Math.ceil((closeMinutes-openMinutes)/STEP_MINUTES)) }, (_, index) => {
      const start = openMinutes + index * STEP_MINUTES, end = start + duration;
      const past = form.date === todayInBali() && start <= currentMinutes;
      const conflicting = availability?.bookings.find(booking => overlaps(start, end, booking));
      return { time: toTime(start), endTime: toTime(end), available: !past && end <= closeMinutes && !conflicting, conflicting };
    });
  }, [availability, duration, form.date]);

  const handleBookingSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setErrorMsg(null);
    if (!form.startTime || !form.endTime) return setErrorMsg('Pilih salah satu jam yang masih tersedia.');
    if (!form.name.trim() || !form.phone.trim() || !form.branchId || (bookingType === 'tenant' && !form.tenantId)) return setErrorMsg('Lengkapi semua kolom wajib.');
    const organization = bookingType === 'tenant' ? selectedTenant?.companyName : generalOrganization.trim() || 'Customer Umum';
    setSubmitting(true);
    try {
      const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        branchId: form.branchId, roomId: availability?.room.id, customerId: bookingType === 'tenant' ? form.tenantId : undefined,
        bookingType, bookerName: form.name.trim(), bookerPhone: form.phone.trim(),
        title: `${form.title.trim() || 'Penggunaan Meeting Room'} (${form.name.trim()} - ${organization})`,
        date: form.date, startTime: form.startTime, endTime: form.endTime, createdBy: 'tenant',
      }) });
      const result = await response.json();
      if (!result.success) { await loadAvailability(); throw new Error(result.error || 'Booking gagal dibuat.'); }
      await loadAvailability(false);
      setConfirmedBooking({ booking: result.data, branch: branches.find(branch => branch.id === form.branchId), organization, bookerName: form.name, bookerPhone: form.phone });
    } catch (error: any) { setErrorMsg(error.message || 'Terjadi kesalahan sistem.'); }
    finally { setSubmitting(false); }
  };

  const selectedBranch = branches.find(branch => branch.id === form.branchId);
  return <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900" style={{ backgroundColor: '#f1f5f9' }}>
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/60">
      <div className="h-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />
      <div className="p-6 sm:p-8">
        <header className="mb-7 text-center">
          <span className="inline-flex rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm"><img src="/logo.webp" alt="BOffice" className="h-12 w-auto object-contain" /></span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Reservasi meeting room</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Pilih jadwal yang masih tersedia</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Jadwal merah sudah terbooking dan tidak dapat dipilih. Jadwal diperiksa kembali saat booking dikonfirmasi.</p>
        </header>
        {errorMsg && <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{errorMsg}</div>}

        {confirmedBooking ? <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" /><h2 className="mt-3 text-xl font-extrabold">Booking berhasil dikonfirmasi</h2><p className="mt-1 text-sm text-slate-600">Slot ini sekarang otomatis tertutup untuk pemesan lain.</p>
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm"><p className="font-bold">{confirmedBooking.branch?.name} · {availability?.room.name}</p><p className="mt-1 text-slate-500">{confirmedBooking.organization} · {confirmedBooking.bookerName}</p><p className="mt-3 font-mono font-bold text-emerald-700">{confirmedBooking.booking.date} · {String(confirmedBooking.booking.startTime).slice(0,5)}–{String(confirmedBooking.booking.endTime).slice(0,5)}</p></div>
          <div className="mt-5"><button type="button" onClick={() => { setConfirmedBooking(null); loadAvailability(); }} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700">Booking sesi lain</button></div>
        </section> : loading ? <div className="py-16 text-center text-sm text-slate-400">Memuat formulir booking…</div> : <form onSubmit={handleBookingSubmit} className="space-y-6">
          <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700"><span className="mb-1.5 flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" />Cabang</span><select value={form.branchId} onChange={event => setForm({ ...form, branchId: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3">{branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name} — {branch.code}</option>)}</select></label>
            <label className="text-sm font-bold text-slate-700"><span className="mb-1.5 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-blue-600" />Tanggal</span><input type="date" min={todayInBali()} required value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" /></label>
            {selectedBranch && <p className="sm:col-span-2 text-xs text-slate-500">📍 {selectedBranch.address}</p>}
          </section>

          <section>
            <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="flex items-center gap-2 font-extrabold"><Clock className="h-5 w-5 text-blue-600" />Pilih jam mulai</h2><p className="mt-1 text-xs text-slate-500">{availability?.schedule.isOpen?`Operasional ${availability.schedule.openTime}–${availability.schedule.closeTime} WITA, interval 30 menit.`:'Cabang tidak beroperasi pada tanggal ini.'}</p></div><button type="button" onClick={() => loadAvailability()} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600"><RefreshCw className={`h-3.5 w-3.5 ${loadingSchedule ? 'animate-spin' : ''}`} />Perbarui jadwal</button></div>
            <div className="mt-3 flex flex-wrap gap-2"><span className="py-2 text-xs font-semibold text-slate-500">Durasi:</span>{DURATIONS.map(minutes => <button type="button" key={minutes} onClick={() => { setDuration(minutes); setForm(current => ({ ...current, startTime: '', endTime: '' })); }} className={`rounded-lg border px-3 py-2 text-xs font-bold ${duration === minutes ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{minutes < 60 ? '30 menit' : `${minutes / 60} jam`}</button>)}</div>
            {availability?.schedule.isOpen?<div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">{slots.map(slot => <button type="button" key={slot.time} disabled={!slot.available || loadingSchedule} onClick={() => setForm(current => ({ ...current, startTime: slot.time, endTime: slot.endTime }))} className={`rounded-xl border px-2 py-3 text-center transition ${form.startTime === slot.time ? 'border-blue-600 bg-blue-600 text-white shadow-md' : slot.available ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-500' : slot.conflicting ? 'cursor-not-allowed border-rose-200 bg-rose-50 text-rose-500 line-through' : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'}`}><span className="block text-sm font-black">{slot.time}</span><span className="mt-0.5 block text-[10px] font-semibold">{slot.available ? `s/d ${slot.endTime}` : slot.conflicting ? 'Terbooking' : 'Tidak tersedia'}</span></button>)}</div>:!loadingSchedule&&<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{availability?.schedule.reason==='national_holiday'?`Tutup karena libur nasional${availability.schedule.holidayName?`: ${availability.schedule.holidayName}`:''}.`:'Cabang tutup pada hari ini.'}</div>}
            {availability?.schedule.isOpen&&(availability.bookings.length ? <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3"><p className="text-xs font-bold text-rose-700">Jadwal yang sudah terbooking:</p><div className="mt-2 flex flex-wrap gap-2">{availability.bookings.map(booking => <span key={booking.id} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-rose-600 ring-1 ring-rose-200">{booking.startTime}–{booking.endTime}</span>)}</div></div> : !loadingSchedule && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">Belum ada booking pada tanggal ini. Semua slot operasional masih tersedia.</p>)}
          </section>

          <section className="space-y-4 border-t border-slate-200 pt-6">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setBookingType('tenant')} className={`rounded-lg px-3 py-2.5 text-sm font-bold ${bookingType === 'tenant' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}><Building2 className="mr-2 inline h-4 w-4" />Tenant BOffice</button><button type="button" onClick={() => { setBookingType('general'); setForm(current => ({ ...current, tenantId: '' })); setSelectedTenant(null); setTenantQuery(''); setTenants([]); }} className={`rounded-lg px-3 py-2.5 text-sm font-bold ${bookingType === 'general' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}><Users className="mr-2 inline h-4 w-4" />Customer umum</button></div>
            {bookingType === 'tenant' ? <div className="block text-sm font-bold">
              <label htmlFor="tenant-search">Cari perusahaan tenant</label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input id="tenant-search" autoComplete="off" value={tenantQuery} onChange={event => { setTenantQuery(event.target.value); setSelectedTenant(null); setTenantSearchComplete(false); setForm(current => ({ ...current, tenantId: '' })); }} placeholder="Ketik minimal 2 kata, contoh: Bali Kreatif" className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-10" />
                {searchingTenants && <LoaderCircle className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-blue-600" />}
              </div>
              {selectedTenant ? <div className="mt-2 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3"><span className="text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline h-4 w-4" />{selectedTenant.companyName}</span><button type="button" onClick={() => { setSelectedTenant(null); setTenantQuery(''); setForm(current => ({ ...current, tenantId: '' })); }} className="text-xs font-bold text-slate-500">Ganti</button></div> : <>
                {tenantQuery.trim().split(/\s+/).filter(Boolean).length < 2 && <p className="mt-2 text-xs font-normal text-slate-500">Masukkan sedikitnya dua kata dari nama perusahaan. Daftar tenant tidak ditampilkan untuk menjaga privasi.</p>}
                {tenants.length > 0 && <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">{tenants.map(tenant => <button type="button" key={tenant.id} onClick={() => { setSelectedTenant(tenant); setTenantQuery(tenant.companyName); setTenants([]); setForm(current => ({ ...current, tenantId: tenant.id })); }} className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-700 last:border-0 hover:bg-blue-50">{tenant.companyName}</button>)}</div>}
                {tenantSearchComplete && !searchingTenants && tenants.length === 0 && <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs font-normal text-amber-700">Perusahaan tidak ditemukan. Periksa ejaan atau pilih Customer umum.</p>}
              </>}
            </div> : <label className="block text-sm font-bold">Perusahaan / organisasi <span className="font-normal text-slate-400">(opsional)</span><input value={generalOrganization} onChange={event => setGeneralOrganization(event.target.value)} placeholder="Nama perusahaan atau pribadi" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-3" /></label>}
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold"><span className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-blue-600" />Nama pemesan</span><input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-3" /></label><label className="text-sm font-bold"><span className="flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-600" />Nomor WhatsApp / HP</span><input required inputMode="tel" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} placeholder="081234567890" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-3" /></label></div>
            <label className="block text-sm font-bold">Keperluan rapat<input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-3" /></label>
          </section>

          <button disabled={submitting || !form.startTime || loadingSchedule} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 disabled:cursor-not-allowed disabled:opacity-50"><span>{submitting ? 'Memeriksa dan menyimpan…' : form.startTime ? `Booking ${form.startTime}–${form.endTime}` : 'Pilih jam tersedia terlebih dahulu'}</span><ArrowRight className="h-4 w-4" /></button>
        </form>}
        <footer className="mt-6 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">Booking menggunakan zona waktu Bali (WITA). Simpan detail jadwal setelah reservasi berhasil.</footer>
      </div>
    </div>
  </main>;
}

export default function PublicBookingPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-100 p-10 text-center text-sm text-slate-500">Memuat formulir booking…</div>}><BookingFormInner /></Suspense>;
}
