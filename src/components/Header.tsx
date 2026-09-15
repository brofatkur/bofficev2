'use client';

import { useState } from 'react';
import { Send, Bell, CheckCircle2, RefreshCw } from 'lucide-react';

export default function Header() {
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);

  const handleRunBatchReminders = async () => {
    setLoadingBatch(true);
    setBatchResult(null);
    try {
      const res = await fetch('/api/whatsapp/batch-reminders', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBatchResult(`Berhasil memproses ${data.processedCount} pengingat WhatsApp!`);
      } else {
        setBatchResult(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      setBatchResult(`Error: ${err.message}`);
    } finally {
      setLoadingBatch(false);
      setTimeout(() => setBatchResult(null), 5000);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
          Sistem Sewa Kantor & CRM
        </span>
        <span className="text-slate-300">|</span>
        <span className="text-xs text-slate-500 font-medium">Nusantara Office Center</span>
      </div>

      <div className="flex items-center gap-4">
        {batchResult && (
          <div className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{batchResult}</span>
          </div>
        )}

        <button
          onClick={handleRunBatchReminders}
          disabled={loadingBatch}
          className="flex items-center gap-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50"
        >
          {loadingBatch ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Kirim Remind WA Expired</span>
        </button>

        <div className="h-6 w-px bg-slate-200" />

        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
            AD
          </div>
          <div className="text-left text-xs hidden sm:block">
            <div className="font-semibold text-slate-800">Admin Manager</div>
            <div className="text-slate-400">admin@nusantaraoffice.com</div>
          </div>
        </div>
      </div>
    </header>
  );
}
