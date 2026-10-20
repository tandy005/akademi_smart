'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import {
  ClipboardCheck,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  Clock,
  QrCode,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Share2,
  ExternalLink,
  MessageSquare,
  Award,
  Filter,
  RefreshCw,
  Eye,
  Check,
  CalendarDays,
} from 'lucide-react';
import { Member, AttendanceRecord, AttendanceStatus, calculateMemberAge } from '@/lib/types';
import { PageHeader, Button, Badge, Modal } from '@/components/ui';
import { generateDirectWhatsAppUrl } from '@/lib/whatsapp-utils';

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const dayName = INDONESIAN_DAYS[d.getDay()];
  const dayNum = d.getDate();
  const monthName = INDONESIAN_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

function getDayName(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  return INDONESIAN_DAYS[d.getDay()];
}

function RekapAbsensiContent() {
  const { role, currentMember } = useRole();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get('date');
  const initialTab = searchParams.get('tab');

  const todayStr = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }, []);

  // Main Active Tab: 'DAILY' (Cek Hadir Tanggal Ini) vs 'MEMBERS' (Rekap Per Anggota)
  const [activeTab, setActiveTab] = useState<'DAILY' | 'MEMBERS'>(
    initialTab === 'members' ? 'MEMBERS' : 'DAILY'
  );

  // Daily View States
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const [members, setMembers] = useState<Member[]>([]);
  const [allAttendances, setAllAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Filters
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'Putra' | 'Putri'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [periodMonth, setPeriodMonth] = useState<string>('ALL'); // 'ALL' or '1'..'12'

  // Member History Modal State
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<Member | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch initial data
  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [memRes, attRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/attendance'),
      ]);

      if (memRes.ok) setMembers(await memRes.json());
      if (attRes.ok) setAllAttendances(await attRes.json());
    } catch (err) {
      console.error('Error fetching data for rekap:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered members list (active members only)
  const activeMembers = useMemo(() => {
    return members.filter((m) => {
      if (m.status === 'Non-Aktif') return false;
      if (genderFilter !== 'ALL' && m.gender !== genderFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesNis = m.registrationNumber && m.registrationNumber.toLowerCase().includes(q);
        const matchesCat = m.category && m.category.toLowerCase().includes(q);
        return matchesName || matchesNis || matchesCat;
      }
      return true;
    });
  }, [members, genderFilter, searchQuery]);

  // Daily view: Attendances for the selected date
  const attendancesForDate = useMemo(() => {
    return allAttendances.filter(
      (a) => a.scheduleId === selectedDate || a.date === selectedDate
    );
  }, [allAttendances, selectedDate]);

  // Daily view: Splitted list into "SUDAH HADIR" vs "BELUM ABSEN"
  const { attendedMembers, unattendedMembers } = useMemo(() => {
    const attendedMap = new Map<string, AttendanceRecord>();
    attendancesForDate.forEach((att) => {
      attendedMap.set(att.memberId, att);
    });

    const attended: Array<{ member: Member; record: AttendanceRecord }> = [];
    const unattended: Member[] = [];

    activeMembers.forEach((m) => {
      const record = attendedMap.get(m.id);
      if (record && record.status === 'HADIR') {
        attended.push({ member: m, record });
      } else {
        unattended.push(m);
      }
    });

    // Urutkan yang sudah hadir berdasarkan waktu scan terbaru lebih dulu
    attended.sort((a, b) => {
      const timeA = a.record.recordedAt ? new Date(a.record.recordedAt).getTime() : 0;
      const timeB = b.record.recordedAt ? new Date(b.record.recordedAt).getTime() : 0;
      return timeB - timeA;
    });

    return { attendedMembers: attended, unattendedMembers: unattended };
  }, [activeMembers, attendancesForDate]);

  // Quick mark status from Rekap view
  const handleQuickMark = async (memberId: string, status: AttendanceStatus, notes = '') => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: selectedDate,
          records: [
            {
              memberId,
              status,
              notes: notes || `Ditandai ${status} oleh Pengurus`,
            },
          ],
        }),
      });

      if (res.ok) {
        setActionSuccessMsg(`Status atlet berhasil diperbarui menjadi "${status}"`);
        setTimeout(() => setActionSuccessMsg(null), 3500);
        await loadData(true);
      } else {
        alert('Gagal memperbarui status');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    }
  };

  // Step Date
  const handleStepDate = (days: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + days);
      setSelectedDate(d.toISOString().split('T')[0]);
    }
  };

  // Copy WhatsApp Daily Attendance Report to Clipboard
  const handleCopyWaDailyReport = () => {
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const percent =
      activeMembers.length > 0
        ? Math.round((attendedMembers.length / activeMembers.length) * 100)
        : 0;

    let text = `📢 *REKAP KEHADIRAN LATIHAN SMART 09* 🏐\n`;
    text += `📅 *Hari/Tanggal:* ${formatDisplayDate(selectedDate)}\n`;
    text += `⏰ *Waktu Rekap:* ${nowTime} WIB\n`;
    text += `📊 *Total Hadir:* ${attendedMembers.length} dari ${activeMembers.length} Atlet (${percent}%)\n\n`;

    text += `✅ *DAFTAR SUDAH HADIR (${attendedMembers.length} Atlet):*\n`;
    if (attendedMembers.length > 0) {
      attendedMembers.forEach((item, idx) => {
        const time = item.record.recordedAt
          ? new Date(item.record.recordedAt).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-';
        text += `${idx + 1}. *${item.member.name}* (${item.member.registrationNumber || item.member.id}) - Jam ${time} WIB\n`;
      });
    } else {
      text += `_(Belum ada atlet yang scan/hadir)_\n`;
    }

    text += `\n⏳ *BELUM ABSEN (${unattendedMembers.length} Atlet):*\n`;
    if (unattendedMembers.length > 0) {
      unattendedMembers.slice(0, 15).forEach((m, idx) => {
        text += `${idx + 1}. ${m.name} (${m.category || 'U-15'})\n`;
      });
      if (unattendedMembers.length > 15) {
        text += `...dan ${unattendedMembers.length - 15} atlet lainnya.\n`;
      }
    } else {
      text += `_(Semua atlet telah hadir! 🎉)_\n`;
    }

    text += `\n_Akademi Bola Voli Smart 09 Sidoarjo ✨_`;

    navigator.clipboard.writeText(text);
    setActionSuccessMsg('📋 Format Laporan WhatsApp Rekap Hari Ini berhasil disalin ke clipboard!');
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // =========================================================================
  // REKAP PER ANGGOTA (Tab 2) CALCULATIONS
  // =========================================================================
  const allRecordedDatesList = useMemo(() => {
    const dates = new Set<string>();
    allAttendances.forEach((a) => {
      const d = a.scheduleId || a.date;
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        if (periodMonth === 'ALL') {
          dates.add(d);
        } else {
          const monthNum = String(new Date(d + 'T00:00:00').getMonth() + 1);
          if (monthNum === periodMonth) {
            dates.add(d);
          }
        }
      }
    });
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [allAttendances, periodMonth]);

  const memberAttendanceSummaries = useMemo(() => {
    return activeMembers.map((m) => {
      // Filter attendances for this member within periodMonth if set
      const memberRecords = allAttendances.filter((a) => {
        if (a.memberId !== m.id) return false;
        const d = a.scheduleId || a.date;
        if (!d) return false;
        if (periodMonth !== 'ALL') {
          const monthNum = String(new Date(d + 'T00:00:00').getMonth() + 1);
          return monthNum === periodMonth;
        }
        return true;
      });

      const hadirCount = memberRecords.filter((r) => r.status === 'HADIR').length;
      const izinCount = memberRecords.filter((r) => r.status === 'IZIN').length;
      const sakitCount = memberRecords.filter((r) => r.status === 'SAKIT').length;
      const alpaCount = memberRecords.filter((r) => r.status === 'ALPA').length;

      const totalSessions = Math.max(
        allRecordedDatesList.length,
        hadirCount + izinCount + sakitCount + alpaCount
      );

      const percentage =
        totalSessions > 0 ? Math.round((hadirCount / totalSessions) * 100) : 0;

      return {
        member: m,
        totalSessions,
        hadirCount,
        izinCount,
        sakitCount,
        alpaCount,
        percentage,
        records: memberRecords,
      };
    });
  }, [activeMembers, allAttendances, periodMonth, allRecordedDatesList]);

  // Detail Modal data for selected member
  const memberDetailData = useMemo(() => {
    if (!selectedMemberForDetail) return null;
    const summary = memberAttendanceSummaries.find(
      (s) => s.member.id === selectedMemberForDetail.id
    );

    // Sort detail records from newest to oldest
    const sortedRecords = (summary?.records || []).slice().sort((a, b) => {
      const dateA = a.scheduleId || a.date || '';
      const dateB = b.scheduleId || b.date || '';
      return dateB.localeCompare(dateA);
    });

    return {
      summary,
      sortedRecords,
    };
  }, [selectedMemberForDetail, memberAttendanceSummaries]);

  // Copy Member WhatsApp Report to Parents
  const handleCopyMemberWaReport = (m: Member, summary: typeof memberAttendanceSummaries[0]) => {
    const text = `🏐 *LAPORAN REKAP KEHADIRAN ATLET SMART 09* 🏐\n\nKepada Yth. Orang Tua / Wali dari:\n👤 *Nama Atlet:* ${m.name}\n🆔 *No. Registrasi (NIS):* ${m.registrationNumber || m.id}\n🏐 *Kategori:* ${m.category || 'U-15'} • ${m.gender || 'Putra'}\n\n📊 *Statistik Kehadiran Latihan:*\n• Total Sesi Terlaksana: ${summary.totalSessions} sesi\n• ✅ Hadir: ${summary.hadirCount} kali (${summary.percentage}%)\n• ℹ️ Izin: ${summary.izinCount} kali\n• 🏥 Sakit: ${summary.sakitCount} kali\n• ❌ Alpa: ${summary.alpaCount} kali\n\nPredikat Disiplin: *${
      summary.percentage >= 85
        ? 'Sangat Disiplin 🌟'
        : summary.percentage >= 60
        ? 'Cukup Baik 👍'
        : 'Perlu Perhatian Khusus ⚠️'
    }*\n\nTerima kasih atas dukungan Ayah/Bunda dalam perkembangan latihan ananda di Akademi Voly Smart 09 Sidoarjo. ✨`;

    navigator.clipboard.writeText(text);
    setActionSuccessMsg(`📋 Laporan kehadiran ${m.name} berhasil disalin ke clipboard!`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Utama */}
      <PageHeader
        badgeText="Rekapitulasi Kehadiran Atlet"
        badgeIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
        title="Rekapan Absensi & Live Check-in"
        subtitle="Pantau siapa saja yang sudah scan/hadir pada sesi latihan hari ini serta rekap kedisiplinan masing-masing anggota secara akurat."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              isLoading={refreshing}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            >
              Segarkan
            </Button>
            <Link href="/scan">
              <Button
                variant="gold"
                size="sm"
                icon={<QrCode className="w-4 h-4" />}
              >
                Scanner Lapangan
              </Button>
            </Link>
          </div>
        }
      />

      {/* Tab Switcher: Cek Hadir Tanggal Ini vs Rekap Per Anggota */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-smart-dark border border-smart-border">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('DAILY')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'DAILY'
                ? 'bg-smart-gold text-smart-dark shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-smart-card'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Cek Hadir Tanggal Ini (Live Scan)</span>
            {attendancesForDate.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'DAILY' ? 'bg-smart-dark text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {attendedMembers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MEMBERS')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'MEMBERS'
                ? 'bg-smart-gold text-smart-dark shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-smart-card'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Rekapan Masing-Masing Anggota</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'MEMBERS' ? 'bg-smart-dark text-amber-300' : 'bg-slate-800 text-slate-300'
            }`}>
              {activeMembers.length} Atlet
            </span>
          </button>
        </div>

        {/* Link Cepat ke Ceklis Absensi Manual */}
        <Link
          href={`/absensi?date=${selectedDate}`}
          className="text-xs text-smart-gold-light hover:underline font-semibold flex items-center justify-end px-3 py-1 gap-1"
        >
          <span>Buka Form Ceklis Manual</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-400 p-1 hover:text-emerald-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: CEK HADIR TANGGAL INI (LIVE SCAN & BELUM ABSEN) */}
      {/* ===================================================================== */}
      {activeTab === 'DAILY' && (
        <div className="space-y-6">
          {/* Date Selector & Action Bar */}
          <div className="p-5 rounded-2xl bg-smart-card border border-smart-border space-y-4 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Date Nav */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-smart-gold-light" />
                  <span>Pilih Tanggal Sesi Presensi:</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStepDate(-1)}
                    title="Hari Sebelumnya"
                    className="p-2.5 bg-smart-dark border border-smart-border rounded-xl text-slate-300 hover:text-white hover:border-smart-gold transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="relative flex items-center bg-smart-dark border border-smart-border hover:border-smart-gold rounded-xl px-3 py-2 cursor-pointer transition">
                    <Calendar className="w-4 h-4 text-smart-gold mr-2.5 flex-shrink-0" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer [color-scheme:dark]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStepDate(1)}
                    title="Hari Berikutnya"
                    className="p-2.5 bg-smart-dark border border-smart-border rounded-xl text-slate-300 hover:text-white hover:border-smart-gold transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayStr)}
                    className={`px-3 py-2.5 rounded-xl text-[11px] font-bold border transition cursor-pointer whitespace-nowrap ${
                      selectedDate === todayStr
                        ? 'bg-smart-gold text-smart-dark border-smart-gold'
                        : 'bg-smart-dark border-smart-border text-smart-gold-light hover:border-smart-gold'
                    }`}
                  >
                    Hari Ini
                  </button>
                </div>
                <div className="text-[11px] text-slate-400">
                  Tanggal Terpilih: <strong className="text-smart-gold-light font-bold">{formatDisplayDate(selectedDate)}</strong>
                </div>
              </div>

              {/* Action Buttons: Copy WA & Quick Stats */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="gold"
                  size="sm"
                  onClick={handleCopyWaDailyReport}
                  icon={<Share2 className="w-4 h-4" />}
                >
                  Salin Rekap WA Hari Ini
                </Button>
                <Link href="/scan">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<QrCode className="w-4 h-4" />}
                  >
                    Buka Kamera Scan
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Stat Counter Cards for this Date */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-smart-border/70 text-xs">
              <div className="p-3.5 rounded-xl bg-smart-dark border border-smart-border text-center">
                <span className="text-[11px] text-slate-400 block font-medium">Total Atlet Aktif</span>
                <span className="text-xl font-black text-white">{activeMembers.length}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[11px] text-emerald-400 block font-medium">Sudah Hadir (Scan)</span>
                <span className="text-xl font-black text-emerald-300">{attendedMembers.length}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-[11px] text-amber-400 block font-medium">Belum Hadir</span>
                <span className="text-xl font-black text-amber-300">{unattendedMembers.length}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-smart-maroon/30 border border-smart-gold/30 text-center">
                <span className="text-[11px] text-smart-gold-light block font-medium">Persentase Hadir</span>
                <span className="text-xl font-black text-smart-gold">
                  {activeMembers.length > 0
                    ? Math.round((attendedMembers.length / activeMembers.length) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-smart-card border border-smart-border">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama atau NIS atlet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-smart-dark border border-smart-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-smart-gold"
              />
            </div>

            <div className="flex items-center gap-1 bg-smart-dark p-1 rounded-xl border border-smart-border text-xs">
              {(['ALL', 'Putra', 'Putri'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenderFilter(g)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer text-xs ${
                    genderFilter === g
                      ? 'bg-smart-gold text-smart-dark font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {g === 'ALL' ? 'Semua' : `Tim ${g}`}
                </button>
              ))}
            </div>
          </div>

          {/* DUA KOLOM: SUDAH ABSEN vs BELUM ABSEN */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ========================================= */}
            {/* KOLOM 1: SUDAH ABSEN (HADIR) */}
            {/* ========================================= */}
            <div className="rounded-2xl bg-smart-card border border-emerald-500/30 overflow-hidden shadow-lg flex flex-col">
              <div className="p-4 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Sudah Absen (Hadir)</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                        {attendedMembers.length} Atlet
                      </span>
                    </h3>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatDisplayDate(selectedDate)}
                </span>
              </div>

              <div className="divide-y divide-smart-border/60 overflow-y-auto max-h-[520px] p-2 flex-1">
                {attendedMembers.length > 0 ? (
                  attendedMembers.map(({ member, record }, idx) => {
                    const time = record.recordedAt
                      ? new Date(record.recordedAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-';

                    return (
                      <div
                        key={member.id}
                        className="p-3 rounded-xl hover:bg-smart-dark/80 transition flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-slate-500 w-5 text-right">
                            {idx + 1}.
                          </span>
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-900 to-slate-900 border border-emerald-400/40 text-emerald-300 font-bold flex items-center justify-center text-sm flex-shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 truncate">
                              <span className="truncate">{member.name}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                member.gender === 'Putri' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                              }`}>
                                {member.gender || 'Putra'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                              {member.registrationNumber || member.id} &bull; {member.category || 'U-15'}
                            </div>
                            <div className="text-[10px] text-emerald-400/80 truncate">
                              {record.notes || 'Scan Presensi Lapangan'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 space-y-1">
                          <div className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                            <Clock className="w-3 h-3" />
                            <span>{time} WIB</span>
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMemberForDetail(member);
                                setIsDetailModalOpen(true);
                              }}
                              className="text-[10px] text-slate-400 hover:text-smart-gold-light hover:underline cursor-pointer"
                            >
                              Riwayat Atlet &rarr;
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                    <p className="font-semibold text-slate-400">Belum ada atlet yang tercatat hadir pada tanggal ini.</p>
                    <p className="text-[11px]">
                      Gunakan <Link href="/scan" className="text-smart-gold-light underline">Scanner Lapangan</Link> atau buka formulir ceklis untuk menandai kehadiran.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================= */}
            {/* KOLOM 2: BELUM ABSEN */}
            {/* ========================================= */}
            <div className="rounded-2xl bg-smart-card border border-amber-500/30 overflow-hidden shadow-lg flex flex-col">
              <div className="p-4 bg-amber-950/30 border-b border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <UserX className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Belum Absen</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
                        {unattendedMembers.length} Atlet
                      </span>
                    </h3>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">
                  Perlu Konfirmasi / Cek
                </span>
              </div>

              <div className="divide-y divide-smart-border/60 overflow-y-auto max-h-[520px] p-2 flex-1">
                {unattendedMembers.length > 0 ? (
                  unattendedMembers.map((member, idx) => {
                    const waReminderMsg = `Halo ${member.name}, sesi latihan bola voli Akademi Smart 09 tanggal ${formatDisplayDate(selectedDate)} sedang berlangsung. Apakah sedang dalam perjalanan ke lapangan atau ada kendala izin/sakit? Mohon konfirmasinya ya. Terima kasih! 🙏🏐`;
                    const waLink = member.phone ? generateDirectWhatsAppUrl(member.phone, waReminderMsg) : '#';

                    return (
                      <div
                        key={member.id}
                        className="p-3 rounded-xl hover:bg-smart-dark/80 transition flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-slate-500 w-5 text-right">
                            {idx + 1}.
                          </span>
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 font-bold flex items-center justify-center text-sm flex-shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 truncate">
                              <span className="truncate">{member.name}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                member.gender === 'Putri' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                              }`}>
                                {member.gender || 'Putra'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                              {member.registrationNumber || member.id} &bull; {member.category || 'U-15'}
                            </div>
                            {member.phone && (
                              <div className="text-[10px] text-slate-400 truncate">
                                WA: {member.phone}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick Mark Buttons for Coach */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {role !== 'MEMBER' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleQuickMark(member.id, 'HADIR', 'Ditandai Hadir di Lokasi')}
                                title="Tandai Hadir Langsung"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3 h-3" />
                                <span className="hidden sm:inline">Hadir</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickMark(member.id, 'IZIN', 'Izin Berhalangan')}
                                title="Tandai Izin"
                                className="px-2 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white font-bold text-[11px] transition cursor-pointer"
                              >
                                Izin
                              </button>
                            </>
                          )}
                          {member.phone && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Tanya Kehadiran via WhatsApp"
                              className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-emerald-400 text-xs space-y-1">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                    <p className="font-bold text-sm text-white">Lengkap! Seluruh Atlet Telah Hadir</p>
                    <p className="text-slate-400">Tidak ada atlet yang tersisa untuk tanggal ini.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: REKAPAN MASING-MASING ANGGOTA (AKUMULASI & STATISTIK) */}
      {/* ===================================================================== */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-smart-card border border-smart-border space-y-3 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama atau nomor NIS atlet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-smart-dark border border-smart-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-smart-gold transition"
                />
              </div>

              {/* Gender Filter Buttons */}
              <div className="flex items-center gap-1 bg-smart-dark p-1 rounded-xl border border-smart-border text-xs">
                {(['ALL', 'Putra', 'Putri'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenderFilter(g)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer text-xs ${
                      genderFilter === g
                        ? 'bg-smart-gold text-smart-dark font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {g === 'ALL' ? 'Semua Atlet' : `Tim ${g}`}
                  </button>
                ))}
              </div>

              {/* Month Period Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-smart-gold-light" />
                  Bulan:
                </span>
                <select
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(e.target.value)}
                  className="bg-smart-dark border border-smart-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-smart-gold cursor-pointer"
                >
                  <option value="ALL">Semua Periode</option>
                  {INDONESIAN_MONTHS.map((mName, idx) => (
                    <option key={mName} value={String(idx + 1)}>
                      {mName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-smart-border/60 flex items-center justify-between">
              <span>
                Total <strong>{memberAttendanceSummaries.length}</strong> atlet terdata &bull; {allRecordedDatesList.length} sesi latihan terlaksana
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-smart-gold-light hover:underline cursor-pointer"
                >
                  Hapus Pencarian
                </button>
              )}
            </div>
          </div>

          {/* Table of Members Attendance Recapitulation */}
          <div className="rounded-2xl bg-smart-card border border-smart-border overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-smart-dark/80 text-slate-400 border-b border-smart-border font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Nama Atlet</th>
                    <th className="py-3.5 px-4 text-center">Total Sesi</th>
                    <th className="py-3.5 px-4 text-center">Hadir</th>
                    <th className="py-3.5 px-4 text-center">Izin</th>
                    <th className="py-3.5 px-4 text-center">Sakit</th>
                    <th className="py-3.5 px-4 text-center">Alpa</th>
                    <th className="py-3.5 px-4 w-44">Tingkat Kedisiplinan</th>
                    <th className="py-3.5 px-4 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-smart-border/60">
                  {memberAttendanceSummaries.map((item, idx) => {
                    const m = item.member;
                    const isCurrentLoggedIn = role === 'MEMBER' && currentMember?.id === m.id;

                    return (
                      <tr
                        key={m.id}
                        className={`transition ${
                          isCurrentLoggedIn
                            ? 'bg-smart-maroon/20 border-l-2 border-smart-gold'
                            : 'hover:bg-smart-maroon/10'
                        }`}
                      >
                        {/* No */}
                        <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Nama Atlet */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm flex items-center gap-1.5">
                            <span>{m.name}</span>
                            {isCurrentLoggedIn && (
                              <Badge variant="gold" size="sm">
                                Anda
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {m.registrationNumber || m.id} &bull; {m.category || 'U-15'} &bull;{' '}
                            <span className={m.gender === 'Putri' ? 'text-rose-300' : 'text-blue-300'}>
                              {m.gender || 'Putra'}
                            </span>
                          </div>
                        </td>

                        {/* Total Sesi */}
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                          {item.totalSessions}
                        </td>

                        {/* Hadir */}
                        <td className="py-3.5 px-4 text-center font-mono font-black text-emerald-400 bg-emerald-500/5">
                          {item.hadirCount}
                        </td>

                        {/* Izin */}
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-400">
                          {item.izinCount}
                        </td>

                        {/* Sakit */}
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">
                          {item.sakitCount}
                        </td>

                        {/* Alpa */}
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-400">
                          {item.alpaCount}
                        </td>

                        {/* Tingkat Kedisiplinan & Bar */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-white font-mono">
                                {item.percentage}%
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  item.percentage >= 85
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : item.percentage >= 60
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                {item.percentage >= 85
                                  ? 'Sangat Baik'
                                  : item.percentage >= 60
                                  ? 'Cukup'
                                  : 'Perlu Perhatian'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  item.percentage >= 85
                                    ? 'bg-emerald-400'
                                    : item.percentage >= 60
                                    ? 'bg-amber-400'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, item.percentage)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center">
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => {
                              setSelectedMemberForDetail(m);
                              setIsDetailModalOpen(true);
                            }}
                            icon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Detail Riwayat
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {memberAttendanceSummaries.length === 0 && !loading && (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Tidak ada data atlet yang sesuai filter.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: DETAIL RIWAYAT ABSENSI ATLET */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMemberForDetail(null);
        }}
        title={`Riwayat Absensi: ${selectedMemberForDetail?.name || 'Atlet'}`}
        subtitle={`Nomor Registrasi: ${selectedMemberForDetail?.registrationNumber || selectedMemberForDetail?.id || '-'}`}
        icon={<Award className="w-5 h-5 text-smart-gold" />}
        maxWidth="xl"
      >
        {memberDetailData && selectedMemberForDetail && (
          <div className="p-5 sm:p-6 space-y-5 text-slate-900">
            {/* Header Profil & Disiplin Badge */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-950 to-red-800 text-amber-300 border-2 border-amber-400 font-black text-2xl flex items-center justify-center shadow-md flex-shrink-0">
                  {selectedMemberForDetail.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 leading-tight">
                    {selectedMemberForDetail.name}
                  </h3>
                  <div className="text-xs font-mono text-slate-500">
                    {selectedMemberForDetail.registrationNumber || selectedMemberForDetail.id} &bull; Tim{' '}
                    {selectedMemberForDetail.gender || 'Putra'} &bull; {selectedMemberForDetail.category || 'U-15'}
                  </div>
                  {selectedMemberForDetail.position && (
                    <div className="text-xs text-amber-700 font-semibold mt-0.5">
                      Posisi: {selectedMemberForDetail.position}
                    </div>
                  )}
                </div>
              </div>

              {/* Disiplin Score Box */}
              <div className="text-center sm:text-right">
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {memberDetailData.summary?.percentage}%
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    (memberDetailData.summary?.percentage || 0) >= 85
                      ? 'bg-emerald-100 text-emerald-800'
                      : (memberDetailData.summary?.percentage || 0) >= 60
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {(memberDetailData.summary?.percentage || 0) >= 85
                    ? 'Sangat Disiplin'
                    : (memberDetailData.summary?.percentage || 0) >= 60
                    ? 'Cukup Baik'
                    : 'Perlu Pembinaan'}
                </span>
              </div>
            </div>

            {/* Statistik Kehadiran Bulanan */}
            <div className="grid grid-cols-4 gap-2.5 text-center text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-700 block font-semibold">Hadir</span>
                <span className="text-lg font-black text-emerald-900">
                  {memberDetailData.summary?.hadirCount || 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] text-blue-700 block font-semibold">Izin</span>
                <span className="text-lg font-black text-blue-900">
                  {memberDetailData.summary?.izinCount || 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] text-amber-700 block font-semibold">Sakit</span>
                <span className="text-lg font-black text-amber-900">
                  {memberDetailData.summary?.sakitCount || 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-[10px] text-rose-700 block font-semibold">Alpa</span>
                <span className="text-lg font-black text-rose-900">
                  {memberDetailData.summary?.alpaCount || 0}
                </span>
              </div>
            </div>

            {/* Timeline Riwayat Tanggal Sesi */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Catatan Seluruh Sesi Latihan:
              </h4>

              <div className="max-h-[260px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                {memberDetailData.sortedRecords.length > 0 ? (
                  memberDetailData.sortedRecords.map((rec) => {
                    const dateStr = rec.scheduleId || rec.date || '';
                    const timeStr = rec.recordedAt
                      ? new Date(rec.recordedAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-';

                    return (
                      <div key={rec.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800">
                            {formatDisplayDate(dateStr)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {rec.notes || 'Latihan Rutin'}
                          </div>
                        </div>
                        <div className="text-right space-y-0.5">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              rec.status === 'HADIR'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.status === 'IZIN'
                                ? 'bg-blue-100 text-blue-800'
                                : rec.status === 'SAKIT'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {rec.status}
                          </span>
                          {rec.status === 'HADIR' && (
                            <div className="text-[10px] font-mono text-slate-400">
                              Jam {timeStr} WIB
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    Belum ada riwayat sesi latihan tercatat untuk atlet ini.
                  </div>
                )}
              </div>
            </div>

            {/* Tombol Salin Rapor WA ke Orang Tua */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  if (memberDetailData.summary) {
                    handleCopyMemberWaReport(selectedMemberForDetail, memberDetailData.summary);
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Salin Rapor Kehadiran (WhatsApp)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedMemberForDetail(null);
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function RekapAbsensiPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat rekapan absensi...</div>}>
      <RekapAbsensiContent />
    </Suspense>
  );
}
