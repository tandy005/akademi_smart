'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  QrCode,
  ShieldCheck,
  AlertCircle,
  Home,
  RotateCcw,
  Users,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui';

interface ScannedMember {
  id: string;
  name: string;
  registrationNumber?: string;
  category?: string;
  position?: string;
  jerseyNumber?: number;
  gender?: string;
  status?: string;
}

function AbsenContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const nis = searchParams.get('nis');
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [isAlreadyRecorded, setIsAlreadyRecorded] = useState(false);
  const [member, setMember] = useState<ScannedMember | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeRecorded, setTimeRecorded] = useState<string>('');

  // Audio Beep Chime
  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // AudioContext policy
    }
  }, []);

  const handleRecordAttendance = useCallback(async (targetId: string, targetNis?: string | null, targetToken?: string | null) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: targetId,
          token: targetToken || undefined,
          notes: 'Presensi via Google Lens / Kamera HP (Terverifikasi HMAC)',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setIsAlreadyRecorded(data.isAlreadyRecorded || false);
        setMember(data.member);
        setTimeRecorded(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        playChime();
      } else {
        setSuccess(false);
        setErrorMessage(data.error || 'Data KTA tidak ditemukan dalam sistem.');
      }
    } catch {
      setSuccess(false);
      setErrorMessage('Terjadi kesalahan jaringan saat mencatat absensi.');
    } finally {
      setLoading(false);
    }
  }, [playChime]);

  useEffect(() => {
    if (id || nis) {
      handleRecordAttendance(id || nis || '', nis, token);
    } else {
      setLoading(false);
    }
  }, [id, nis, token, handleRecordAttendance]);

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Kasus 1: Dibuka tanpa parameter (hanya /absen)
  if (!id && !nis && !loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <QrCode className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">Presensi Cepat Google Lens</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Halaman ini digunakan untuk menerima pemindaian otomatis dari Google Lens atau Kamera HP pada kartu KTA atlet Akademi Voly Smart 09.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link href="/scan">
              <Button variant="gold" size="md" className="w-full font-bold" icon={<QrCode className="w-4 h-4" />}>
                Buka Scanner Kamera Web
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="w-full text-slate-400 hover:text-white" icon={<Home className="w-4 h-4" />}>
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Kasus 2: Sedang memproses kehadiran
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center animate-spin">
            <RotateCcw className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-white text-base">Memverifikasi KTA Atlet...</h3>
          <p className="text-xs text-slate-400">Menghubungkan ke sistem presensi Akademi Smart 09...</p>
        </div>
      </div>
    );
  }

  // Kasus 3: Terjadi Kesalahan (Misal KTA tidak terdaftar)
  if (!success && errorMessage) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-red-900/60 p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-black text-white">Presensi Tidak Berhasil</h2>
            <p className="text-xs text-rose-300">{errorMessage}</p>
          </div>
          <div className="pt-3 flex flex-col gap-2">
            <Link href="/scan">
              <Button variant="secondary" size="sm" className="w-full font-bold">
                Coba Scan via Scanner Lapangan
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="xs" className="w-full text-slate-400">
                Kembali ke Halaman Utama
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Kasus 4: SUKSES TERVERIFIKASI & TERCATAT HADIR
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
        {/* Header Hero Banner */}
        <div className={`p-6 text-center border-b transition-colors ${
          isAlreadyRecorded
            ? 'bg-gradient-to-b from-amber-950/80 via-amber-900/50 to-slate-900 border-amber-500/30'
            : 'bg-gradient-to-b from-emerald-950/90 via-emerald-900/50 to-slate-900 border-emerald-500/30'
        }`}>
          <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center shadow-lg ${
            isAlreadyRecorded
              ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 shadow-amber-900/40'
              : 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 shadow-emerald-900/40 animate-bounce'
          }`}>
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border mb-2 ${
            isAlreadyRecorded
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            <Sparkles className="w-3 h-3" />
            {isAlreadyRecorded ? 'SUDAH HADIR SEBELUMNYA' : 'PRESENSI BERHASIL DICATAT'}
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isAlreadyRecorded ? 'Kehadiran Sudah Masuk' : 'Selamat Berlatih!'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {isAlreadyRecorded
              ? 'Data kehadiran atlet ini sudah tercatat untuk sesi latihan hari ini.'
              : 'Kehadiran Anda otomatis tercatat ke dalam sistem database resmi.'}
          </p>
        </div>

        {/* Profil Atlet yang Diabsen */}
        {member && (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-950 to-red-800 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-black text-2xl flex-shrink-0 shadow-md">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-black text-base sm:text-lg text-white uppercase tracking-tight truncate">
                  {member.name}
                </h3>
                <div className="text-xs font-mono font-bold text-amber-300">
                  {member.registrationNumber || member.id}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {member.position || 'All-Round'} • {member.category || 'U-15'}
                  {member.jerseyNumber ? ` • Jersey #${member.jerseyNumber}` : ''}
                </div>
              </div>
            </div>

            {/* Waktu & Detail Presensi */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  Tanggal
                </div>
                <div className="font-bold text-slate-200 mt-1 truncate">
                  {todayStr}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  Waktu Masuk
                </div>
                <div className="font-bold text-emerald-400 mt-1 font-mono">
                  {timeRecorded || 'Tepat Waktu'} WIB
                </div>
              </div>
            </div>

            {/* Verification Seal */}
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-0.5">
              <div className="text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Terverifikasi Akademi Voly Smart 09
              </div>
              <p className="text-[10px] text-slate-400">
                Sistem Manajemen & Presensi Atlet Terintegrasi
              </p>
            </div>

            {/* Tombol Aksi */}
            <div className="pt-2 space-y-2.5">
              <Link href="/absensi/rekap?tab=daily" className="block">
                <Button
                  variant="gold"
                  size="md"
                  className="w-full font-black shadow-lg flex items-center justify-center gap-2"
                  icon={<Users className="w-4 h-4" />}
                >
                  Lihat Siapa Saja yang Sudah Absen Hari Ini
                </Button>
              </Link>
              <Link href="/scan" className="block">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full font-bold"
                  icon={<QrCode className="w-4 h-4" />}
                >
                  Buka Scanner Lapangan Berkelanjutan
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button
                  variant="ghost"
                  size="xs"
                  className="w-full text-slate-400 hover:text-white"
                  icon={<Home className="w-3.5 h-3.5" />}
                >
                  Kembali ke Dashboard Utama
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AbsenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <div className="text-white text-sm">Memuat halaman presensi...</div>
        </div>
      }
    >
      <AbsenContent />
    </Suspense>
  );
}
