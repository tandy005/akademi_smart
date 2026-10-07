'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRole } from '@/context/RoleContext';
import {
  Bell,
  Menu,
  X,
  Shield,
  Award,
  User,
  Clock,
  Send,
  LogIn,
  LogOut,
} from 'lucide-react';
import { TrainingSchedule } from '@/lib/types';
import { AcademyLogo, Badge } from '@/components/ui';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function Navbar({ onToggleSidebar, isSidebarOpen }: NavbarProps) {
  const {
    role,
    setRole,
    selectedMemberId,
    setSelectedMemberId,
    currentMember,
    allMembers,
    user,
    isAuthenticated,
    logout,
  } = useRole();
  const [upcomingSchedule, setUpcomingSchedule] = useState<TrainingSchedule | null>(null);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);

  useEffect(() => {
    const checkUpcoming = async () => {
      try {
        const res = await fetch('/api/schedules');
        if (res.ok) {
          const list: TrainingSchedule[] = await res.json();
          const now = new Date();
          const next = list.find((s) => {
            const dt = new Date(`${s.date}T${s.startTime}`);
            const diffH = (dt.getTime() - now.getTime()) / (1000 * 60 * 60);
            return diffH >= 0 && diffH <= 4.5;
          });
          if (next) {
            setUpcomingSchedule(next);
            const dt = new Date(`${next.date}T${next.startTime}`);
            const diffH = Math.max(0, Math.round(((dt.getTime() - now.getTime()) / (1000 * 60 * 60)) * 10) / 10);
            setHoursLeft(diffH);
          } else {
            setUpcomingSchedule(null);
          }
        }
      } catch (err) {
        console.error('Navbar schedule check error:', err);
      }
    };

    checkUpcoming();
    const interval = setInterval(checkUpcoming, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-800 shadow-xs">
      {/* 4-Hour Reminder Alert Banner with Smart Red & Gold Gradients */}
      {upcomingSchedule && !isAlertDismissed && (
        <div className="bg-gradient-to-r from-smart-maroon via-smart-red to-smart-maroon px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between text-white shadow-inner border-b border-smart-gold/30">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
            <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-smart-gold-light opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-smart-gold-light"></span>
            </span>
            <Clock className="w-4 h-4 flex-shrink-0 text-smart-gold-light" />
            <span>
              <strong className="text-smart-gold-light">PENGINGAT 4 JAM:</strong> Sesi latihan <em>&quot;{upcomingSchedule.title}&quot;</em> dimulai dalam{' '}
              <strong className="underline decoration-wavy text-white">{hoursLeft !== null ? `${hoursLeft} jam lagi` : 'segera'}</strong> ({upcomingSchedule.startTime} WIB) di {upcomingSchedule.location}!
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <Link
              href="/reminder"
              className="bg-smart-gold hover:bg-smart-gold-light text-smart-dark px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition shadow-sm"
            >
              <Send className="w-3 h-3" /> Cek Reminder WA
            </Link>
            <button
              onClick={() => setIsAlertDismissed(true)}
              className="text-white/80 hover:text-white p-1 transition cursor-pointer"
              title="Tutup banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand with LogoAkademi.png & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link href="/" className="flex items-center group">
            <AcademyLogo size="md" showText={true} textSubtitle="Sistem Informasi &amp; Reminder Voli" />
          </Link>
        </div>

        {/* Right: Role Switcher & Member Profile */}
        <div className="flex items-center gap-2.5">
          {/* Persona Switcher Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setRole('ADMIN')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                role === 'ADMIN'
                  ? 'bg-gradient-to-r from-smart-maroon to-smart-red text-white shadow-sm border border-smart-red/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
              title="Akses Pengurus / Admin"
            >
              <Shield className={`w-3.5 h-3.5 ${role === 'ADMIN' ? 'text-smart-gold-light' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Admin</span>
            </button>

            <button
              onClick={() => setRole('COACH')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                role === 'COACH'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
              title="Akses Pelatih Lapangan"
            >
              <Award className={`w-3.5 h-3.5 ${role === 'COACH' ? 'text-white' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Pelatih</span>
            </button>

            <button
              onClick={() => setRole('MEMBER')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                role === 'MEMBER'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
              title="Akses Atlet / Wali Murid"
            >
              <User className={`w-3.5 h-3.5 ${role === 'MEMBER' ? 'text-white' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Anggota</span>
            </button>
          </div>

          {/* Member selector if in MEMBER mode */}
          {role === 'MEMBER' && (
            <div className="hidden md:flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
              <span className="text-slate-500 font-medium">Atlet:</span>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                aria-label="Pilih Atlet"
                className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer"
              >
                {allMembers.map((m) => (
                  <option key={m.id} value={m.id} className="bg-white text-slate-900">
                    {m.name} ({m.position})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* WhatsApp Reminder Direct Link Shortcut */}
          <Link
            href="/reminder"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#8F0000] border border-slate-200 transition relative shadow-xs"
            title="Pengaturan WhatsApp & Reminder 4 Jam"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-smart-red rounded-full ring-2 ring-white"></span>
          </Link>

          {/* User Auth Action (Login / Logout) */}
          {user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="hidden xl:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 max-w-[120px] truncate">{user.name}</span>
                <span className="text-[10px] text-[#8F0000] font-bold">{user.role}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-900 text-xs font-semibold transition cursor-pointer"
                title="Keluar (Logout)"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-smart-maroon to-smart-red text-white font-bold text-xs shadow-md shadow-smart-red/20 hover:brightness-110 transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
