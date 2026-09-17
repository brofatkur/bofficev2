'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function TenantRegistrationPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    companyName: '',
    entityType: 'PT',
    serviceType: 'virtual_office',
    branchId: '',
    picName: '',
    phone: '',
    email: '',
    address: '',
    npwp: '',
    nib: '',
    notes: '',
  });

  useEffect(() => {
    fetch('/api/branches')
      .then((r) => r.json())
      .then((d) => {
        const bl = d.data || [];
        setBranches(bl);
        if (bl.length > 0) {
          setForm((f) => ({ ...f, branchId: bl[0].id }));
        }
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          status: 'calon_tenant', // Status awal: menunggu verifikasi admin per PRD 5.2
          startDate: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        alert(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/50 to-blue-50/70 text-slate-900 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="max-w-xl w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200/60 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-400" />

        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <img
              src="/logo.webp"
              alt="BOffice Logo"
              className="h-12 w-auto object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Formulir Pendaftaran Penyewa Baru</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Registrasi Layanan BOffice
          </h1>
          <p className="text-slate-500 text-xs">
            Isi data perusahaan Anda untuk berlangganan Virtual Office atau Private Office di BOffice.
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-50/80 p-6 rounded-2xl border border-emerald-200 text-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Pendaftaran Berhasil Dikirim!</h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Data registrasi Anda telah masuk ke sistem dengan status <strong>"Menunggu Verifikasi"</strong>.
                Tim Admin Cabang BOffice akan segera menghubungi Anda melalui WhatsApp untuk proses verifikasi dokumen dan pengaktifan kontrak.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/attendance"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20"
              >
                <span>Lihat Portal Daftar Hadir Meeting Room</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilihan Layanan *</label>
                <select
                  value={form.serviceType}
                  onChange={(e) => setForm({ ...form, serviceType: e.target.value as any })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                >
                  <option value="virtual_office">Virtual Office (Sewa Tahunan)</option>
                  <option value="private_office">Private Office (Kantor Fisik)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cabang Tujuan *</label>
                <select
                  value={form.branchId}
                  onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block font-semibold text-slate-700 mb-1">Bentuk Badan Usaha *</label>
                <select
                  value={form.entityType}
                  onChange={(e) => setForm({ ...form, entityType: e.target.value as any })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                >
                  <option value="PT">PT (Perseroan Terbatas)</option>
                  <option value="CV">CV</option>
                  <option value="Perorangan">Perorangan</option>
                  <option value="Yayasan">Yayasan</option>
                  <option value="Firma">Firma</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan / Lembaga *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Digital Inovasi Bangsa"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama PIC *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap PIC"
                  value={form.picName}
                  onChange={(e) => setForm({ ...form, picName: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp PIC *</label>
                <input
                  type="text"
                  required
                  placeholder="081234567890"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email PIC *</label>
                <input
                  type="email"
                  required
                  placeholder="pic@perusahaan.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">NPWP Perusahaan (opsional)</label>
                <input
                  type="text"
                  placeholder="00.000.000.0-000.000"
                  value={form.npwp}
                  onChange={(e) => setForm({ ...form, npwp: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIB Perusahaan (opsional)</label>
                <input
                  type="text"
                  placeholder="Nomor Induk Berusaha"
                  value={form.nib}
                  onChange={(e) => setForm({ ...form, nib: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alamat Korespondensi / Asal *</label>
              <textarea
                rows={2}
                required
                placeholder="Alamat domisili operasional saat ini..."
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-600/20 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{loading ? 'Mengirim Data...' : 'Kirim Pendaftaran Tenant'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
