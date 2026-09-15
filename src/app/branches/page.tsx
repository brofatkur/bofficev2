'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  QrCode,
  ExternalLink,
  CheckCircle2,
  X,
  Edit2,
  Power,
  Search,
} from 'lucide-react';
import Link from 'next/link';

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    city: '',
    address: '',
    phone: '',
  });

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      if (data.success) {
        setBranches(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNotice(`Cabang baru "${data.data.name}" (${data.data.code}) berhasil ditambahkan beserta ruang meeting cabangnya!`);
        fetchBranches();
        setForm({ code: '', name: '', city: '', address: '', phone: '' });
      } else {
        setError(typeof data.error === 'string' ? data.error : 'Cabang gagal disimpan. Periksa data lalu coba kembali.');
      }
    } catch (err: any) {
      setError(err?.message || 'Tidak dapat terhubung ke server. Silakan coba kembali.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (branch: any) => {
    const newStatus = branch.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch('/api/branches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: branch.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice(`Status cabang ${branch.name} diubah menjadi ${newStatus === 'active' ? 'Aktif' : 'Non-Aktif'}.`);
        fetchBranches();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manajemen Cabang BOffice</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan lokasi cabang di berbagai kota, ruang meeting cabang, serta tautan publik daftar hadir per cabang.
          </p>
        </div>
        <button
          onClick={() => { setError(null); setShowAddModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Cabang Baru</span>
        </button>
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

      {/* Branch Cards */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Memuat daftar cabang...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {branches.map((branch) => {
            const isActive = branch.status === 'active';
            return (
              <div
                key={branch.id}
                className={`bg-white rounded-2xl border p-6 shadow-sm space-y-4 transition-all ${
                  isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/60 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                        {branch.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isActive ? 'Aktif Beroperasi' : 'Non-Aktif'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{branch.name}</h3>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(branch)}
                    className={`p-2 rounded-xl border text-xs transition-all ${
                      isActive
                        ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 border-slate-200'
                        : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                    }`}
                    title={isActive ? 'Non-aktifkan cabang' : 'Aktifkan cabang'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{branch.address}, {branch.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{branch.phone}</span>
                  </div>
                </div>

                {/* Public Attendance Link Box */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5 text-blue-700">
                      <QrCode className="w-4 h-4" />
                      <span>Link Publik Daftar Hadir Cabang:</span>
                    </span>
                    <Link
                      href={`/attendance/${branch.code}`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[11px] font-bold"
                    >
                      <span>Buka Form</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 select-all break-all">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/attendance/{branch.code}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Tambah Cabang BOffice Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              {error && (
                <div role="alert" className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 leading-relaxed">
                  <strong className="block mb-0.5">Cabang belum tersimpan</strong>
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Cabang *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: JKT-KNG"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kota *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bandung"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Cabang *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BOffice Dago Creative Hub"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Alamat jalan, gedung, lantai..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. Kontak / Telepon *</label>
                <input
                  type="text"
                  required
                  placeholder="+62..."
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-blue-800 leading-relaxed">
                💡 Sistem akan secara otomatis menginisialisasi 1 Ruang Meeting bawaan cabang dan tautan check-in publik <code className="font-bold">/attendance/{form.code || '[KODE]'}</code>.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-wait text-white rounded-xl font-semibold shadow-md shadow-blue-600/20"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Cabang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
