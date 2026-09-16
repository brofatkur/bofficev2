'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  Phone,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  MapPin,
  CalendarCheck,
  Building2,
  UserCheck,
  ArrowRight,
  CalendarX,
  Search,
  RefreshCw,
} from 'lucide-react';

export default function BranchCheckInPage() {
  const params = useParams();
  const branchCode = (params?.branchCode as string)?.toUpperCase();

  const [branch, setBranch] = useState<any | null>(null);
  const [phone, setPhone] = useState('');
  const [loadingBranch, setLoadingBranch] = useState(true);

  // Lookup state
  const [searching, setSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [bookingData, setBookingData] = useState<any | null>(null);
  const [bookingFound, setBookingFound] = useState<boolean>(false);

  // Active session state (Check-In)
  const [activeLog, setActiveLog] = useState<any | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Stopwatch timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Receipt Modal on Checkout
  const [receipt, setReceipt] = useState<any | null>(null);

  // Load branch info
  useEffect(() => {
    if (!branchCode) return;
    fetch('/api/branches')
      .then((r) => r.json())
      .then((d) => {
        const found = (d.data || []).find((b: any) => b.code.toUpperCase() === branchCode);
        if (found) {
          setBranch(found);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingBranch(false));
  }, [branchCode]);

  // Check if phone already has an ongoing active attendance session
  const checkActiveSession = async (phoneNumber: string) => {
    try {
      const res = await fetch(`/api/attendance/lookup?phone=${encodeURIComponent(phoneNumber)}`);
      const data = await res.json();
      if (data.success && data.data.activeLog) {
        setActiveLog(data.data.activeLog);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // Check Booking by Phone
  const handleSearchBooking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!branch) return;
    if (!phone || phone.trim().length < 8) {
      alert('Masukkan nomor HP yang valid');
      return;
    }

    setSearching(true);
    setSearchAttempted(true);
    setNotice(null);

    try {
      // 1. Check if visitor is already checked in (ongoing session)
      const hasActive = await checkActiveSession(phone.trim());
      if (hasActive) {
        setSearching(false);
        return;
      }

      // 2. Check booking data
      const res = await fetch(
        `/api/attendance/check-booking?branchId=${branch.id}&phone=${encodeURIComponent(phone.trim())}`
      );
      const data = await res.json();

      if (data.success && data.data.found && data.data.booking) {
        setBookingFound(true);
        setBookingData(data.data);
      } else {
        setBookingFound(false);
        setBookingData(null);
      }
    } catch (err: any) {
      console.error(err);
      setBookingFound(false);
    } finally {
      setSearching(false);
    }
  };

  // Stopwatch interval when activeLog is present
  useEffect(() => {
    if (activeLog && activeLog.checkInTime) {
      const startTime = new Date(activeLog.checkInTime).getTime();

      const updateTimer = () => {
        const now = Date.now();
        const diffSec = Math.max(0, Math.floor((now - startTime) / 1000));
        setElapsedSeconds(diffSec);
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      setElapsedSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeLog]);

  const formatStopwatch = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  // Check In Handler
  const handleCheckInSubmit = async () => {
    if (!branch || !bookingData?.booking) return;

    setLoadingAction(true);
    try {
      const bookerName = bookingData.booking.bookerName || bookingData.tenantName || 'Tamu Rapat';
      const org = bookingData.tenantName || 'Tenant BOffice';

      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          name: bookerName,
          organization: org,
          branchId: branch.id,
          roomId: bookingData.booking.roomId,
          bookingId: bookingData.booking.id,
          title: bookingData.booking.title,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveLog(data.data.log);
        setNotice('✅ Check-In Berhasil! Timer waktu pemakaian ruangan mulai berjalan.');
      } else {
        alert(`Gagal Check-In: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Check Out Handler
  const handleCheckOutSubmit = async () => {
    if (!activeLog) return;
    if (!confirm('Apakah Anda yakin ingin keluar ruangan (Check Out) sekarang?')) return;

    setLoadingAction(true);
    try {
      const res = await fetch('/api/attendance/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId: activeLog.id }),
      });

      const data = await res.json();
      if (data.success) {
        setReceipt(data.data);
        setActiveLog(null);
        setSearchAttempted(false);
        setBookingData(null);
        setNotice('🎉 Check-Out Berhasil! Durasi aktual pemakaian ruangan telah terekam.');
      } else {
        alert(`Gagal Check-Out: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Box */}
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-400" />

        {/* Logo & Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <img
              src="/logo.webp"
              alt="BOffice Logo"
              className="h-10 w-auto object-contain brightness-110"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            <span>Cabang: {branch ? branch.name : branchCode || 'BOffice'}</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-wide">
            Check-In Meeting Room
          </h1>
          <p className="text-slate-400 text-xs">
            {branch ? `${branch.address} • ${branch.city}` : 'BOffice Virtual & Private Office'}
          </p>
        </div>

        {notice && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* ACTIVE SESSION STOPWATCH (IF CHECKED IN) */}
        {activeLog ? (
          <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl border border-emerald-500/40 p-6 text-center space-y-4 shadow-xl">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 py-1 px-3 rounded-full border border-emerald-800/50 w-fit mx-auto">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Ruangan Sedang Dipakai</span>
            </div>

            <div>
              <div className="text-slate-400 text-xs">Waktu Berjalan (Stopwatch):</div>
              <div className="text-4xl font-black font-mono text-emerald-400 tracking-wider mt-1 animate-pulse">
                {formatStopwatch(elapsedSeconds)}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs text-left space-y-1.5 font-sans">
              <div className="flex justify-between">
                <span className="text-slate-400">Penanggung Jawab:</span>
                <span className="font-bold text-white">{activeLog.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lembaga / Tenant:</span>
                <span className="font-semibold text-blue-400">{activeLog.organization}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waktu Masuk (Check-In):</span>
                <span className="text-emerald-400 font-mono">
                  {new Date(activeLog.checkInTime).toLocaleTimeString('id-ID')}
                </span>
              </div>
            </div>

            {/* Check Out Button */}
            <button
              onClick={handleCheckOutSubmit}
              disabled={loadingAction}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-2xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <LogOut className="w-5 h-5" />
              <span>{loadingAction ? 'Memproses Keluar...' : 'Keluar Ruangan (Check Out)'}</span>
            </button>
          </div>
        ) : (
          /* STEP 1: INPUT NOMOR HP YANG SUDAH BOOKING */
          <div className="space-y-4">
            <form onSubmit={handleSearchBooking} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-400" /> Masukkan No. WhatsApp / HP Pemesan *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 081234567890"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setSearchAttempted(false);
                    }}
                    className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={searching}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    {searching ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>Cek</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Masukkan nomor HP yang digunakan saat melakukan booking.
                </p>
              </div>
            </form>

            {/* HASIL 1: DATA BOOKING DITEMUKAN -> TAMPILKAN DATA & TOMBOL CHECK-IN */}
            {searchAttempted && bookingFound && bookingData && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/50 space-y-4 animate-fadeIn text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Data Booking Ditemukan!</span>
                </div>

                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Penanggung Jawab:</span>
                    <span className="font-bold text-white">
                      {bookingData.booking.bookerName || bookingData.tenantName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lembaga / Tenant:</span>
                    <span className="font-bold text-blue-400">{bookingData.tenantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ruangan:</span>
                    <span className="text-white">{bookingData.roomName}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2">
                    <span className="text-slate-400">Jadwal Sesi:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {bookingData.booking.date} • {bookingData.booking.startTime} - {bookingData.booking.endTime}
                    </span>
                  </div>
                </div>

                {/* TOMBOL MASUK RUANGAN (CHECK IN) */}
                <button
                  type="button"
                  onClick={handleCheckInSubmit}
                  disabled={loadingAction}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/30 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <LogIn className="w-5 h-5" />
                  <span>{loadingAction ? 'Memproses Masuk...' : 'Masuk Ruangan (Check In)'}</span>
                </button>
              </div>
            )}

            {/* HASIL 2: TIDAK ADA DATA BOOKING -> TOMBOL MENGARAH KE FORM BOOKING (SESUAI ATURAN USER) */}
            {searchAttempted && !bookingFound && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-rose-500/40 space-y-4 animate-fadeIn text-xs text-center">
                <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
                  <CalendarX className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm">Belum Ada Data Booking</h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Nomor HP <strong className="text-white font-mono">{phone}</strong> belum memiliki jadwal booking terkonfirmasi di cabang ini.
                    Sesuai alur, Anda harus melakukan <strong>booking terlebih dahulu</strong> sebelum dapat check-in ke ruang rapat.
                  </p>
                </div>

                <Link
                  href={`/book?branch=${branch?.id || branchCode}`}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all text-xs flex items-center justify-center gap-2"
                >
                  <span>Buka Form Booking Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Footer info & Booking Switch */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Belum pesan ruang rapat?</span>
          <Link
            href={`/book?branch=${branch?.id || branchCode}`}
            className="text-blue-400 hover:text-blue-300 font-bold underline"
          >
            Formulir Booking Ruangan →
          </Link>
        </div>
      </div>

      {/* Checkout Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-fadeIn text-slate-200">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-extrabold text-white text-base">Sesi Selesai</h3>
              <p className="text-slate-400 text-xs mt-0.5">Bukti Pemakaian Ruang Rapat BOffice</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl text-xs space-y-2 text-left border border-slate-800 font-sans">
              <div className="flex justify-between">
                <span className="text-slate-400">Penanggung Jawab:</span>
                <span className="font-bold text-white">{receipt.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lembaga / Tenant:</span>
                <span className="text-blue-400 font-semibold">{receipt.organization}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400">Jam Masuk:</span>
                <span className="text-slate-200 font-mono">
                  {new Date(receipt.checkInTime).toLocaleTimeString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jam Keluar:</span>
                <span className="text-slate-200 font-mono">
                  {new Date(receipt.checkOutTime).toLocaleTimeString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400">Total Durasi:</span>
                <span className="text-emerald-400 font-black text-sm">
                  {receipt.durationMinutes} Menit ({receipt.durationHours} Jam)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-emerald-400">
              📲 Ringkasan pemakaian telah dikirimkan via WhatsApp ke {receipt.phone}!
            </p>

            <button
              onClick={() => setReceipt(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
