'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    setTimeout(() => {
      if (email && password) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('boffice_user', JSON.stringify({ email, role: 'super_admin' }));
        }
        router.push('/');
      } else {
        setError('Silakan masukkan email dan kata sandi valid.');
        setLoading(false);
      }
    }, 400);
  };

  const handleQuickDemoFill = () => {
    setEmail('admin@boffice.id');
    setPassword('SuperAdmin2026!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      {/* Container */}
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-xl shadow-blue-500/10 mb-2">
            <img src="/logo.webp" alt="BOffice Logo" className="h-10 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">BOffice Management</h1>
          <p className="text-xs text-slate-400">
            Sistem Operasional Kantor Virtual & Ruang Rapat Terintegrasi
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Login Super Admin</span>
            </div>
            <span className="text-[10px] bg-blue-950 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-800">
              v4.0
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Email Administrator</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="admin@boffice.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Fill Button */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-[11px] text-slate-300 font-medium flex items-center justify-center gap-1.5 transition-all border border-slate-700/60"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Isi Otomatis Kredensial Super Admin</span>
            </button>
          </div>
        </div>

        {/* Public Portals Quick Link */}
        <div className="text-center space-y-2 text-[11px] text-slate-400">
          <div>Ingin mengakses layanan publik tanpa login?</div>
          <div className="flex items-center justify-center gap-4 font-semibold text-blue-400">
            <Link href="/book" className="hover:text-blue-300 transition-colors">
              Form Booking Ruang Rapat
            </Link>
            <span>•</span>
            <Link href="/attendance" className="hover:text-blue-300 transition-colors">
              Portal Check-In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
