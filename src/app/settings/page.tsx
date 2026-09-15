'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  MessageSquare,
  Key,
  Smartphone,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Building,
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    kirimdevApiKey: '',
    kirimdevPhoneNumberId: '',
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    bankAccountInfo: '',
    meetingRoomMonthlyFreeHours: 8,
    meetingRoomOverageRatePerHour: 90000,
  });

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Test WA State
  const [testPhone, setTestPhone] = useState('+6281234567890');
  const [testMessage, setTestMessage] = useState('Halo! Ini adalah pesan pengujian integrasi WhatsApp KirimDev API dari Nusantara Office Center.');
  const [testingWa, setTestingWa] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data.settings);
        setLogs(data.data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setNotice('Pengaturan API KirimDev & Sistem berhasil disimpan!');
      }
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(null), 5000);
    }
  };

  const handleTestWaSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingWa(true);
    setNotice(null);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testPhone,
          message: testMessage,
          messageType: 'test',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotice(`Pesan Uji Coba berhasil diproses! Status: ${data.log?.status}`);
        fetchData();
      } else {
        setNotice(`Gagal pengujian WA: ${data.error}`);
      }
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    } finally {
      setTestingWa(false);
      setTimeout(() => setNotice(null), 5000);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-400 text-xs">Memuat pengaturan...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Pengaturan & Integrasi KirimDev WhatsApp API</h1>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi API Key KirimDev (https://docs.kirimdev.com/platform/), parameter kuota meeting room, dan log pengiriman pesan.
        </p>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Settings Form & Test Send */}
        <div className="lg:col-span-2 space-y-6">
          {/* KirimDev API Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">KirimDev WhatsApp API Credential</h2>
                <p className="text-[11px] text-slate-400">Hubungkan akun KirimDev API Anda untuk pengiriman WA otomatis.</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>KirimDev API Key (KIRIM_KEY) *</span>
                </label>
                <input
                  type="password"
                  value={settings.kirimdevApiKey}
                  onChange={(e) => setSettings({ ...settings, kirimdevApiKey: e.target.value })}
                  placeholder="kdv_live_..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Dapatkan Bearer API Key dari Dashboard KirimDev di <a href="https://docs.kirimdev.com/platform/" target="_blank" rel="noreferrer" className="text-emerald-600 underline">docs.kirimdev.com</a>.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  <span>KirimDev Phone Number ID (Sender ID) *</span>
                </label>
                <input
                  type="text"
                  value={settings.kirimdevPhoneNumberId}
                  onChange={(e) => setSettings({ ...settings, kirimdevPhoneNumberId: e.target.value })}
                  placeholder="106540352242922"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kuota Meeting Room (Jam/Bln) Gratis</label>
                  <input
                    type="number"
                    value={settings.meetingRoomMonthlyFreeHours}
                    onChange={(e) => setSettings({ ...settings, meetingRoomMonthlyFreeHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tarif Over Kuota (Rp/Jam)</label>
                  <input
                    type="number"
                    value={settings.meetingRoomOverageRatePerHour}
                    onChange={(e) => setSettings({ ...settings, meetingRoomOverageRatePerHour: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Simpan Pengaturan'}
                </button>
              </div>
            </form>
          </div>

          {/* Test WhatsApp Tool */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Send className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-900 text-sm">Uji Coba Kirim WhatsApp API</h2>
            </div>

            <form onSubmit={handleTestWaSend} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Tujuan WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+628123456789"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Isi Pesan Uji Coba *</label>
                <textarea
                  rows={3}
                  required
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={testingWa}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {testingWa ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Test Kirim WA Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Column: Audit Log of sent WhatsApp Messages */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-sm">Riwayat WhatsApp Log</h2>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                {logs.length} Pesan
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">Belum ada riwayat pesan WA.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{log.recipient}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          log.status === 'sent'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'simulated'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight" title={log.content}>
                      {log.content}
                    </p>

                    <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
                      <span>Tipe: {log.messageType}</span>
                      <span>{new Date(log.sentAt).toLocaleTimeString('id-ID')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
