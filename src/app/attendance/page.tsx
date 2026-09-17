'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, MapPin, ArrowRight, QrCode, Sparkles } from 'lucide-react';

export default function AttendanceIndexPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/branches')
      .then((r) => r.json())
      .then((d) => setBranches(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white"
      style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}
    >
      <div
        className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-slate-300/60 space-y-6 relative overflow-hidden"
        style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-400" />

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
            <span>Portal Publik Daftar Hadir</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Pilih Cabang BOffice</h1>
          <p className="text-slate-500 text-xs">
            Silakan pilih lokasi cabang tempat Anda sedang menggunakan ruang meeting.
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs animate-pulse">
            Memuat daftar cabang BOffice...
          </div>
        ) : (
          <div className="space-y-3">
            {branches.map((b) => (
              <Link
                key={b.id}
                href={`/attendance/${b.code}`}
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-400 rounded-2xl transition-all group shadow-sm"
              >
                <div className="space-y-1 text-left">
                  <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>{b.name}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                      {b.code}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{b.city} • {b.address}</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 text-center leading-relaxed">
          💡 Setiap cabang memiliki tautan langsung atau QR Code tersendiri untuk check-in instan.
        </div>
      </div>
    </div>
  );
}
