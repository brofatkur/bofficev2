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
  Download,
  Printer,
  Copy,
  Check,
} from 'lucide-react';
import Link from 'next/link';

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // QR Modal state
  const [qrModalBranch, setQrModalBranch] = useState<any | null>(null);
  const [qrData, setQrData] = useState<{ qrDataUrl: string; checkinUrl: string } | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [copiedCheckin, setCopiedCheckin] = useState(false);
  const [copiedBooking, setCopiedBooking] = useState(false);

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
        alert(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
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

  const handleOpenQrModal = async (branch: any) => {
    setQrModalBranch(branch);
    setLoadingQr(true);
    setQrData(null);
    setCopiedCheckin(false);
    setCopiedBooking(false);
    try {
      const res = await fetch(`/api/branches/qrcode?code=${branch.code}`);
      const data = await res.json();
      if (data.success) {
        setQrData(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrData?.qrDataUrl || !qrModalBranch) return;
    const a = document.createElement('a');
    a.href = qrData.qrDataUrl;
    a.download = `QR-BOffice-${qrModalBranch.code}.png`;
    a.click();
  };

  const handleCopy = (text: string, type: 'checkin' | 'booking') => {
    navigator.clipboard.writeText(text);
    if (type === 'checkin') {
      setCopiedCheckin(true);
      setTimeout(() => setCopiedCheckin(false), 2000);
    } else {
      setCopiedBooking(true);
      setTimeout(() => setCopiedBooking(false), 2000);
    }
  };

  const handlePrintStandee = () => {
    if (!qrData?.qrDataUrl || !qrModalBranch) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Standee QR Code Check-In - ${qrModalBranch.name}</title>
          <style>
            @page { size: A5 portrait; margin: 15mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              text-align: center;
              color: #0f172a;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
            }
            .card {
              border: 3px solid #2563eb;
              border-radius: 24px;
              padding: 40px 30px;
              width: 100%;
              max-width: 420px;
              box-sizing: border-box;
              background: #ffffff;
            }
            .logo {
              height: 48px;
              margin-bottom: 12px;
            }
            .brand-sub {
              font-size: 11px;
              letter-spacing: 2px;
              font-weight: 700;
              color: #2563eb;
              text-transform: uppercase;
              margin-bottom: 24px;
            }
            .title {
              font-size: 22px;
              font-weight: 800;
              margin-bottom: 6px;
              color: #0f172a;
            }
            .branch {
              font-size: 13px;
              color: #64748b;
              margin-bottom: 24px;
            }
            .qr-wrapper {
              background: #f8fafc;
              border: 2px dashed #cbd5e1;
              border-radius: 16px;
              padding: 16px;
              display: inline-block;
              margin-bottom: 20px;
            }
            .qr-img {
              width: 240px;
              height: 240px;
              display: block;
            }
            .instruction {
              font-size: 14px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 6px;
            }
            .sub-inst {
              font-size: 11px;
              color: #64748b;
              line-height: 1.5;
            }
            .footer-url {
              margin-top: 24px;
              font-family: monospace;
              font-size: 11px;
              color: #2563eb;
              background: #eff6ff;
              padding: 8px 12px;
              border-radius: 8px;
              display: inline-block;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="/logo.webp" class="logo" alt="BOffice" />
            <div class="brand-sub">Smart Office System</div>
            <div class="title">CHECK-IN RUANG MEETING</div>
            <div class="branch">${qrModalBranch.name} (${qrModalBranch.code})</div>
            <div class="qr-wrapper">
              <img src="${qrData.qrDataUrl}" class="qr-img" />
            </div>
            <div class="instruction">Arahkan Kamera HP Anda ke QR Code</div>
            <div class="sub-inst">
              Pastikan Anda telah melakukan booking sebelumnya.<br/>
              Masukkan No. HP pemesan untuk mencatat kehadiran & mulai rapat.
            <div class="footer-url">${qrData.checkinUrl}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
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
          onClick={() => setShowAddModal(true)}
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

                {/* Public Attendance Link & QR Action Box */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5 text-blue-700">
                      <QrCode className="w-4 h-4" />
                      <span>Link Check-In:</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenQrModal(branch)}
                        className="text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR & Standee</span>
                      </button>
                      <Link
                        href={`/attendance/${branch.code}`}
                        target="_blank"
                        className="text-slate-600 hover:text-blue-700 flex items-center gap-1 text-[11px] font-semibold"
                      >
                        <span>Buka</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-600/20"
                >
                  Simpan Cabang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code & Standee Modal */}
      {qrModalBranch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  <span>QR Code Check-In Cabang</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {qrModalBranch.name} ({qrModalBranch.code})
                </p>
              </div>
              <button
                onClick={() => setQrModalBranch(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingQr ? (
              <div className="py-16 text-center text-slate-400 text-xs">Membuat QR Code Cabang...</div>
            ) : qrData ? (
              <div className="space-y-4">
                {/* QR Code Card Display */}
                <div className="flex flex-col items-center justify-center p-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                  <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-100 mb-3">
                    <img
                      src={qrData.qrDataUrl}
                      alt={`QR Code ${qrModalBranch.code}`}
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-800">Scan untuk Check-In Ruangan</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Pajang QR ini di meja resepsionis atau pintu ruang meeting cabang ini.
                  </p>
                </div>

                {/* Direct URLs & Quick Copy */}
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Link Check-In Mandiri:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={qrData.checkinUrl}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-slate-600 select-all"
                      />
                      <button
                        onClick={() => handleCopy(qrData.checkinUrl, 'checkin')}
                        className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 shrink-0"
                        title="Salin Link Check-in"
                      >
                        {copiedCheckin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Link Form Booking Cabang:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/book?branch=${qrModalBranch.id}`}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-slate-600 select-all"
                      />
                      <button
                        onClick={() =>
                          handleCopy(
                            `${typeof window !== 'undefined' ? window.location.origin : ''}/book?branch=${qrModalBranch.id}`,
                            'booking'
                          )
                        }
                        className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 shrink-0"
                        title="Salin Link Booking"
                      >
                        {copiedBooking ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions: Download & Print Standee */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    onClick={handleDownloadQr}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Download PNG</span>
                  </button>
                  <button
                    onClick={handlePrintStandee}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Standee</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-rose-500">
                Gagal memuat QR Code. Silakan coba lagi.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
