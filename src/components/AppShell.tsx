'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Image from 'next/image';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoadingAuth, role } = useRole();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/login';
  const isMemberAllowed = pathname === '/' || pathname === '/keuangan';

  // Route protection: If not logged in and not on login page, redirect to /login
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated && !isLoginPage) {
      router.replace('/login');
    }
  }, [isLoadingAuth, isAuthenticated, isLoginPage, router]);

  // Role protection: If Anggota (MEMBER) attempts to open forbidden pages, redirect to /
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated && role === 'MEMBER' && !isMemberAllowed && !isLoginPage) {
      router.replace('/');
    }
  }, [isLoadingAuth, isAuthenticated, role, isMemberAllowed, isLoginPage, router]);

  // 1. If currently on Login Page, render only login page without any menus, sidebar, or header
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
        {children}
      </div>
    );
  }

  // 2. Loading state while checking auth session
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-smart-gold/40 shadow-xl bg-smart-card p-1 animate-pulse">
            <Image
              src="/LogoAkademi.png"
              alt="Logo Akademi"
              width={64}
              height={64}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <svg className="animate-spin h-4 w-4 text-smart-gold" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Memeriksa sesi login...</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Not authenticated and waiting for redirect to /login
  if (!isAuthenticated) {
    return null;
  }

  // 4. Authenticated: Render full application with Navbar, Sidebar, and content
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all duration-200">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {role === 'MEMBER' && !isMemberAllowed ? (
              <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-[#8F0000] mb-4 shadow-sm">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Khusus Pengurus</h2>
                <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
                  Akun Anggota hanya memiliki akses untuk melihat <strong>Dashboard</strong> dan <strong>Laporan Keuangan</strong>. Menu ini tidak dapat diakses.
                </p>
                <Link
                  href="/"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-smart-maroon to-smart-red text-white text-xs font-bold shadow-md hover:brightness-110 transition"
                >
                  Kembali ke Dashboard
                </Link>
              </div>
            ) : (
              children
            )}
          </div>
          <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white shadow-xs">
            Akademi Voly Smart 09 &copy; {new Date().getFullYear()} &bull; Sistem Absensi, Kas &amp; Smart Reminder Voli
          </footer>
        </main>
      </div>
    </div>
  );
}
