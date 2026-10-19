'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRole } from '@/context/RoleContext';
import {
  Users,
  User,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowRight,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  ClipboardCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  Member,
  MonthlyDue,
  CashTransaction,
  AttendanceRecord,
} from '@/lib/types';
import MonthlyFinanceChart from '@/components/MonthlyFinanceChart';
import {
  StatCard,
  Badge,
  Button,
  AcademyLogo,
} from '@/components/ui';

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export default function DashboardPage() {
  const { role, currentMember } = useRole();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [dues, setDues] = useState<MonthlyDue[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [finance, setFinance] = useState<{
    currentBalance: number;
    totalIncomeAll: number;
    totalExpenseAll: number;
  }>({ currentBalance: 0, totalIncomeAll: 0, totalExpenseAll: 0 });

  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, duesRes, financeRes, attRes] = await Promise.all([
        fetch('/api/members'),
        fetch(`/api/dues?year=${currentYear}`),
        fetch('/api/finance'),
        fetch('/api/attendance'),
      ]);

      if (membersRes.ok) setMembers(await membersRes.json());
      if (duesRes.ok) {
        const d = await duesRes.json();
        setDues(d.dues || []);
      }
      if (attRes.ok) {
        setAttendances(await attRes.json());
      }
      if (financeRes.ok) {
        const fData = await financeRes.json();
        setFinance(fData);
        const txList: CashTransaction[] = fData.transactions || [];
        setTransactions(txList);
        if (txList.length > 0) {
          const currentMonthPrefix = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
          const hasCurrentMonth = txList.some((t) => t.date && t.date.startsWith(currentMonthPrefix));
          if (!hasCurrentMonth) {
            const months = txList
              .map((t) => Number(t.date?.split('-')[1]))
              .filter((m) => !isNaN(m) && m >= 1 && m <= 12)
              .sort((a, b) => b - a);
            if (months.length > 0) {
              setSelectedMonth(months[0]);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  // Kehadiran bulan berjalan
  const monthlyAttendances = useMemo(() => {
    return attendances.filter((a) => {
      const d = a.scheduleId || a.date;
      return d && d.startsWith(currentMonthStr);
    });
  }, [attendances, currentMonthStr]);

  // Statistik kehadiran untuk atlet yang sedang login (role === 'MEMBER')
  const myMonthlyAttendance = useMemo(() => {
    if (!currentMember) return { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0, total: 0 };
    const myRecords = monthlyAttendances.filter((a) => a.memberId === currentMember.id);
    const counts = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0, total: myRecords.length };
    myRecords.forEach((r) => {
      if (r.status in counts) {
        counts[r.status]++;
      }
    });
    return counts;
  }, [monthlyAttendances, currentMember]);

  // Statistik tim keseluruhan bulan ini untuk Admin / Pengurus
  const teamAttendanceStats = useMemo(() => {
    const counts = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0, total: monthlyAttendances.length };
    monthlyAttendances.forEach((r) => {
      if (r.status in counts) {
        counts[r.status]++;
      }
    });
    return counts;
  }, [monthlyAttendances]);

  // Total Anggota, Putra & Putri
  const totalMembers = members.length;
  const putraMembers = members.filter((m) => m.gender === 'Putra').length;
  const putriMembers = members.filter((m) => m.gender === 'Putri').length;

  // 2. Keuangan Kas Tiap Bulan (Calculated for selectedMonth)
  const monthPrefix = `${currentYear}-${String(selectedMonth).padStart(2, '0')}`;
  const selectedMonthTxs = useMemo(() => {
    return transactions.filter((t) => t.date && t.date.startsWith(monthPrefix));
  }, [transactions, monthPrefix]);

  const monthlyIncome = useMemo(() => {
    return selectedMonthTxs
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [selectedMonthTxs]);

  const monthlyExpense = useMemo(() => {
    return selectedMonthTxs
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [selectedMonthTxs]);

  const monthlyNet = monthlyIncome - monthlyExpense;

  // Due status for current member in this month
  const memberDues = dues.filter((d) => d.memberId === currentMember?.id);
  const memberCurrentDue = memberDues.find((d) => d.month === currentMonth);

  return (
    <div className="space-y-7">
      {/* Welcome Banner with Akademi Smart Hero Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#8F0000] via-[#5C0303] to-[#1C0202] border border-[#A81B1B]/40 p-6 sm:p-8 shadow-2xl shadow-black/25">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D00000]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <AcademyLogo size="sm" showText={false} />
              <Badge variant="gold" size="sm">
                Akademi Voly Smart 09
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {role === 'ADMIN'
                ? 'Dashboard Manajemen & Pengurus'
                : `Selamat Datang, ${currentMember ? currentMember.name : 'Anggota'}`}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Sistem resmi Akademi Voly Smart 09 untuk pencatatan anggota bola voli putra &amp; putri,
              ringkasan kas bulanan, serta grafik laporan keuangan kas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {role === 'ADMIN' ? (
              <>
                <Link href="/anggota">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Users className="w-4 h-4 text-smart-gold-light" />}
                  >
                    Data Anggota
                  </Button>
                </Link>
                <Link href="/keuangan">
                  <Button
                    variant="gold"
                    size="sm"
                    icon={<TrendingUp className="w-4 h-4" />}
                  >
                    Kelola Kas &amp; Keuangan
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/keuangan">
                <Button
                  variant="gold"
                  size="sm"
                  icon={<TrendingUp className="w-4 h-4" />}
                >
                  Lihat Laporan Keuangan
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Member Persona Alert if unpaid this month */}
      {role === 'MEMBER' && currentMember && memberCurrentDue && !memberCurrentDue.isPaid && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-xs sm:text-sm">
              Iuran kas bulanan Anda untuk bulan ini (Bulan {currentMonth}) sebesar{' '}
              <strong className="text-slate-900 font-bold">
                Rp {memberCurrentDue.amount.toLocaleString('id-ID')}
              </strong>{' '}
              belum tercatat lunas.
            </div>
          </div>
          <Link href="/keuangan">
            <Button variant="primary" size="xs">
              Lihat Laporan Keuangan
            </Button>
          </Link>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION: KEHADIRAN & ABSENSI BULAN INI                    */}
      {/* ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <ClipboardCheck className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              {role === 'MEMBER'
                ? `Kehadiran Latihan Anda (${MONTH_NAMES[currentMonth - 1]} ${currentYear})`
                : `Rekap Kehadiran Tim (${MONTH_NAMES[currentMonth - 1]} ${currentYear})`}
            </h2>
          </div>
          <Link
            href="/absensi"
            className="text-xs text-[#8F0000] hover:text-[#D00000] hover:underline font-semibold flex items-center gap-1"
          >
            {role === 'MEMBER' ? 'Lihat Lembar Absensi' : 'Catat & Kelola Absensi'}{' '}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {role === 'MEMBER' ? (
          /* TAMPILAN KHUSUS ANGGOTA (MEMBER): Masuk berapa kali, Izin berapa kali, Sakit berapa kali */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Hadir */}
            <div className="rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all p-5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Hadir (Masuk)
                </span>
                <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {myMonthlyAttendance.HADIR} <span className="text-xs font-normal text-slate-500">kali</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Sesi latihan yang Anda ikuti
              </p>
            </div>

            {/* Izin */}
            <div className="rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all p-5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  Izin
                </span>
                <span className="p-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                  <ClipboardCheck className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {myMonthlyAttendance.IZIN} <span className="text-xs font-normal text-slate-500">kali</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Izin berhalangan hadir
              </p>
            </div>

            {/* Sakit */}
            <div className="rounded-2xl bg-white border border-slate-200 hover:border-amber-300 transition-all p-5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Sakit
                </span>
                <span className="p-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                  <AlertCircle className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {myMonthlyAttendance.SAKIT} <span className="text-xs font-normal text-slate-500">kali</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Kondisi kurang fit / istirahat
              </p>
            </div>

            {/* Alpa */}
            <div className="rounded-2xl bg-white border border-slate-200 hover:border-rose-300 transition-all p-5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Alpa / Tanpa Ket.
                </span>
                <span className="p-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                  <AlertCircle className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {myMonthlyAttendance.ALPA} <span className="text-xs font-normal text-slate-500">kali</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tidak hadir tanpa pemberitahuan
              </p>
            </div>
          </div>
        ) : (
          /* TAMPILAN UNTUK ADMIN / PENGURUS: Rekap Seluruh Tim */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all p-5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Total Hadir Tim
                </span>
                <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {teamAttendanceStats.HADIR} <span className="text-xs font-normal text-slate-500">atlet</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Kehadiran atlet bulan ini
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all p-5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  Total Izin Tim
                </span>
                <span className="p-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                  <ClipboardCheck className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {teamAttendanceStats.IZIN} <span className="text-xs font-normal text-slate-500">atlet</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Izin berhalangan hadir
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 hover:border-amber-300 transition-all p-5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Total Sakit Tim
                </span>
                <span className="p-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                  <AlertCircle className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {teamAttendanceStats.SAKIT} <span className="text-xs font-normal text-slate-500">atlet</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Sakit / istirahat medis
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 hover:border-rose-300 transition-all p-5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Total Alpa Tim
                </span>
                <span className="p-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                  <AlertCircle className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {teamAttendanceStats.ALPA} <span className="text-xs font-normal text-slate-500">atlet</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tanpa keterangan
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: RINGKASAN DATA ANGGOTA (POIN 1, 2, 3)         */}
      {/* ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-50 text-[#8F0000] border border-red-200 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Statistik Anggota Bola Voli
            </h2>
          </div>
          {role === 'ADMIN' && (
            <Link
              href="/anggota"
              className="text-xs text-[#8F0000] hover:text-[#D00000] hover:underline font-semibold flex items-center gap-1"
            >
              Kelola Data Anggota <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Total Anggota */}
          <StatCard
            title="Total Anggota"
            value={`${totalMembers} Atlet`}
            subtitle="Terdaftar resmi di Smart 09"
            icon={<Users className="w-5 h-5" />}
            linkHref={role === 'ADMIN' ? '/anggota' : undefined}
            linkText={role === 'ADMIN' ? 'Lihat Semua' : undefined}
            variant="maroon"
          />

          {/* 2. Total Anggota Putra */}
          <StatCard
            title="Total Anggota Putra"
            value={`${putraMembers} Atlet`}
            subtitle={`${totalMembers > 0 ? Math.round((putraMembers / totalMembers) * 100) : 0}% dari total anggota`}
            icon={<User className="w-5 h-5 text-blue-600" />}
            linkHref={role === 'ADMIN' ? '/anggota?gender=Putra' : undefined}
            linkText={role === 'ADMIN' ? 'Filter Putra' : undefined}
            variant="gold"
          />

          {/* 3. Total Anggota Putri */}
          <StatCard
            title="Total Anggota Putri"
            value={`${putriMembers} Atlet`}
            subtitle={`${totalMembers > 0 ? Math.round((putriMembers / totalMembers) * 100) : 0}% dari total anggota`}
            icon={<User className="w-5 h-5 text-rose-600" />}
            linkHref={role === 'ADMIN' ? '/anggota?gender=Putri' : undefined}
            linkText={role === 'ADMIN' ? 'Filter Putri' : undefined}
            variant="red"
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: LAPORAN KAS TIAP BULAN (POIN 4, 5, 6)         */}
      {/* ======================================================== */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Ringkasan Keuangan Kas Tiap Bulan ({currentYear})
            </h2>
          </div>

          {/* Month Filter Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Pilih Bulan:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold shadow-xs focus:outline-none focus:border-[#8F0000] cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1} className="bg-white text-slate-800">
                  Bulan {idx + 1} - {name} {currentYear}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Saldo Kas Berjalan / Saat Ini (DEDICATED CARD) */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-white border border-amber-300 rounded-2xl p-5 space-y-2 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Wallet className="w-4 h-4 text-amber-600" />
                Total Saldo Kas Berjalan
              </span>
              <span className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Rp {finance.currentBalance.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Sisa saldo kas riil saat ini (total kas terkumpul dikurangi seluruh pengeluaran)
            </p>
          </div>

          {/* 6. Total Pemasukan Kas Tiap Bulan */}
          <div className="rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4" />
                Pemasukan ({MONTH_NAMES[selectedMonth - 1]})
              </span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Rp {monthlyIncome.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500">
              Total kas masuk bulan {MONTH_NAMES[selectedMonth - 1]}
            </p>
          </div>

          {/* 5. Total Pengeluaran Kas Tiap Bulan */}
          <div className="rounded-2xl bg-white border border-slate-200 hover:border-rose-300 transition-all p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4" />
                Pengeluaran ({MONTH_NAMES[selectedMonth - 1]})
              </span>
              <span className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                <TrendingDown className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Rp {monthlyExpense.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500">
              Total biaya &amp; operasional bulan {MONTH_NAMES[selectedMonth - 1]}
            </p>
          </div>

          {/* 4. Sisa Kas Bulan Terpilih */}
          <div className="rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-slate-500" />
                Sisa Kas Bulan {MONTH_NAMES[selectedMonth - 1]}
              </span>
              <span className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight">
              <span className={monthlyNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                Rp {monthlyNet.toLocaleString('id-ID')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Selisih pemasukan - pengeluaran bulan {MONTH_NAMES[selectedMonth - 1]}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 3: GRAFIK LAPORAN KAS TIAP BULAN (POIN 7)        */}
      {/* ======================================================== */}
      <div>
        <MonthlyFinanceChart
          transactions={transactions}
          year={currentYear}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
        />
      </div>
    </div>
  );
}
