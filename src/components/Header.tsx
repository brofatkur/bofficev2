'use client';

import { useState } from 'react';
import { Send, Bell, CheckCircle2, RefreshCw, UserCheck } from 'lucide-react';
import Link from 'next/link';

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
        setBatchResult(`Berhasil memproses ${data.processedCount} pengingat WhatsApp H-30/H-14/H-1!`);
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
        <div className="flex items-center gap-2">
          <img
            src="/logo.webp"
            alt="BOffice"
            className="h-7 w-auto object-contain"
          />
        </div>
        <span className="text-slate-300">|</span>
        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
          Sistem Operasional Internal
        </span>
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
          className="flex items-center gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50"
        >
          {loadingBatch ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Kirim Remind Kontrak (WA)</span>
        </button>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-3 pl-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            SA
          </div>
          <div className="text-left text-xs hidden sm:block">
            <div className="font-bold text-slate-800">Super Admin</div>
            <div className="text-slate-400">pusat@boffice.co.id</div>
          </div>
        </div>
      </div>
    </header>
  );
}
