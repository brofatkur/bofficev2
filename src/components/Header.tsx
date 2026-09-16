'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bell, CheckCircle2, RefreshCw, LogOut, ChevronDown, User, Shield, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleLogout = () => {
    // Clear any local storage/session tokens if present
    if (typeof window !== 'undefined') {
      localStorage.removeItem('boffice_user');
      sessionStorage.removeItem('boffice_session');
    }
    setShowLogoutConfirm(false);
    setShowProfileMenu(false);
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
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

        {/* Super Admin Profile & Logout Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 text-left"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-blue-100">
                SA
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="text-left text-xs hidden sm:block">
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <span>Super Admin</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-slate-400 text-[10px]">admin@boffice.id</div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-[11px] font-bold text-slate-800">Super Administrator</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Akses penuh seluruh cabang BOffice</p>
              </div>

              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-all"
                >
                  <SettingsIcon className="w-4 h-4 text-slate-400" />
                  <span>Pengaturan Sistem & WA</span>
                </Link>
                <Link
                  href="/customers"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-all"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Daftar Data Tenant</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Keluar / Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Keluar</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin keluar dari sesi Super Admin BOffice?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/20"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
