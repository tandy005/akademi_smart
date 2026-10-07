import type { Metadata } from 'next';
import './globals.css';
import { RoleProvider } from '@/context/RoleContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Akademi Voly Smart 09 - Sistem Manajemen & Smart Reminder Bola Voli',
  description:
    'Sistem manajemen Akademi Voly Smart 09 untuk pencatatan anggota, absensi latihan, iuran kas bulanan, laporan keuangan kas, berita agenda, dan auto-reminder WhatsApp 4 jam sebelum latihan.',
  icons: {
    icon: [
      { url: '/LogoAkademi.png', type: 'image/png' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/LogoAkademi.png',
    apple: '/LogoAkademi.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-slate-100 text-slate-800 min-h-screen">
        <RoleProvider>
          <AppShell>{children}</AppShell>
        </RoleProvider>
      </body>
    </html>
  );
}
