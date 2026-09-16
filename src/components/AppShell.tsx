'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Standalone public pages without admin sidebar or header
  const isPublicPage =
    pathname.startsWith('/attendance') ||
    pathname.startsWith('/checkin') ||
    pathname.startsWith('/book') ||
    pathname.startsWith('/register') ||
    pathname === '/login';

  if (isPublicPage) {
    return <main className="min-h-screen w-full">{children}</main>;
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
