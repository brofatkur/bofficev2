'use client';

import { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  Users,
  AlertCircle,
  CheckCircle2,
  FileText,
  X,
  Info,
  QrCode,
  ExternalLink,
  UserCheck,
  Building2,
  LogIn,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';

export default function MeetingRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [form, setForm] = useState({
    roomId: '',
    customerId: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
  });

  const [notice, setNotice] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [roomsRes, custRes, bookRes, attRes] = await Promise.all([
        fetch('/api/meeting-rooms').then((r) => r.json()),
        fetch('/api/customers').then((r) => r.json()),
        fetch('/api/bookings').then((r) => r.json()),
        fetch('/api/attendance').then((r) => r.json()),
      ]);
      setRooms(roomsRes.data || []);
      setCustomers(custRes.data || []);
      setBookings(bookRes.data || []);
      setAttendanceLogs(attRes.data || []);
      if (roomsRes.data?.length) {
        setForm((prev) => ({ ...prev, roomId: roomsRes.data[0].id }));
      }
      if (custRes.data?.length) {
        setForm((prev) => ({ ...prev, customerId: custRes.data[0].id }));
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

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
  const currentMonth = '2026-09';
  const customerQuotaSummary = customers.map((cus) => {
    const cusBookings = bookings.filter((b) => b.customerId === cus.id && b.date.startsWith(currentMonth));
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

  const activeVisitors = attendanceLogs.filter((l) => l.status === 'active');

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manajemen Booking & Daftar Hadir Meeting Room</h1>
          <p className="text-xs text-slate-500 mt-1">
            Jadwal penggunaan ruang rapat, kuota 8 jam/bulan per tenant (overage Rp 90rb/jam), dan portal publik Check-in / Check-out stopwatch.
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

          <Link
            href="/attendance"
            target="_blank"
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Portal Check-In Publik</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
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

      {/* Live Active Attendees Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-700 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">Pengunjung Aktif Saat Ini di Meeting Room</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              {activeVisitors.length > 0
                ? `${activeVisitors.length} orang sedang berada di dalam ruang rapat (Stopwatch berjalan)`
                : 'Tidak ada pengunjung yang sedang check-in saat ini.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowQrModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2 shrink-0"
        >
          <QrCode className="w-4 h-4" />
          <span>Tampilkan QR Code Check-In</span>
        </button>
      </div>

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

      {/* Attendance Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Riwayat Daftar Hadir & Stopwatch Check-In Pengunjung</span>
          </div>
          <span className="text-xs text-slate-500 font-normal">
            Total {attendanceLogs.length} Catatan Masuk/Keluar
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Memuat data daftar hadir...</div>
        ) : attendanceLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">Belum ada catatan daftar hadir.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-4">Pengunjung / No. HP</th>
                  <th className="p-4">Asal Lembaga</th>
                  <th className="p-4">Ruangan</th>
                  <th className="p-4">Waktu Masuk & Keluar</th>
                  <th className="p-4">Durasi Terhitung</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceLogs.map((log) => {
                  const room = rooms.find((r) => r.id === log.roomId);
                  const isActive = log.status === 'active';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">
                        <div>{log.name}</div>
                        <div className="text-[11px] font-mono font-normal text-slate-400">{log.phone}</div>
                      </td>
                      <td className="p-4 font-medium text-slate-800">{log.organization}</td>
                      <td className="p-4 font-medium text-slate-700">{room?.name || 'Meeting Room'}</td>
                      <td className="p-4">
                        <div className="text-slate-800 font-medium">
                          Masuk: <span className="font-mono">{new Date(log.checkInTime).toLocaleTimeString('id-ID')}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Keluar: {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString('id-ID') : '-'}
                        </div>
                      </td>
                      <td className="p-4 font-extrabold text-slate-900">
                        {isActive ? (
                          <span className="text-emerald-600 animate-pulse">Stopwatch Berjalan...</span>
                        ) : (
                          `${log.durationMinutes} Menit (${log.durationHours} Jam)`
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isActive ? 'Sedang di Ruangan' : 'Selesai'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-emerald-600" />
          <span>Jadwal Reservasi Meeting Room (Bulan Berjalan)</span>
        </div>

        {bookings.length === 0 ? (
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
                {bookings.map((booking) => {
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
                        {customer?.companyName || 'N/A'}
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

      {/* QR Code Printable Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">QR Code Check-In Ruang Meeting</h3>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-3">
              <div className="w-44 h-44 bg-slate-900 rounded-xl flex flex-col items-center justify-center p-3 text-white">
                <QrCode className="w-32 h-32 text-emerald-400" />
                <span className="text-[10px] font-mono mt-1 text-slate-300">SCAN ME</span>
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Buka Link Publik Check-In:
              </p>
              <Link
                href="/attendance"
                target="_blank"
                className="text-xs text-emerald-700 font-bold underline break-all hover:text-emerald-800"
              >
                /attendance
              </Link>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Cetak QR Code ini dan tempatkan di depan pintu Meeting Room agar pengunjung dapat langsung melakukan Check-In & Check-Out mandiri.
            </p>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20"
            >
              Cetak QR Code Ini
            </button>
          </div>
        </div>
      )}

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
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md shadow-emerald-600/20"
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
