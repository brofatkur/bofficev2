import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'BOffice - Sistem Manajemen Operasional Virtual Office & Private Office',
  description: 'Aplikasi Manajemen BOffice: Manajemen Cabang, Profil Penyewa, Booking Ruang Meeting Lintas Cabang, Daftar Hadir Check-In/Out, Invoicing & WhatsApp KirimDev.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
