'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Standalone public pages without admin sidebar or header
  const isPublicPage =
    pathname.startsWith('/attendance') ||
    pathname.startsWith('/checkin') ||
    pathname.startsWith('/book') ||
    pathname.startsWith('/register') ||
    pathname === '/login' ||
    pathname.startsWith('/invite');

  // For public pages, immediately render standalone full-screen content with bright background
  if (isPublicPage) {
    return <main className="min-h-screen w-full bg-slate-50 text-slate-900">{children}</main>;
  }

  // Client safety fallback in case pathname is lagging during client routing
  if (typeof window !== 'undefined') {
    const loc = window.location.pathname;
    if (
      loc.startsWith('/attendance') ||
      loc.startsWith('/checkin') ||
      loc.startsWith('/book') ||
      loc.startsWith('/register') ||
      loc === '/login' ||
      loc.startsWith('/invite')
    ) {
      return <main className="min-h-screen w-full bg-slate-50 text-slate-900">{children}</main>;
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
