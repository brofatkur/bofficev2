'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const raw = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(raw),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result.error || 'Tidak dapat masuk.');
      return;
    }

    const staff = ['super_admin', 'branch_admin', 'finance', 'sales'].includes(result.data?.role);
    router.push(staff ? '/' : '/portal');
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#f7faff] text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute -bottom-48 right-0 h-[30rem] w-[30rem] rounded-full bg-cyan-100/60 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.035)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <main className="relative mx-auto grid min-h-full w-full max-w-7xl items-center gap-12 px-5 py-10 lg:grid-cols-[1.05fr_0.75fr] lg:px-12">
        <section className="hidden max-w-2xl lg:block">
          <img src="/logo.webp" alt="BOffice" className="h-12 w-auto" />
          <p className="mt-16 flex items-center gap-3 text-xs font-extrabold uppercase tracking-[0.22em] text-blue-600">
            <span className="h-0.5 w-9 bg-blue-600" />
            Sistem Operasional Terpadu
          </p>
          <h1 className="mt-6 max-w-xl text-5xl font-black leading-[1.08] tracking-[-0.045em] text-slate-950 xl:text-6xl">
            Kelola operasional kantor dengan lebih jelas.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Satu ruang kerja untuk tim pusat, cabang, finance, sales, customer, reseller, dan mitra properti BOffice.
          </p>
          <div className="mt-10 grid max-w-xl grid-cols-2 gap-x-8 gap-y-5 border-t border-blue-100 pt-8">
            {['Data cabang terpusat', 'Invoice dan pembayaran', 'Booking ruang meeting', 'Laporan operasional'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-9 flex justify-center lg:hidden">
            <img src="/logo.webp" alt="BOffice" className="h-11 w-auto" />
          </div>
          <form
            onSubmit={submit}
            className="border border-white/90 bg-white/95 p-7 shadow-[0_28px_80px_rgba(30,64,175,0.12)] backdrop-blur sm:p-10"
          >
            <div className="flex h-12 w-12 items-center justify-center bg-blue-50 text-blue-600">
              <KeyRound className="h-6 w-6" />
            </div>
            <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">BOffice Workspace</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950">Selamat datang kembali</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">Masukkan akun BOffice Anda untuk melanjutkan ke dashboard.</p>

            <label className="mt-8 block text-xs font-bold text-slate-700">
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nama@boffice.co.id"
                className="mt-2 w-full border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label className="mt-5 block text-xs font-bold text-slate-700">
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Masukkan password"
                className="mt-2 w-full border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>

            {error && <p className="mt-5 border-l-4 border-rose-500 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}

            <button
              disabled={loading}
              className="mt-6 w-full bg-blue-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 hover:shadow-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? 'Memeriksa akun...' : 'Masuk ke Dashboard'}
            </button>

            <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">
              Belum menerima akun? Hubungi administrator BOffice.
            </p>
          </form>
          <p className="mt-6 text-center text-[11px] font-medium text-slate-400">© {new Date().getFullYear()} BOffice · Sistem operasional internal</p>
        </section>
      </main>
    </div>
  );
}
