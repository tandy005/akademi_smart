'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRole } from '@/context/RoleContext';
import {
  Users,
  Calendar,
  ClipboardCheck,
  CreditCard,
  TrendingUp,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Bell,
  ArrowRight,
  Sparkles,
  Award,
} from 'lucide-react';
import {
  Member,
  TrainingSchedule,
  MonthlyDue,
  CashTransaction,
  NewsAgenda,
} from '@/lib/types';
import ReminderModal from '@/components/ReminderModal';
import {
  StatCard,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Button,
  AcademyLogo,
} from '@/components/ui';

export default function DashboardPage() {
  const { role, currentMember, allMembers } = useRole();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [schedules, setSchedules] = useState<TrainingSchedule[]>([]);
  const [dues, setDues] = useState<MonthlyDue[]>([]);
  const [finance, setFinance] = useState<{
    currentBalance: number;
    totalIncomeAll: number;
    totalExpenseAll: number;
  }>({ currentBalance: 0, totalIncomeAll: 0, totalExpenseAll: 0 });
  const [news, setNews] = useState<NewsAgenda[]>([]);
  const [selectedScheduleForReminder, setSelectedScheduleForReminder] =
    useState<TrainingSchedule | null>(null);
  const [autoReminderStatus, setAutoReminderStatus] = useState<string>('Memeriksa...');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, schedulesRes, duesRes, financeRes, newsRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/schedules'),
        fetch(`/api/dues?year=${new Date().getFullYear()}`),
        fetch('/api/finance'),
        fetch('/api/news'),
      ]);

      if (membersRes.ok) setMembers(await membersRes.json());
      if (schedulesRes.ok) setSchedules(await schedulesRes.json());
      if (duesRes.ok) {
        const d = await duesRes.json();
        setDues(d.dues || []);
      }
      if (financeRes.ok) setFinance(await financeRes.json());
      if (newsRes.ok) setNews(await newsRes.json());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerCronCheck = async () => {
    setAutoReminderStatus('Mengecek jadwal 4 jam...');
    try {
      const res = await fetch('/api/reminder/cron');
      const data = await res.json();
      if (data.remindedSchedules && data.remindedSchedules.length > 0) {
        setAutoReminderStatus(
          `✅ Auto-reminder terkirim untuk: ${data.remindedSchedules.join(', ')}`
        );
      } else {
        setAutoReminderStatus('✅ Auto-reminder aktif & siap siaga (4 jam sebelum latihan)');
      }
      fetchData();
    } catch {
      setAutoReminderStatus('Auto-reminder standby');
    }
  };

  const now = new Date();
  const upcomingSchedules = schedules.filter((s) => {
    const dt = new Date(`${s.date}T${s.startTime}`);
    return dt.getTime() >= now.getTime() - 2 * 60 * 60 * 1000;
  });
  const nextTraining = upcomingSchedules[0] || schedules[0] || null;

  const currentMonth = now.getMonth() + 1;
  const currentMonthDues = dues.filter((d) => d.month === currentMonth);
  const paidCount = currentMonthDues.filter((d) => d.isPaid).length;
  const duesPaidPercentage =
    currentMonthDues.length > 0 ? Math.round((paidCount / currentMonthDues.length) * 100) : 0;

  const memberDues = dues.filter((d) => d.memberId === currentMember?.id);
  const memberCurrentDue = memberDues.find((d) => d.month === currentMonth);

  return (
    <div className="space-y-6">
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
                : role === 'COACH'
                ? 'Panel Pelatih & Kehadiran Atlet'
                : `Selamat Datang, ${currentMember ? currentMember.name : 'Atlet'}`}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Sistem resmi Akademi Voly Smart 09 untuk pencatatan anggota bola voli, absensi latihan,
              pembayaran kas bulanan, laporan keuangan, serta pengingat WhatsApp otomatis 4 jam
              sebelum latihan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={triggerCronCheck}
              icon={<Bell className="w-4 h-4 text-smart-gold-light" />}
            >
              Cek Auto Reminder
            </Button>
            <Link href="/jadwal">
              <Button
                variant="gold"
                size="sm"
                icon={<Calendar className="w-4 h-4" />}
              >
                Kelola Jadwal
              </Button>
            </Link>
          </div>
        </div>

        {/* Status reminder heartbeat pill */}
        <div className="mt-5 pt-4 border-t border-[#A81B1B]/40 flex items-center gap-2 text-xs text-red-100/90">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-smart-gold-light opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-smart-gold-light"></span>
          </span>
          <span className="text-red-200/80">Status Sistem Auto-Reminder:</span>
          <span className="font-bold text-smart-gold-light">{autoReminderStatus}</span>
        </div>
      </div>

      {/* Member Persona Alert if unpaid this month */}
      {role === 'MEMBER' && currentMember && memberCurrentDue && !memberCurrentDue.isPaid && (
        <div className="p-4 rounded-2xl bg-smart-maroon/30 border border-smart-red/50 flex items-center justify-between gap-3 text-red-200 shadow-md">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-smart-gold-light flex-shrink-0" />
            <div className="text-xs sm:text-sm">
              Iuran kas bulanan Anda untuk bulan ini (Bulan {currentMonth}) sebesar{' '}
              <strong className="text-white">
                Rp {memberCurrentDue.amount.toLocaleString('id-ID')}
              </strong>{' '}
              belum tercatat lunas.
            </div>
          </div>
          <Link href="/kas">
            <Button variant="gold" size="xs">
              Lihat Kas Saya
            </Button>
          </Link>
        </div>
      )}

      {/* Top 4 Metrics Grid with Reusable StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Atlet Aktif"
          value={members.filter((m) => m.status === 'Aktif').length}
          subtitle="U-12, U-15 & U-18"
          icon={<Users className="w-5 h-5" />}
          linkHref="/anggota"
          linkText="Data Atlet"
          variant="maroon"
        />

        <StatCard
          title="Jadwal Sesi Latihan"
          value={`${schedules.length} Sesi`}
          subtitle="Auto reminder 4 jam aktif"
          icon={<Calendar className="w-5 h-5" />}
          linkHref="/jadwal"
          linkText="Jadwal"
          variant="gold"
        />

        <StatCard
          title={`Kas Bulan ${currentMonth}`}
          value={`${paidCount}/${currentMonthDues.length} Lunas`}
          subtitle={`${duesPaidPercentage}% terkumpul`}
          icon={<CreditCard className="w-5 h-5" />}
          linkHref="/kas"
          linkText="Cek Kas"
          variant="green"
        />

        <StatCard
          title="Saldo Kas Akademi"
          value={`Rp ${(finance.currentBalance / 1000).toLocaleString('id-ID')}k`}
          subtitle={`Rp ${finance.currentBalance.toLocaleString('id-ID')}`}
          icon={<TrendingUp className="w-5 h-5" />}
          linkHref="/keuangan"
          linkText="Laporan"
          variant="red"
        />
      </div>

      {/* Main Content Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Next Training Session with 4-Hour Reminder Highlight */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Latihan Terdekat & 4-Jam Auto Reminder */}
          <Card highlight={true}>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-smart-maroon/20 text-smart-gold-light border border-smart-maroon/40">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Sesi Latihan Terdekat &amp; Reminder</CardTitle>
                  <CardDescription>
                    Sistem otomatis mengirim WhatsApp ke atlet &amp; wali 4 jam sebelum latihan
                  </CardDescription>
                </div>
              </div>
              <Link
                href="/jadwal"
                className="text-xs font-bold text-smart-gold-light hover:text-smart-gold flex items-center gap-1 transition"
              >
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>

            <CardContent>
              {nextTraining ? (
                <div className="p-5 rounded-2xl bg-smart-dark/80 border border-smart-border space-y-4 shadow-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <Badge variant="gold" size="sm" className="mb-1.5">
                        {nextTraining.category}
                      </Badge>
                      <h3 className="text-lg font-black text-white leading-tight">
                        {nextTraining.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {nextTraining.reminderSent ? (
                        <Badge variant="green" size="md" dot={true}>
                          Reminder Terkirim
                        </Badge>
                      ) : (
                        <Badge variant="red" size="md" dot={true} pulse={true}>
                          Standby 4 Jam
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-smart-card border border-smart-border">
                      <span className="text-slate-400 block mb-0.5">Tanggal &amp; Waktu:</span>
                      <strong className="text-white font-semibold">
                        {nextTraining.date} &bull; {nextTraining.startTime} - {nextTraining.endTime} WIB
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-smart-card border border-smart-border">
                      <span className="text-slate-400 block mb-0.5">Lokasi GOR:</span>
                      <strong className="text-white font-semibold">{nextTraining.location}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-smart-card border border-smart-border">
                      <span className="text-slate-400 block mb-0.5">Pelatih &amp; Coach:</span>
                      <strong className="text-white font-semibold">
                        Coach {nextTraining.coachName}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-smart-card/60 border border-smart-border text-xs text-slate-300">
                    <span className="text-smart-gold-light font-bold">Fokus Materi:</span>{' '}
                    {nextTraining.focusMaterial}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-slate-400">
                      Target Atlet:{' '}
                      <strong className="text-white">
                        {nextTraining.category === 'Semua Kategori'
                          ? `${members.length} Atlet`
                          : `${members.filter((m) => m.category === nextTraining.category).length} Atlet ${nextTraining.category}`}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/absensi?scheduleId=${nextTraining.id}`}>
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={<ClipboardCheck className="w-3.5 h-3.5" />}
                        >
                          Absensi Sesi Ini
                        </Button>
                      </Link>

                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => setSelectedScheduleForReminder(nextTraining)}
                        icon={<Send className="w-3.5 h-3.5" />}
                      >
                        Kirim Reminder WA Sekarang
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-sm">
                  Belum ada jadwal latihan terdaftar.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Berita & Agenda Kejuaraan */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-smart-red/20 text-red-300 border border-smart-red/40">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Berita &amp; Agenda Akademi Voly Smart 09</CardTitle>
                  <CardDescription>Informasi turnamen voli, kejurda &amp; pengumuman</CardDescription>
                </div>
              </div>
              <Link
                href="/berita"
                className="text-xs font-bold text-smart-gold-light hover:text-smart-gold flex items-center gap-1 transition"
              >
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {news.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-smart-dark/60 border border-smart-border hover:border-smart-border-light transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Badge
                        variant={
                          item.category === 'AGENDA'
                            ? 'blue'
                            : item.category === 'PRESTASI'
                            ? 'gold'
                            : 'maroon'
                        }
                        size="sm"
                      >
                        {item.category}
                      </Badge>
                      <span className="text-[11px] text-slate-400">{item.date}</span>
                    </div>
                    <h4 className="font-bold text-sm text-white mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {item.summary || item.content}
                    </p>
                    {item.location && (
                      <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                        <span>📍 Lokasi:</span>{' '}
                        <strong className="text-smart-gold-light">{item.location}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Ringkasan Kas Bulanan & Quick Menu */}
        <div className="space-y-6">
          {/* Kas Bulanan Quick Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-smart-gold-light" />
                <span>Kas Bulan {currentMonth}</span>
              </CardTitle>
              <Link
                href="/kas"
                className="text-xs font-bold text-smart-gold-light hover:text-smart-gold"
              >
                Kelola &rarr;
              </Link>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Anggota Terdaftar:</span>
                <strong className="text-white">{members.length} Atlet</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Sudah Membayar:</span>
                <strong className="text-emerald-400 font-bold">{paidCount} Atlet</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Belum Membayar:</span>
                <strong className="text-smart-gold-light font-bold">
                  {currentMonthDues.length - paidCount} Atlet
                </strong>
              </div>

              <div className="pt-2">
                <div className="text-[11px] text-slate-400 mb-1 flex justify-between">
                  <span>Progres Terkumpul</span>
                  <span className="font-bold text-smart-gold-light">
                    Rp {(paidCount * 75000).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="w-full bg-smart-dark rounded-full h-2 overflow-hidden border border-smart-border">
                  <div
                    className="bg-gradient-to-r from-smart-red to-smart-gold-light h-full rounded-full transition-all duration-500"
                    style={{ width: `${duesPaidPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Unpaid members preview */}
              <div className="mt-4 pt-3 border-t border-smart-border">
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Daftar Atlet Belum Bayar Bulan Ini:
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {currentMonthDues
                    .filter((d) => !d.isPaid)
                    .map((d) => {
                      const member = members.find((m) => m.id === d.memberId);
                      if (!member) return null;
                      return (
                        <div
                          key={d.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-smart-dark/50 border border-smart-border/60 text-xs"
                        >
                          <span className="font-medium text-slate-200 truncate">{member.name}</span>
                          <Badge variant="red" size="sm">
                            Belum
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Access Menu Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Menu Pintas Akademi Voly Smart 09</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <Link
                  href="/anggota"
                  className="p-3.5 rounded-xl bg-smart-dark/80 hover:bg-smart-maroon/30 border border-smart-border hover:border-smart-gold/40 flex flex-col items-center justify-center text-center gap-2 transition group shadow-sm"
                >
                  <Users className="w-5 h-5 text-smart-gold-light group-hover:scale-110 transition" />
                  <span className="font-bold text-slate-200">Data Anggota</span>
                </Link>
                <Link
                  href="/absensi"
                  className="p-3.5 rounded-xl bg-smart-dark/80 hover:bg-smart-maroon/30 border border-smart-border hover:border-smart-gold/40 flex flex-col items-center justify-center text-center gap-2 transition group shadow-sm"
                >
                  <ClipboardCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                  <span className="font-bold text-slate-200">Catat Absensi</span>
                </Link>
                <Link
                  href="/keuangan"
                  className="p-3.5 rounded-xl bg-smart-dark/80 hover:bg-smart-maroon/30 border border-smart-border hover:border-smart-gold/40 flex flex-col items-center justify-center text-center gap-2 transition group shadow-sm"
                >
                  <TrendingUp className="w-5 h-5 text-smart-red group-hover:scale-110 transition" />
                  <span className="font-bold text-slate-200">Laporan Kas</span>
                </Link>
                <Link
                  href="/reminder"
                  className="p-3.5 rounded-xl bg-smart-dark/80 hover:bg-smart-maroon/30 border border-smart-border hover:border-smart-gold/40 flex flex-col items-center justify-center text-center gap-2 transition group shadow-sm"
                >
                  <Send className="w-5 h-5 text-smart-gold group-hover:scale-110 transition" />
                  <span className="font-bold text-slate-200">Smart WA 4 Jam</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={Boolean(selectedScheduleForReminder)}
        onClose={() => setSelectedScheduleForReminder(null)}
        schedule={selectedScheduleForReminder}
        members={members}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
}
