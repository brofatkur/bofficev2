'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
  X,
  Info,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

export default function MeetingRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [calendarDate, setCalendarDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' }));
  const [calendarRoomId, setCalendarRoomId] = useState('');
  const [calendarBookings, setCalendarBookings] = useState<any[]>([]);
  const [calendarSchedule, setCalendarSchedule] = useState<any>(null);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [formSchedule, setFormSchedule] = useState<any>(null);

  // Booking Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    roomId: '',
    customerId: '',
    title: '',
    date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' }),
    startTime: '09:00',
    endTime: '11:00',
  });

  const [notice, setNotice] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [roomsRes, custRes, bookRes, branchRes] = await Promise.all([
        fetch('/api/meeting-rooms').then((r) => r.json()),
        fetch('/api/customers').then((r) => r.json()),
        fetch('/api/bookings').then((r) => r.json()),
        fetch('/api/branches').then((r) => r.json()),
      ]);
      setRooms(roomsRes.data || []);
      setCustomers(custRes.data || []);
      setBookings(bookRes.data || []);
      setBranches(branchRes.data || []);
      if (roomsRes.data?.length) {
        setForm((prev) => ({ ...prev, roomId: roomsRes.data[0].id }));
        setCalendarRoomId((current) => current || roomsRes.data[0].id);
      }
      if (custRes.data?.length) {
        setForm((prev) => ({ ...prev, customerId: custRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(()=>{
    if(!showModal||!form.roomId||!form.date)return;
    const room=rooms.find(item=>item.id===form.roomId);if(!room)return;
    fetch(`/api/bookings/availability?branchId=${encodeURIComponent(room.branchId)}&roomId=${encodeURIComponent(room.id)}&date=${encodeURIComponent(form.date)}`,{cache:'no-store'}).then(r=>r.json()).then(result=>setFormSchedule(result.success?result.data.schedule:null)).catch(()=>setFormSchedule(null));
  },[showModal,form.roomId,form.date,rooms]);
  const latestStart=formSchedule?.closeTime?(()=>{const [h,m]=String(formSchedule.closeTime).split(':').map(Number),minutes=h*60+m-30;return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`})():'19:30';

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedRoom = rooms.find((room) => room.id === form.roomId);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, branchId: selectedRoom?.branchId }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        if (data.overageAdded) {
          setNotice(`Booking berhasil disimpan! ⚠️ Kuota gratis 8 jam terlampaui. Tambahan biaya overage Rp ${data.data.overageFee.toLocaleString('id-ID')} ditambahkan ke akun customer.`);
        } else {
          setNotice('Booking ruang meeting berhasil didaftarkan dalam kuota gratis 8 jam/bulan!');
        }
        fetchData();
      } else {
        alert(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm('Batalkan booking ini?')) return;
    try {
      const res = await fetch(`/api/bookings?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setNotice('Booking berhasil dibatalkan.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Overage Invoice Trigger
  const handleGenerateOverageInvoice = async (customer: any, overageFee: number, overageHours: number) => {
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
          items: [
            {
              description: `Biaya Kelebihan Kuota Meeting Room (September 2026) - ${overageHours} Jam @ Rp 90.000`,
              amount: 90000,
              quantity: overageHours,
              total: overageFee,
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotice(`Invoice tagihan overage Meeting Room Rp ${overageFee.toLocaleString('id-ID')} berhasil dibuat untuk ${customer.companyName}!`);
      }
    } catch (err: any) {
      alert(`Gagal membuat invoice: ${err.message}`);
    }
  };

  // Calculate Customer Stats
  const currentMonth = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' }).slice(0, 7);
  const activeBookings = bookings
    .filter((booking) => booking.status !== 'cancelled')
    .sort((a, b) => `${String(a.date).slice(0, 10)} ${a.startTime}`.localeCompare(`${String(b.date).slice(0, 10)} ${b.startTime}`));
  const customerQuotaSummary = customers.map((cus) => {
    const cusBookings = activeBookings.filter((b) => b.customerId === cus.id && String(b.date).startsWith(currentMonth));
    const usedHours = cusBookings.reduce((sum, b) => sum + b.durationHours, 0);
    const freeQuota = 8;
    const overageHours = Math.max(0, usedHours - freeQuota);
    const overageFee = overageHours * 90000;
    return {
      customer: cus,
      usedHours,
      remainingFree: Math.max(0, freeQuota - usedHours),
      overageHours,
      overageFee,
      bookingsCount: cusBookings.length,
    };
  });

  const selectedCalendarRoom = rooms.find((room) => room.id === calendarRoomId);
  const selectedCalendarBranch = branches.find((branch) => branch.id === selectedCalendarRoom?.branchId);
  useEffect(() => {
    const room = rooms.find((item) => item.id === calendarRoomId);
    if (!room || !calendarDate) { setCalendarBookings([]); setCalendarSchedule(null); return; }
    const controller = new AbortController();
    setLoadingCalendar(true);
    fetch(`/api/bookings/availability?branchId=${encodeURIComponent(room.branchId)}&roomId=${encodeURIComponent(room.id)}&date=${encodeURIComponent(calendarDate)}`, { cache: 'no-store', signal: controller.signal })
      .then((response) => response.json())
      .then((result) => { setCalendarBookings(result.success ? result.data.bookings : []); setCalendarSchedule(result.success ? result.data.schedule : null); })
      .catch((error) => { if (error.name !== 'AbortError') { setCalendarBookings([]); setCalendarSchedule(null); } })
      .finally(() => { if (!controller.signal.aborted) setLoadingCalendar(false); });
    return () => controller.abort();
  }, [rooms, calendarRoomId, calendarDate]);
  const calendarDays = useMemo(() => {
    const selected = new Date(`${calendarDate}T00:00:00`);
    const monday = new Date(selected);
    const day = monday.getDay() || 7;
    monday.setDate(monday.getDate() - day + 1);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday); date.setDate(monday.getDate() + index);
      return { value: date.toLocaleDateString('en-CA'), weekday: date.toLocaleDateString('id-ID', { weekday: 'short' }), day: date.getDate(), month: date.toLocaleDateString('id-ID', { month: 'short' }) };
    });
  }, [calendarDate]);
  const calendarSlots = useMemo(() => {
    if(!calendarSchedule?.isOpen||!calendarSchedule.openTime||!calendarSchedule.closeTime)return [];
    const [openHour,openMinute]=calendarSchedule.openTime.split(':').map(Number),[closeHour,closeMinute]=calendarSchedule.closeTime.split(':').map(Number);
    const openMinutes=openHour*60+openMinute,closeMinutes=closeHour*60+closeMinute;
    return Array.from({ length: Math.max(0,Math.ceil((closeMinutes-openMinutes)/30)) }, (_, index) => {
    const startMinutes = openMinutes + index * 30;
    const endMinutes = startMinutes + 30;
    const startTime = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
    const booking = calendarBookings.find((item) => startTime < String(item.endTime).slice(0, 5) && endTime > String(item.startTime).slice(0, 5));
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar' }));
    const today = now.toLocaleDateString('en-CA');
    const passed = calendarDate < today || (calendarDate === today && startMinutes <= now.getHours() * 60 + now.getMinutes());
    return { startTime, endTime, booking, passed };
  })}, [calendarBookings, calendarDate, calendarSchedule]);

  const moveCalendarWeek = (days: number) => {
    const date = new Date(`${calendarDate}T00:00:00`); date.setDate(date.getDate() + days);
    setCalendarDate(date.toLocaleDateString('en-CA'));
  };
  const openBookingAtSlot = (startTime: string, endTime: string) => {
    setForm((current) => ({ ...current, roomId: calendarRoomId, date: calendarDate, startTime, endTime }));
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manajemen Booking Meeting Room</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola ketersediaan, reservasi, dan kuota 8 jam per bulan untuk setiap tenant.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/book"
            target="_blank"
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
          >
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <span>Form Booking Publik</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
          </Link>

          <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Booking Ruang Meeting</span>
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

      {/* Availability Calendar */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-emerald-50 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-700"><CalendarDays className="h-5 w-5" /><span className="text-xs font-black uppercase tracking-[0.16em]">Kalender Ketersediaan</span></div>
              <h2 className="mt-1 text-lg font-extrabold text-slate-900">Cek slot meeting room per 30 menit</h2>
              <p className="mt-1 text-xs text-slate-500">Pilih tanggal dan ruangan. Klik slot hijau untuk langsung membuat reservasi.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[520px]">
              <label className="text-xs font-bold text-slate-600">Meeting room
                <select value={calendarRoomId} onChange={(event) => setCalendarRoomId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900">
                  {rooms.map((room) => { const branch = branches.find((item) => item.id === room.branchId); return <option key={room.id} value={room.id}>{branch?.name || 'Cabang'} — {room.name}</option>; })}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-600">Tanggal
                <input type="date" value={calendarDate} onChange={(event) => setCalendarDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900" />
              </label>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => moveCalendarWeek(-7)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Minggu sebelumnya"><ChevronLeft className="h-4 w-4" /></button>
            <div className="grid flex-1 grid-cols-7 gap-1.5">
              {calendarDays.map((day) => <button type="button" key={day.value} onClick={() => setCalendarDate(day.value)} className={`rounded-xl border px-1 py-2 text-center transition ${calendarDate === day.value ? 'border-blue-600 bg-blue-600 text-white shadow-md' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50'}`}><span className="block text-[10px] font-bold uppercase">{day.weekday}</span><span className="block text-base font-black leading-5">{day.day}</span><span className="block text-[9px]">{day.month}</span></button>)}
            </div>
            <button type="button" onClick={() => moveCalendarWeek(7)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Minggu berikutnya"><ChevronRight className="h-4 w-4" /></button>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-extrabold text-slate-900">{selectedCalendarRoom?.name || 'Meeting Room'} · {selectedCalendarBranch?.name || 'Cabang'}</p><p className="text-xs text-slate-500">{new Date(`${calendarDate}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{calendarSchedule?.isOpen?` · ${calendarSchedule.openTime}–${calendarSchedule.closeTime} WITA`:''}</p></div>
            <div className="flex flex-wrap gap-2 text-[11px] font-bold">{loadingCalendar && <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700 ring-1 ring-blue-200">Memuat jadwal…</span>}<span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 ring-1 ring-emerald-200">{calendarSlots.filter((slot) => !slot.booking && !slot.passed).length} slot tersedia</span><span className="rounded-full bg-rose-50 px-3 py-1.5 text-rose-700 ring-1 ring-rose-200">{calendarSlots.filter((slot) => slot.booking).length} slot terisi</span></div>
          </div>

          {!loadingCalendar&&!calendarSchedule?.isOpen&&<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{calendarSchedule?.reason==='national_holiday'?`Tutup karena libur nasional${calendarSchedule.holidayName?`: ${calendarSchedule.holidayName}`:''}.`:'Cabang tutup pada hari ini.'}</div>}
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {calendarSlots.map((slot) => {
              const detailedBooking = slot.booking ? bookings.find((item) => item.id === slot.booking.id) : null;
              const customer = detailedBooking ? customers.find((item) => item.id === detailedBooking.customerId) : null;
              const occupiedBy = customer?.companyName || detailedBooking?.bookerName || 'Sudah terisi';
              if (slot.booking) return <div key={slot.startTime} title={`${detailedBooking?.title || occupiedBy} (${String(slot.booking.startTime).slice(0,5)}–${String(slot.booking.endTime).slice(0,5)})`} className="min-h-[72px] rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700"><span className="block text-xs font-black">{slot.startTime}</span><span className="mt-1 block truncate text-[10px] font-bold">Terbooking</span><span className="block truncate text-[9px] text-rose-500">{occupiedBy}</span></div>;
              if (slot.passed) return <div key={slot.startTime} className="min-h-[72px] rounded-xl border border-slate-200 bg-slate-100 p-2 text-slate-400"><span className="block text-xs font-black">{slot.startTime}</span><span className="mt-1 block text-[10px] font-semibold">Sudah lewat</span></div>;
              return <button type="button" key={slot.startTime} onClick={() => openBookingAtSlot(slot.startTime, slot.endTime)} className="min-h-[72px] rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-left text-emerald-700 transition hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md"><span className="block text-xs font-black">{slot.startTime}</span><span className="mt-1 block text-[10px] font-bold">Tersedia</span><span className="block text-[9px] text-emerald-600">hingga {slot.endTime}</span></button>;
            })}
          </div>

          {calendarBookings.length > 0 && <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-bold text-slate-700">Reservasi pada tanggal ini</p><div className="mt-2 flex flex-wrap gap-2">{calendarBookings.map((booking) => { const detail = bookings.find((item) => item.id === booking.id); const customer = detail ? customers.find((item) => item.id === detail.customerId) : null; return <span key={booking.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600"><strong className="text-slate-900">{String(booking.startTime).slice(0,5)}–{String(booking.endTime).slice(0,5)}</strong> · {customer?.companyName || detail?.bookerName || 'Sudah terbooking'}</span>; })}</div></div>}
        </div>
      </section>

      {/* Quota Summary per Tenant Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {customerQuotaSummary.map((item) => (
          <div key={item.customer.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{item.customer.companyName}</h3>
                <p className="text-[11px] text-slate-400">PIC: {item.customer.picName} ({item.customer.phone})</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {item.usedHours} / 8 Jam Terpakai
              </span>
            </div>

            {/* Quota Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  item.usedHours > 8 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (item.usedHours / 8) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              {item.overageHours > 0 ? (
                <div className="text-rose-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Melebihi Kuota: +{item.overageHours} Jam (Total Rp {item.overageFee.toLocaleString('id-ID')})</span>
                </div>
              ) : (
                <div className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sisa Kuota Gratis: {item.remainingFree} Jam</span>
                </div>
              )}

              {item.overageFee > 0 && (
                <button
                  onClick={() => handleGenerateOverageInvoice(item.customer, item.overageFee, item.overageHours)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Terbitkan Invoice Overage</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Booking List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-emerald-600" />
          <span>Jadwal Reservasi Meeting Room (Bulan Berjalan)</span>
        </div>

        {activeBookings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">Belum ada booking meeting room terdaftar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-4">Tanggal & Waktu</th>
                  <th className="p-4">Meeting Room</th>
                  <th className="p-4">Penyewa (Customer)</th>
                  <th className="p-4">Topik Meeting</th>
                  <th className="p-4">Durasi & Kuota</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeBookings.map((booking) => {
                  const room = rooms.find((r) => r.id === booking.roomId);
                  const customer = customers.find((c) => c.id === booking.customerId);

                  return (
                    <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{booking.date}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{booking.startTime} - {booking.endTime}</span>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-800">
                        {room?.name || 'Meeting Room'}
                      </td>
                      <td className="p-4 font-semibold text-slate-900">
                        <div>{customer?.companyName || booking.bookerName || 'Customer umum'}</div>
                        {booking.bookerPhone && <div className="mt-0.5 font-mono text-[10px] font-normal text-slate-400">{booking.bookerPhone}</div>}
                      </td>
                      <td className="p-4 text-slate-700">
                        {booking.title}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-800">{booking.durationHours} Jam</span>
                        {booking.isOverage ? (
                          <div className="text-rose-600 text-[10px] font-bold mt-0.5">
                            ⚠️ Over Kuota (+Rp {booking.overageFee?.toLocaleString('id-ID')})
                          </div>
                        ) : (
                          <div className="text-emerald-600 text-[10px] font-medium mt-0.5">
                            Gratis (Kuota 8 Jam)
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Hapus / Batalkan Booking"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Booking Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Reservasi Meeting Room Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Meeting Room *</label>
                <select
                  value={form.roomId}
                  onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Kapasitas {r.capacity} Pax)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Penyewa (Customer) *</label>
                <select
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
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
                <label className="block font-semibold text-slate-700 mb-1">Judul / Topik Meeting *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapat Evaluasi Bulanan"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal *</label>
                <input
                  type="date"
                  required
                  min={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' })}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Mulai *</label>
                  <input
                    type="time"
                    required
                    min={formSchedule?.openTime||'08:00'}
                    max={latestStart}
                    step={1800}
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Selesai *</label>
                  <input
                    type="time"
                    required
                    min={formSchedule?.openTime||'08:30'}
                    max={formSchedule?.closeTime||'20:00'}
                    step={1800}
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {formSchedule&&!formSchedule.isOpen&&<div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] font-bold text-rose-700">Cabang tutup pada tanggal ini{formSchedule.reason==='national_holiday'&&formSchedule.holidayName?` karena ${formSchedule.holidayName}`:''}. Pilih tanggal lain.</div>}

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Sistem otomatis menghitung durasi dan menambahkan tarif Rp 90.000/jam jika pemakaian akumulasi bulan ini melebihi 8 jam kuota gratis.
                </span>
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
                  disabled={formSchedule&&!formSchedule.isOpen}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 text-white rounded-xl font-semibold shadow-md shadow-emerald-600/20"
                >
                  Simpan Reservasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
