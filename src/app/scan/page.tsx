'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Camera,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Users,
  Mic,
  MicOff,
  Sparkles,
  Lock,
  Unlock,
  KeyRound,
  Calendar,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
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

interface ScanResultState {
  member: ScannedMember;
  isAlreadyRecorded: boolean;
  message: string;
  timestamp: string;
}

interface RecentAttendee {
  id: string;
  scheduleId: string;
  memberId: string;
  status: string;
  recordedAt: string;
  notes?: string;
  member?: ScannedMember | null;
}

export default function ScanPage() {
  // PIN & Auth State
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activePin, setActivePin] = useState('0909');

  // Scanner Mode: 'COACH' (Handheld, back camera) vs 'KIOSK' (Meja pintu masuk, front camera)
  const [mode, setMode] = useState<'COACH' | 'KIOSK'>('COACH');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceGreetingEnabled, setVoiceGreetingEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Scanner Engine State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResultState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Stats & Recent
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalPresent, setTotalPresent] = useState(0);
  const [recentAttendees, setRecentAttendees] = useState<RecentAttendee[]>([]);

  // Voice Note State
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceNoteText, setVoiceNoteText] = useState('');

  // Refs
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cooldownRef = useRef(false);

  // Efek Suara Beep / Chime (Web Audio API)
  const playChime = useCallback((type: 'success' | 'warn' = 'success') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        osc.frequency.setValueAtTime(280, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // AudioContext mungkin dibatasi browser sebelum ada interaksi
    }
  }, [soundEnabled]);

  // Ucapan Suara Sambutan Kiosk (Speech Synthesis)
  const speakGreeting = useCallback((name: string) => {
    if (!voiceGreetingEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const text = `Selamat datang ${name}, selamat berlatih!`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis failed:', err);
    }
  }, [voiceGreetingEnabled]);

  // Muat data presensi terkini hari ini
  const fetchTodayData = useCallback(async (pin: string) => {
    try {
      const res = await fetch(`/api/attendance/scan?pin=${pin}`);
      if (res.ok) {
        const data = await res.json();
        setTotalMembers(data.totalMembers || 0);
        setTotalPresent(data.totalPresent || 0);
        setRecentAttendees(data.recentAttendees || []);
      }
    } catch (err) {
      console.error('Failed to load today scan data', err);
    }
  }, []);

  // Cek apakah PIN sudah tersimpan di sessionStorage
  useEffect(() => {
    const savedPin = sessionStorage.getItem('vla_scanner_pin');
    if (savedPin) {
      setActivePin(savedPin);
      setIsUnlocked(true);
      fetchTodayData(savedPin);
    }
  }, [fetchTodayData]);

  // Verifikasi PIN
  const handleUnlockPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput.length < 4) {
      setPinError('Masukkan 4 digit PIN');
      return;
    }

    try {
      const res = await fetch(`/api/attendance/scan?pin=${pinInput}`);
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('vla_scanner_pin', pinInput);
        setActivePin(pinInput);
        setIsUnlocked(true);
        setPinError(null);
        setTotalMembers(data.totalMembers || 0);
        setTotalPresent(data.totalPresent || 0);
        setRecentAttendees(data.recentAttendees || []);
      } else {
        const err = await res.json();
        setPinError(err.error || 'PIN Presensi salah');
        setPinInput('');
      }
    } catch {
      setPinError('Gagal memverifikasi PIN. Periksa koneksi.');
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem('vla_scanner_pin');
    setIsUnlocked(false);
    setPinInput('');
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
    }
    setCameraActive(false);
  };

  // Toggle Fullscreen untuk mode Kiosk
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Kirim payload QR ke server
  const handleScanPayload = useCallback(async (decodedText: string) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: decodedText,
          pin: activePin,
          notes: mode === 'COACH' ? 'Presensi Pelatih (Handheld)' : 'Presensi Meja Kiosk (Mandiri)',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const resultPayload: ScanResultState = {
          member: data.member,
          isAlreadyRecorded: data.isAlreadyRecorded,
          message: data.message,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };

        setScanResult(resultPayload);
        setTotalPresent(data.totalToday);
        setTotalMembers(data.totalMembers);

        if (data.isAlreadyRecorded) {
          playChime('warn');
        } else {
          playChime('success');
          if (mode === 'KIOSK') {
            speakGreeting(data.member.name);
          }
        }

        // Segarkan riwayat
        fetchTodayData(activePin);
      } else {
        playChime('warn');
        setCameraError(data.error || 'Data KTA tidak dikenali');
        setTimeout(() => setCameraError(null), 3000);
      }
    } catch {
      setCameraError('Gagal mencatat absensi. Periksa jaringan.');
      setTimeout(() => setCameraError(null), 3000);
    } finally {
      setIsProcessing(false);
      // Cooldown 2.5 detik agar tidak men-scan berulang-ulang kartu yang sama
      setTimeout(() => {
        cooldownRef.current = false;
      }, 2500);
    }
  }, [activePin, mode, playChime, speakGreeting, fetchTodayData]);

  // Inisialisasi Kamera dengan Html5Qrcode
  useEffect(() => {
    if (!isUnlocked) return;

    let isMounted = true;
    const scannerId = 'qr-reader-viewport';

    const startCamera = async () => {
      try {
        setCameraError(null);
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch {
            // ignore
          }
        }

        const html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        const preferredFacing = mode === 'COACH' ? 'environment' : 'user';

        await html5QrCode.start(
          { facingMode: preferredFacing },
          {
            fps: 12,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdge * 0.72);
              return {
                width: Math.max(220, qrboxSize),
                height: Math.max(220, qrboxSize),
              };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isMounted) {
              handleScanPayload(decodedText);
            }
          },
          () => {
            // scan frame failure (normal saat tidak ada QR di depan kamera)
          }
        );

        if (isMounted) {
          setCameraActive(true);
        }
      } catch (err) {
        console.error('Camera start error:', err);
        if (isMounted) {
          setCameraError('Kamera tidak dapat diakses. Pastikan Anda mengizinkan izin kamera di browser.');
          setCameraActive(false);
        }
      }
    };

    // Delay kecil untuk memastikan DOM sudah siap
    const timer = setTimeout(() => {
      startCamera();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isUnlocked, mode, handleScanPayload]);

  // Fitur Voice-to-Text untuk Catatan Evaluasi di Mode Pelatih
  const handleToggleVoiceNote = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert('Browser Anda belum mendukung input suara Web Speech API.');
      return;
    }

    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListeningVoice(true);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceNoteText(transcript);
        setIsListeningVoice(false);
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error', err);
      setIsListeningVoice(false);
    }
  };

  // Simpan Catatan Evaluasi Suara ke Atlet Terakhir
  const handleSaveVoiceNote = async () => {
    if (!scanResult || !voiceNoteText.trim()) return;
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: todayDate,
          records: [
            {
              memberId: scanResult.member.id,
              status: 'HADIR',
              notes: voiceNoteText.trim(),
            },
          ],
        }),
      });
      alert(`Catatan evaluasi untuk ${scanResult.member.name} berhasil disimpan!`);
      setVoiceNoteText('');
      fetchTodayData(activePin);
    } catch {
      alert('Gagal menyimpan catatan evaluasi.');
    }
  };

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // =========================================================================
  // VIEW 1: TAMPILAN KUNCI PIN (Jika belum memasukkan PIN Lapangan)
  // =========================================================================
  if (!isUnlocked) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-950 to-red-800 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-red-900/40 text-amber-300">
              <KeyRound className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Scanner Presensi Lapangan
            </h2>
            <p className="text-xs text-slate-400">
              Masukkan 4 digit PIN Pelatih / Pengurus untuk mengaktifkan kamera scanner presensi.
            </p>
          </div>

          <form onSubmit={handleUnlockPin} className="space-y-4">
            <div className="flex justify-center gap-2">
              <input
                type="password"
                maxLength={4}
                autoFocus
                inputMode="numeric"
                pattern="[0-9]*"
                value={pinInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPinInput(val);
                  setPinError(null);
                  if (val.length === 4) {
                    setTimeout(() => {
                      fetch(`/api/attendance/scan?pin=${val}`).then(async (res) => {
                        if (res.ok) {
                          const data = await res.json();
                          sessionStorage.setItem('vla_scanner_pin', val);
                          setActivePin(val);
                          setIsUnlocked(true);
                          setTotalMembers(data.totalMembers || 0);
                          setTotalPresent(data.totalPresent || 0);
                          setRecentAttendees(data.recentAttendees || []);
                        } else {
                          setPinError('PIN Lapangan salah!');
                          setPinInput('');
                        }
                      });
                    }, 100);
                  }
                }}
                placeholder="• • • •"
                className="w-48 text-center py-3 px-4 bg-slate-950 border-2 border-amber-500/50 rounded-2xl text-2xl font-black tracking-widest text-amber-300 focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="gold"
                size="md"
                className="w-full font-bold shadow-md"
                type="submit"
                icon={<Unlock className="w-4 h-4" />}
              >
                Buka Kamera Scanner
              </Button>
            </div>

            <p className="text-[11px] text-slate-500">
              💡 PIN Default Lapangan: <strong className="text-amber-400">0909</strong>
            </p>
          </form>

          <div className="pt-4 border-t border-slate-800/80">
            <Link
              href="/absensi"
              className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Halaman Absensi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: SCANNER LAPANGAN AKTIF (MODE 2-IN-1: PELATIH & KIOSK MEJA)
  // =========================================================================
  return (
    <div className={`space-y-4 max-w-5xl mx-auto ${isFullscreen ? 'p-2' : ''}`}>
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/absensi"
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Kembali ke Absensi"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                Scanner Presensi <span className="text-amber-400">Smart 09</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Live Lapangan
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" />
              {todayFormatted}
            </p>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-2">
          {/* Toggle Mode: Pelatih vs Kiosk */}
          <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center">
            <button
              onClick={() => setMode('COACH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                mode === 'COACH'
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mode Pelatih</span>
            </button>
            <button
              onClick={() => setMode('KIOSK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                mode === 'KIOSK'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mode Meja Kiosk</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition ${
              soundEnabled
                ? 'bg-slate-800 text-amber-400 border-amber-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title={soundEnabled ? 'Suara Aktif' : 'Suara Senyap'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Layar Penuh"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Lock / Exit PIN Button */}
          <button
            onClick={handleLock}
            className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition"
            title="Kunci Scanner"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Kamera Viewport (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[380px] sm:min-h-[460px]">
            {/* Kamera Reader HTML5 Container */}
            <div id="qr-reader-viewport" className="w-full h-full overflow-hidden" />

            {/* Scanning Overlay Viewfinder Guide */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
                <div className="px-3.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[11px] font-bold text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {mode === 'COACH'
                    ? 'Mode Pelatih (Kamera Belakang)'
                    : 'Mode Meja Kiosk (Kamera Depan)'}
                </div>

                <div className="text-center bg-slate-950/80 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-slate-800">
                  <p className="text-xs font-bold text-white">
                    Arahkan QR Code KTA Atlet ke Tengah Bingkai
                  </p>
                  <p className="text-[10px] text-amber-300">
                    Otomatis membaca dalam 1 detik
                  </p>
                </div>
              </div>
            )}

            {/* Loading / Error Display */}
            {!cameraActive && !cameraError && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center animate-spin">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-white">Mengaktifkan Kamera Lapangan...</p>
                <p className="text-xs text-slate-400">Harap izinkan akses kamera di browser Anda.</p>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
                <p className="text-sm font-bold text-rose-400">{cameraError}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.location.reload()}
                  icon={<RotateCcw className="w-4 h-4" />}
                >
                  Coba Muat Ulang Kamera
                </Button>
              </div>
            )}
          </div>

          {/* Quick Counter Banner */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-xl">
                {totalPresent}
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold">Total Hadir Hari Ini</div>
                <div className="text-sm font-black text-white">
                  {totalPresent} <span className="text-slate-500 font-normal">/ {totalMembers} Atlet</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-base">
                {totalMembers > 0 ? Math.round((totalPresent / totalMembers) * 100) : 0}%
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold">Persentase Kehadiran</div>
                <div className="text-sm font-black text-white">
                  {totalMembers > 0 && totalPresent >= totalMembers ? 'Lengkap 100%' : 'Sedang Berlangsung'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hasil Scan Terkini & Live Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card Hasil Scan Terakhir */}
          {scanResult ? (
            <div className={`p-5 rounded-3xl border-2 transition-all shadow-2xl animate-in zoom-in-95 duration-150 ${
              scanResult.isAlreadyRecorded
                ? 'bg-amber-950/40 border-amber-500/60 text-white'
                : 'bg-emerald-950/40 border-emerald-500/60 text-white'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${
                  scanResult.isAlreadyRecorded
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {scanResult.isAlreadyRecorded ? 'Sudah Hadir' : 'Berhasil Dicatat'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {scanResult.timestamp} WIB
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-900 to-black border-2 border-amber-400 flex items-center justify-center text-amber-300 font-black text-2xl flex-shrink-0 shadow-lg">
                  {scanResult.member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-lg text-white uppercase tracking-tight">
                    {scanResult.member.name}
                  </h3>
                  <div className="text-xs text-amber-300 font-mono font-bold">
                    {scanResult.member.registrationNumber || scanResult.member.id}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {scanResult.member.position || 'All-Round'} • {scanResult.member.category || 'U-15'}
                    {scanResult.member.jerseyNumber ? ` • #${scanResult.member.jerseyNumber}` : ''}
                  </div>
                </div>
              </div>

              {/* Mode Pelatih: Voice-to-Text Catatan Evaluasi Langsung */}
              {mode === 'COACH' && (
                <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Evaluasi Cepat Pelatih:
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleVoiceNote}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        isListeningVoice
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isListeningVoice ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span>{isListeningVoice ? 'Mendengarkan...' : 'Bicara (Mic)'}</span>
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Contoh: Passing pertama rapi, servis tajam..."
                      value={voiceNoteText}
                      onChange={(e) => setVoiceNoteText(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    {voiceNoteText && (
                      <Button
                        variant="gold"
                        size="xs"
                        onClick={handleSaveVoiceNote}
                        className="flex-shrink-0"
                      >
                        Simpan
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-300">Menunggu Scan KTA</h4>
              <p className="text-xs text-slate-500">
                Posisikan QR Code atlet di depan kamera. Data dan nama atlet akan muncul di sini secara instan.
              </p>
            </div>
          )}

          {/* Feed Atlet Hadir Hari Ini */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                  Daftar Atlet Hadir Hari Ini
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-400">
                {recentAttendees.length} Atlet
              </span>
            </div>

            <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-800/60 p-2">
              {recentAttendees.length > 0 ? (
                recentAttendees.map((att) => {
                  const time = att.recordedAt
                    ? new Date(att.recordedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '-';

                  return (
                    <div
                      key={att.id}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-800/40 rounded-xl transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-amber-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {att.member?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">
                            {att.member?.name || 'Atlet'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {att.member?.category || 'U-15'} {att.member?.position ? `• ${att.member.position}` : ''}
                            {att.notes ? ` • ${att.notes}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {time} WIB
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Belum ada atlet yang di-scan hari ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
