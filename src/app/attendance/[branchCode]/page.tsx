'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
  Clock,
  UserCheck,
  Building2,
  Phone,
  LogIn,
  LogOut,
  CheckCircle2,
  Sparkles,
  Check,
  AlertCircle,
  MapPin,
  CalendarCheck,
} from 'lucide-react';

export default function BranchPublicAttendancePage() {
  const params = useParams();
  const branchCode = (params?.branchCode as string)?.toUpperCase();

  const [branch, setBranch] = useState<any | null>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [title, setTitle] = useState('Sesi Penggunaan Ruang Rapat');

  const [autoFilled, setAutoFilled] = useState(false);
  const [activeLog, setActiveLog] = useState<any | null>(null);
  const [matchedBooking, setMatchedBooking] = useState<any | null>(null);

  const [loadingLookup, setLoadingLookup] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Stopwatch timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Completed receipt modal
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
      .catch(console.error);
  }, [branchCode]);

  // Phone number lookup debounce (cross-branch per PRD 5.4)
  useEffect(() => {
    if (!phone || phone.length < 8) {
      setAutoFilled(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingLookup(true);
      try {
        const res = await fetch(`/api/attendance/lookup?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        if (data.success && data.data.found) {
          const attendee = data.data.attendee;
          setName(attendee.name);
          setOrganization(attendee.organization);
          setAutoFilled(true);

          if (data.data.activeLog) {
            setActiveLog(data.data.activeLog);
          }
        } else {
          setAutoFilled(false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingLookup(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [phone]);

  // Stopwatch interval
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

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch) {
      alert('Cabang tidak valid.');
      return;
    }
    if (!phone || !name || !organization) {
      alert('Mohon lengkapi No. HP, Nama, dan Asal Lembaga.');
      return;
    }

    setLoadingSubmit(true);
    setNotice(null);
    try {
      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          name,
          organization,
          branchId: branch.id,
          title,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveLog(data.data.log);
        if (data.data.linkedBooking) {
          setMatchedBooking(data.data.linkedBooking);
          setNotice(`✅ Check-In Berhasil! Sesi otomatis ditautkan ke booking "${data.data.linkedBooking.title}". Timer pemakaian ruangan berjalan.`);
        } else {
          setNotice('✅ Check-In Berhasil! Timer waktu pemakaian ruangan mulai berjalan.');
        }
      } else {
        alert(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeLog) return;
    if (!confirm('Apakah Anda yakin ingin keluar ruangan (Check Out) sekarang?')) return;

    setLoadingSubmit(true);
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
        setNotice('🎉 Check-Out Berhasil! Durasi aktual penggunaan ruangan telah tersimpan.');
      } else {
        alert(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      {/* Box */}
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-400" />

        {/* Logo & Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <img
              src="/logo.webp"
              alt="BOffice Logo"
              className="h-9 w-auto object-contain brightness-110"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            <span>Cabang: {branch ? branch.name : branchCode || 'BOffice'}</span>
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">Daftar Hadir Ruang Meeting</h1>
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
          <div className="bg-gradient-to-b from-slate-900 to-slate-800/90 rounded-2xl border border-emerald-500/40 p-6 text-center space-y-4 shadow-xl">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 py-1 px-3 rounded-full border border-emerald-800/50 w-fit mx-auto">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Ruangan Sedang Digunakan</span>
            </div>

            <div>
              <div className="text-slate-400 text-xs">Waktu Berjalan (Stopwatch):</div>
              <div className="text-4xl font-black font-mono text-emerald-400 tracking-wider mt-1 animate-pulse">
                {formatStopwatch(elapsedSeconds)}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/60 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Penanggung Jawab:</span>
                <span className="font-bold text-white">{activeLog.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Asal Lembaga:</span>
                <span className="font-semibold text-slate-200">{activeLog.organization}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waktu Check-In:</span>
                <span className="text-emerald-400 font-mono">
                  {new Date(activeLog.checkInTime).toLocaleTimeString('id-ID')}
                </span>
              </div>
              {activeLog.bookingId && (
                <div className="flex justify-between text-blue-400">
                  <span>Tertaut Booking:</span>
                  <span className="font-semibold">{activeLog.title || activeLog.bookingId}</span>
                </div>
              )}
            </div>

            {/* Check Out Button */}
            <button
              onClick={handleCheckOut}
              disabled={loadingSubmit}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-2xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <LogOut className="w-5 h-5" />
              <span>{loadingSubmit ? 'Memproses Keluar...' : 'Keluar Ruangan (Check Out)'}</span>
            </button>
          </div>
        ) : (
          /* FORM CHECK-IN */
          <form onSubmit={handleCheckIn} className="space-y-4 text-xs">
            {/* Phone Input with Auto Lookup */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-400" /> No. WhatsApp / HP Penanggung Jawab *
                </span>
                {loadingLookup && <span className="text-[10px] text-blue-400 animate-pulse">Memeriksa data...</span>}
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {autoFilled && (
                <div className="mt-1.5 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Data terdeteksi otomatis dari pemakaian sebelumnya (lintas cabang)!</span>
                </div>
              )}
            </div>

            {/* Name Input */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Nama Lengkap *
              </label>
              <input
                type="text"
                required
                placeholder="Nama Perwakilan Rapat"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Organization / Company Input */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Asal Lembaga / Instansi / Tenant *
              </label>
              <input
                type="text"
                required
                placeholder="Nama Perusahaan atau Instansi"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Title / Topic */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5 text-slate-400" /> Topik / Keperluan Rapat
              </label>
              <input
                type="text"
                placeholder="Rapat Koordinasi / Presentasi Klien"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Check-In Submit Button */}
            <button
              type="submit"
              disabled={loadingSubmit}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <LogIn className="w-5 h-5" />
              <span>{loadingSubmit ? 'Memproses Check-In...' : 'Masuk Ruangan (Check In)'}</span>
            </button>
          </form>
        )}

        {/* Footer Info */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center leading-relaxed">
          Satu form mewakili satu sesi pemakaian. Waktu masuk dan keluar otomatis dicatat server dan ditautkan ke jadwal booking cabang ini.
        </div>
      </div>

      {/* Receipt Modal on Checkout */}
      {receipt && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-fadeIn text-slate-200">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-extrabold text-white text-base">Sesi Rapat Selesai</h3>
              <p className="text-slate-400 text-xs mt-0.5">Bukti Pemakaian Ruang Rapat BOffice</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl text-xs space-y-2 text-left border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Pengunjung:</span>
                <span className="font-bold text-white">{receipt.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lembaga:</span>
                <span className="text-slate-300">{receipt.organization}</span>
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
                <span className="text-emerald-400 font-extrabold text-sm">
                  {receipt.durationMinutes} Menit ({receipt.durationHours} Jam)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-emerald-400">
              📲 Ringkasan waktu pemakaian telah dikirimkan via WhatsApp ke {receipt.phone}!
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
