'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  KanbanSquare,
  Building2,
  CalendarDays,
  Users,
  FileText,
  Settings,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'CRM Sales', href: '/crm', icon: KanbanSquare },
  { name: 'Ruang & Virtual Office', href: '/offices', icon: Building2 },
  { name: 'Booking Meeting Room', href: '/meeting-rooms', icon: CalendarDays, badge: '8 Jam/Bln' },
  { name: 'Customer & Kontrak', href: '/customers', icon: Users },
  { name: 'Invoicing & Tagihan', href: '/invoices', icon: FileText },
  { name: 'WhatsApp & Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
          NOC
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wide text-sm">Nusantara Office</h1>
          <p className="text-xs text-slate-400">Rental & CRM Suite</p>
        </div>
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
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-semibold bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/50">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* KirimDev API Integration Info Box */}
      <div className="p-4 m-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <MessageSquare className="w-4 h-4" />
            <span>KirimDev WhatsApp</span>
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Pengingat perpanjangan sewa & tagihan dikirim otomatis via WhatsApp API.
        </p>
        <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Cloud API
          </span>
        </div>
      </div>
    </aside>
  );
}
