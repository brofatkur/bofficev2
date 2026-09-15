'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Clock,
  UserCheck,
  Building2,
  Phone,
  LogIn,
  LogOut,
  CheckCircle2,
  Sparkles,
  Search,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function PublicAttendancePage() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [roomId, setRoomId] = useState('');
  const [title, setTitle] = useState('Meeting Routine');

  const [rooms, setRooms] = useState<any[]>([]);
  const [autoFilled, setAutoFilled] = useState(false);
  const [activeLog, setActiveLog] = useState<any | null>(null);

  const [loadingLookup, setLoadingLookup] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Stopwatch timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Completed receipt modal
  const [receipt, setReceipt] = useState<any | null>(null);

  // Load meeting rooms
  useEffect(() => {
    fetch('/api/meeting-rooms')
      .then((r) => r.json())
      .then((d) => {
        const roomList = d.data || [];
        setRooms(roomList);
        if (roomList.length > 0) {
          setRoomId(roomList[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Phone number lookup debounce
  useEffect(() => {
    if (!phone || phone.length < 9) {
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

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !name || !organization || !roomId) {
      alert('Mohon lengkapi No. HP, Nama, Asal Lembaga, dan Ruangan');
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
          roomId,
          title,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveLog(data.data.log);
        setNotice('✅ Check-In Berhasil! Timer waktu pemakaian ruangan mulai berjalan.');
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
        setNotice('🎉 Check-Out Berhasil! Durasi penggunaan ruangan telah terekam.');
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4">
      {/* Container Box */}
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow Header Background */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Public Attendance Portal</span>
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">Daftar Hadir Meeting Room</h1>
          <p className="text-slate-400 text-xs">Nusantara Office Center • Jakarta</p>
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
              <span>Sesi Ruang Rapat Sedang Berlangsung</span>
            </div>

            <div>
              <div className="text-slate-400 text-xs">Lama Penggunaan Ruangan:</div>
              <div className="text-4xl font-black font-mono text-emerald-400 tracking-wider mt-1 animate-pulse">
                {formatStopwatch(elapsedSeconds)}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/60 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Pengunjung:</span>
                <span className="font-bold text-white">{activeLog.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Asal Lembaga:</span>
                <span className="font-semibold text-slate-200">{activeLog.organization}</span>
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
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> No. WhatsApp / HP *
                </span>
                {loadingLookup && <span className="text-[10px] text-emerald-400 animate-pulse">Mencari data...</span>}
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {autoFilled && (
                <div className="mt-1.5 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Data terdeteksi otomatis dari pemakaian sebelumnya!</span>
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
                placeholder="Masukkan Nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Organization / Company Input */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Asal Lembaga / Instansi / Perusahaan *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: PT Example Indonesia / Instansi"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Select Room */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Pilih Ruangan Meeting *
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Kapasitas {r.capacity} Pax)
                  </option>
                ))}
              </select>
            </div>

            {/* Title / Topic */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Topik Meeting / Keperluan</label>
              <input
                type="text"
                placeholder="Contoh: Rapat Internal / Client Demo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Check-In Submit Button */}
            <button
              type="submit"
              disabled={loadingSubmit}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <LogIn className="w-5 h-5" />
              <span>{loadingSubmit ? 'Memproses Check-In...' : 'Masuk Ruangan (Check In)'}</span>
            </button>
          </form>
        )}

        {/* Footer Info */}
        <div className="pt-3 border-t border-slate-700/60 text-[11px] text-slate-500 text-center leading-relaxed">
          Waktu check-in dan check-out terekam otomatis untuk mengkalkulasi durasi pemakaian ruangan.
        </div>
      </div>

      {/* Receipt Modal on Checkout */}
      {receipt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-fadeIn text-slate-200">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-extrabold text-white text-base">Sesi Rapat Selesai</h3>
              <p className="text-slate-400 text-xs mt-0.5">Bukti Waktu Pemakaian Ruang Rapat</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl text-xs space-y-2 text-left border border-slate-700/60">
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
              📲 Ringkasan waktu penggunaan telah dikirimkan via WhatsApp KirimDev!
            </p>

            <button
              onClick={() => setReceipt(null)}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
