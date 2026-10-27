'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  TrendingUp,
  Newspaper,
  MessageSquareText,
  Zap,
  QrCode,
  FileSpreadsheet,
} from 'lucide-react';
import { Badge } from '@/components/ui';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { role, currentMember } = useRole();

  interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: string[];
    badge?: string;
    badgeHighlight?: boolean;
  }

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MEMBER'],
    },
    {
      label: 'Data Anggota',
      href: '/anggota',
      icon: Users,
      roles: ['ADMIN'],
    },
    {
      label: 'Absensi Latihan',
      href: '/absensi',
      icon: ClipboardCheck,
      roles: ['ADMIN'],
    },
    {
      label: 'Rekap Absensi',
      href: '/absensi/rekap',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'MEMBER'],
      badge: 'Cek Hadir',
    },
    {
      label: 'Scanner Lapangan',
      href: '/scan',
      icon: QrCode,
      roles: ['ADMIN'],
      badge: 'PIN 0909',
      badgeHighlight: true,
    },
    {
      label: 'Kas Bulanan',
      href: '/kas',
      icon: CreditCard,
      roles: ['ADMIN'],
    },
    {
      label: 'Laporan Keuangan',
      href: '/keuangan',
      icon: TrendingUp,
      roles: ['ADMIN', 'MEMBER'],
    },
    {
      label: 'WhatsApp Reminder',
      href: '/reminder',
      icon: MessageSquareText,
      roles: ['ADMIN'],
      badge: '1-Klik WA',
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 print:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between shadow-xs`}
      >
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Active Persona Info Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border shadow-xs ${
                  role === 'ADMIN'
                    ? 'bg-red-50 text-[#8F0000] border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {role === 'ADMIN' ? 'ADM' : 'MBR'}
              </div>
              <div className="overflow-hidden">
                <div className="text-[11px] font-medium text-slate-500">Peran Aktif</div>
                <div className="text-sm font-bold text-slate-900 truncate">
                  {role === 'ADMIN'
                    ? 'Pengurus'
                    : currentMember
                    ? currentMember.name
                    : 'Anggota'}
                </div>
              </div>
            </div>
            {role === 'MEMBER' && currentMember && (
              <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex justify-between">
                <span>{currentMember.position}</span>
                <span className="font-bold text-[#8F0000]">{currentMember.category}</span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-smart-maroon via-smart-red to-smart-maroon text-white font-bold shadow-md shadow-smart-red/25 border border-smart-red/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant={isActive ? 'gold' : 'maroon'} size="sm">
                      {item.badge}
                    </Badge>
                  )}
                  {item.badgeHighlight && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-smart-red opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-smart-red"></span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Feature Pill: Auto-Reminder 4 Jam */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-black text-[#8F0000] mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Smart WA Reminder</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Otomatis mengingatkan atlet &amp; orang tua tepat 4 jam sebelum sesi latihan dimulai.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
