'use client';

import { useState, useEffect } from 'react';
import { Building2, Check, Sparkles, Shield, Users, Layers, Tag } from 'lucide-react';

export default function OfficesPage() {
  const [offices, setOffices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'physical' | 'virtual'>('all');

  useEffect(() => {
    fetch('/api/offices')
      .then((r) => r.json())
      .then((d) => setOffices(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredOffices = offices.filter((off) => {
    if (activeTab === 'physical') return off.type === 'physical';
    if (activeTab === 'virtual') return off.type === 'virtual';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manajemen Ruang Kantor & Virtual Office</h1>
          <p className="text-xs text-slate-500 mt-1">
            Katalog ruangan kantor fisik (sewa bulanan/tanganan) dan Virtual Office (sewa tahunan dengan kuota Meeting Room 8 jam/bulan).
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Produk
          </button>
          <button
            onClick={() => setActiveTab('physical')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'physical' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kantor Fisik
          </button>
          <button
            onClick={() => setActiveTab('virtual')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'virtual' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Virtual Office (Tahunan)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Memuat katalog ruangan...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffices.map((office) => {
            const isPhysical = office.type === 'physical';
            const isRented = office.status === 'rented';

            return (
              <div
                key={office.id}
                className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden relative ${
                  isRented ? 'border-slate-200 opacity-90' : 'border-slate-200'
                }`}
              >
                {/* Status Badge Top Right */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      {office.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isRented
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isRented ? 'Terisi (Rented)' : 'Tersedia'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    {isPhysical ? (
                      <Building2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-teal-600 shrink-0" />
                    )}
                    <span>{office.name}</span>
                  </h3>

                  {office.description && (
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{office.description}</p>
                  )}
                </div>

                {/* Features & Pricing */}
                <div className="px-5 py-3 border-t border-b border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    Fasilitas Termasuk:
                  </div>
                  <ul className="space-y-1.5">
                    {office.facilities.map((fac: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{fac}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 bg-white">
                  <div className="flex items-baseline justify-between">
                    <div>
                      {isPhysical ? (
                        <>
                          <div className="text-lg font-bold text-slate-900">
                            Rp {office.monthlyPrice?.toLocaleString('id-ID')}
                            <span className="text-xs font-normal text-slate-400"> / bulan</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            atau Rp {office.yearlyPrice?.toLocaleString('id-ID')} / tahun
                          </div>
                        </>
                      ) : (
                        <div>
                          <div className="text-lg font-bold text-teal-700">
                            Rp {office.yearlyPrice?.toLocaleString('id-ID')}
                            <span className="text-xs font-normal text-slate-500"> / tahun</span>
                          </div>
                          <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                            Gratis 8 Jam Meeting Room / Bulan
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
