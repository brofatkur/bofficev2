'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitFork,
  Building2,
  CalendarDays,
  Users,
  FileText,
  Settings,
  PackageSearch,
  Handshake,
  Landmark,
  ShieldCheck,
  UserPlus,
  QrCode,
  LogOut,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Manajemen Cabang', href: '/branches', icon: GitFork, badge: 'Multi-Kota' },
  { name: 'Manajemen Customer', href: '/customers', icon: Users },
  { name: 'Manajemen Produk', href: '/products', icon: PackageSearch },
  { name: 'Manajemen Mitra', href: '/partners', icon: Handshake },
  { name: 'Booking Ruang Meeting', href: '/meeting-rooms', icon: CalendarDays },
  { name: 'Katalog Kantor & VO', href: '/offices', icon: Building2 },
  { name: 'Invoice & Penagihan', href: '/invoices', icon: FileText },
  { name: 'Manajemen Keuangan', href: '/finance', icon: Landmark },
  { name: 'WhatsApp & Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col min-h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header with BOffice Logo */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-white/95 px-2.5 py-1.5 rounded-xl flex items-center justify-center shadow-md">
            <img
              src="/logo.webp"
              alt="BOffice Logo"
              className="h-6 w-auto object-contain"
            />
          </div>
          <div>
            <h1 className="font-extrabold text-white tracking-tight text-sm">BOffice</h1>
            <p className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">Sistem Manajemen</p>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-bold bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full border border-blue-800">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Public Links Section */}
        <div className="pt-4 mt-4 border-t border-slate-800/80 px-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
            Tautan Publik
          </div>
          <div className="space-y-1">
            <Link
              href="/attendance"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-emerald-400 hover:bg-slate-900 transition-all font-medium"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Portal Check-In Rapat</span>
              </div>
              <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800">
                Publik
              </span>
            </Link>
            <Link
              href="/register"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-blue-400 hover:bg-slate-900 transition-all font-medium"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                <span>Form Registrasi Tenant</span>
              </div>
              <span className="text-[9px] bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800">
                Self-Input
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Super Admin & Logout Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              SA
            </div>
            <div className="min-w-0 text-left">
              <div className="text-xs font-bold text-white truncate">Super Admin</div>
              <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Online</span>
              </div>
            </div>
          </div>
          <Link
            href="/login"
            title="Keluar / Logout"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900 transition-all shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
