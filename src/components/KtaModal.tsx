'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Member, calculateMemberAge } from '@/lib/types';
import {
  X,
  Printer,
  Download,
  Send,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import QRCode from 'qrcode';
import { generateDirectWhatsAppUrl } from '@/lib/whatsapp-utils';
import { Button } from '@/components/ui';

interface KtaModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  academyName?: string;
}

export default function KtaModal({
  isOpen,
  onClose,
  member,
  academyName = 'Akademi Voly Smart 09',
}: KtaModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedNis, setCopiedNis] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  // Default ke domain server production agar hasil cetak & download KTA selalu valid di Google Lens
  const [origin, setOrigin] = useState<string>(
    process.env.NEXT_PUBLIC_APP_URL || 'https://akademi-smart.vercel.app'
  );
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      setOrigin(process.env.NEXT_PUBLIC_APP_URL);
    } else if (typeof window !== 'undefined' && window.location.origin.includes('vercel.app')) {
      setOrigin(window.location.origin);
    }
  }, []);

  const regNo = member?.registrationNumber || `SMART-2026-${member?.id?.replace('m-', '') || '001'}`;
  // Dual Function: Format URL web resmi server agar langsung dikenali oleh Google Lens & Kamera HP mana pun
  const qrPayload = member
    ? `${origin}/absen?id=${member.id}&nis=${encodeURIComponent(regNo)}`
    : '';

  useEffect(() => {
    if (isOpen && member && qrPayload) {
      QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [isOpen, member, qrPayload]);

  if (!isOpen || !member) return null;

  const age = member.age ?? calculateMemberAge(member);

  const handleCopyNis = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(regNo);
      setCopiedNis(true);
      setTimeout(() => setCopiedNis(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Unduh KTA sebagai gambar PNG resolusi tinggi menggunakan Canvas
  const handleDownloadPng = async () => {
    setIsGeneratingPng(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Rasio ID Card Resolusi Tinggi: 600 x 950 px
      canvas.width = 600;
      canvas.height = 950;

      // 1. Background Gradient Card
      const bgGradient = ctx.createLinearGradient(0, 0, 0, 950);
      bgGradient.addColorStop(0, '#5a0000');
      bgGradient.addColorStop(0.18, '#8F0000');
      bgGradient.addColorStop(0.45, '#1e0505');
      bgGradient.addColorStop(1, '#0f0202');
      ctx.fillStyle = bgGradient;
      ctx.beginPath();
      ctx.roundRect(0, 0, 600, 950, 32);
      ctx.fill();

      // Border Emas Elegan
      ctx.strokeStyle = '#D99016';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(8, 8, 584, 934, 26);
      ctx.stroke();

      // Aksesoris Garis Emas Halus Atas
      ctx.strokeStyle = 'rgba(255, 200, 61, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, 140);
      ctx.lineTo(570, 140);
      ctx.stroke();

      // 2. Header Brand
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFC83D';
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillText('OFFICIAL ATHLETE PASS • KTA DIGITAL', 300, 48);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 28px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText('AKADEMI VOLY SMART 09', 300, 85);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.letterSpacing = '0.5px';
      ctx.fillText('Sistem Pembinaan Atlet Bola Voli Berprestasi', 300, 115);

      // 3. Avatar Badge Lingkaran
      const avatarY = 225;
      ctx.save();
      ctx.beginPath();
      ctx.arc(300, avatarY, 60, 0, Math.PI * 2);
      ctx.fillStyle = '#3a0000';
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#FFC83D';
      ctx.stroke();

      // Inisial Nama Atlet
      ctx.fillStyle = '#FFC83D';
      ctx.font = 'bold 50px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(member.name.charAt(0).toUpperCase(), 300, avatarY);
      ctx.restore();

      // Jersey Number Badge jika ada
      if (member.jerseyNumber) {
        ctx.fillStyle = '#D99016';
        ctx.beginPath();
        ctx.arc(350, 265, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${member.jerseyNumber}`, 350, 265);
      }

      // 4. Nama Atlet & NIS
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 30px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(member.name.toUpperCase(), 300, 335);

      // Pill No Registrasi NIS
      ctx.fillStyle = 'rgba(217, 144, 22, 0.2)';
      ctx.strokeStyle = '#D99016';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(175, 355, 250, 36, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFC83D';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`NIS: ${regNo}`, 300, 379);

      // 5. Grid Info Spesifikasi (Posisi, Kategori, Gender, Umur)
      const infoBoxY = 415;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(40, infoBoxY, 520, 80, 16);
      ctx.fill();
      ctx.stroke();

      // Garis pemisah tengah
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(300, infoBoxY + 10);
      ctx.lineTo(300, infoBoxY + 70);
      ctx.stroke();

      // Kolom Kiri: Posisi & Kategori
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('POSISI SPESIALISASI', 60, infoBoxY + 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(member.position || 'All-Round', 60, infoBoxY + 58);

      // Kolom Kanan: Kategori & Status
      ctx.fillText('KELOMPOK UMUR / GENDER', 320, infoBoxY + 30);
      ctx.fillStyle = '#FFC83D';
      ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, sans-serif';
      const catText = `${member.category || 'U-15'} • ${member.gender || 'Putra'} ${age > 0 ? `(${age} Th)` : ''}`;
      ctx.fillText(catText, 320, infoBoxY + 58);

      // 6. QR Code Section
      const qrBoxY = 525;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(175, qrBoxY, 250, 275, 20);
      ctx.fill();

      // Gambar QR Code dari dataUrl
      if (qrDataUrl) {
        const qrImg = new window.Image();
        qrImg.src = qrDataUrl;
        await new Promise((resolve) => {
          qrImg.onload = resolve;
        });
        ctx.drawImage(qrImg, 195, qrBoxY + 15, 210, 210);
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('SCAN UNTUK ABSENSI', 300, qrBoxY + 248);

      // 7. Footer Card
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFC83D';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('✓ TERVERIFIKASI AKTIF • AKADEMI SMART 09', 300, 845);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Harap bawa dan tunjukkan kartu ini pada setiap sesi latihan', 300, 875);
      ctx.fillText('Sidoarjo, Jawa Timur • Indonesia', 300, 898);

      // Download triggered
      const link = document.createElement('a');
      link.download = `KTA_${member.name.replace(/\s+/g, '_')}_${regNo}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Gagal membuat gambar PNG KTA:', err);
      alert('Terjadi kesalahan saat mengunduh gambar KTA.');
    } finally {
      setIsGeneratingPng(false);
    }
  };

  // Pesan WhatsApp KTA Resmi
  const waReceiptText = `🏐 *KARTU TANDA ANGGOTA (KTA) DIGITAL RESMI* 🏐
*${academyName.toUpperCase()}*

Halo *${member.name}* / Wali Murid,
Berikut identitas KTA resmi atlet Akademi Voly Smart 09:

📋 *No. Registrasi (NIS):* ${regNo}
👤 *Nama Atlet:* ${member.name}
🏐 *Posisi:* ${member.position || 'All-Round'}
🏷️ *Kategori:* ${member.category || 'U-15'} (${member.gender || 'Putra'})
🎂 *Usia:* ${age > 0 ? `${age} Tahun` : '-'}
🔢 *No. Jersey:* ${member.jerseyNumber ? `#${member.jerseyNumber}` : '-'}
✅ *Status:* ${member.status}

📌 *Petunjuk Presensi Lapangan:*
Tunjukkan QR Code pada KTA Digital ini kepada pelatih saat tiba di GOR/lapangan untuk pencatatan absensi otomatis 1 detik.

🔗 *Tautan Presensi Mandiri / Google Lens:*
${origin}/absen?id=${member.id}&nis=${encodeURIComponent(regNo)}

_Akademi Bola Voli Smart 09 Sidoarjo_ ✨`;

  const waUrl = member.phone ? generateDirectWhatsAppUrl(member.phone, waReceiptText) : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      {/* Container Modal */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-black/90 animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:max-w-none print:w-auto">
        {/* Header Actions (Disembunyikan saat dicetak) */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70 print:hidden">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>KTA Digital Atlet</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="xs"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5" />}
              title="Cetak KTA"
            >
              Cetak
            </Button>
            <Button
              variant="secondary"
              size="xs"
              onClick={handleDownloadPng}
              isLoading={isGeneratingPng}
              icon={<Download className="w-3.5 h-3.5" />}
              title="Simpan Gambar KTA ke Galeri"
            >
              Unduh PNG
            </Button>
            {member.phone && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                title="Kirim Info KTA via WhatsApp"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kirim WA</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Kartu KTA Digital */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-950/50 print:p-0">
          {/* KARTU KTA (Bisa dicetak / di-print) */}
          <div
            ref={cardRef}
            className="printable-kta w-full max-w-[360px] rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-gradient-to-b from-[#6b0202] via-[#240404] to-[#0d0202] text-white relative select-none"
          >
            {/* Latar Belakang Ornamen Bola Voli Halus */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-red-600/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

            {/* Header Kartu */}
            <div className="pt-5 px-5 pb-3 text-center border-b border-amber-500/20 bg-gradient-to-r from-red-950/80 via-red-900/60 to-red-950/80 relative">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  OFFICIAL ATHLETE PASS
                </span>
              </div>
              <h3 className="font-black text-lg sm:text-xl tracking-tight text-white flex items-center justify-center gap-1.5">
                AKADEMI VOLY <span className="text-red-500">SMART 09</span>
              </h3>
              <p className="text-[10px] text-slate-300 font-medium tracking-wide">
                Pusat Pembinaan Atlet Bola Voli Muda Berprestasi
              </p>
            </div>

            {/* Profile Section */}
            <div className="p-5 flex flex-col items-center text-center space-y-3.5">
              {/* Avatar dengan Lingkaran Emas & Jersey No */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-900 to-black border-3 border-amber-400 shadow-xl flex items-center justify-center text-amber-300 font-black text-3xl">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                {member.jerseyNumber && (
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full border-2 border-slate-900 shadow-md">
                    #{member.jerseyNumber}
                  </div>
                )}
              </div>

              {/* Nama & NIS */}
              <div className="space-y-1">
                <h4 className="font-black text-xl text-white tracking-tight uppercase">
                  {member.name}
                </h4>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                    {regNo}
                    <button
                      onClick={handleCopyNis}
                      type="button"
                      className="text-amber-400 hover:text-white transition print:hidden"
                      title="Salin NIS"
                    >
                      {copiedNis ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </span>
                </div>
              </div>

              {/* Grid Spesifikasi Atlet */}
              <div className="w-full grid grid-cols-2 gap-2 text-left bg-white/5 border border-white/10 rounded-2xl p-3">
                {/* Posisi */}
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Posisi
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {member.position || 'All-Round'}
                  </div>
                </div>

                {/* Kategori */}
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Kategori Umur
                  </div>
                  <div className="text-xs font-bold text-amber-300">
                    {member.category || 'U-15'}
                  </div>
                </div>

                {/* Gender & Usia */}
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Gender & Usia
                  </div>
                  <div className="text-xs font-medium text-slate-200">
                    {member.gender || 'Putra'} {age > 0 ? `• ${age} Th` : ''}
                  </div>
                </div>

                {/* Status Keaktifan */}
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Status
                  </div>
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {member.status || 'Aktif'}
                  </div>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="w-full flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl shadow-inner">
                {qrDataUrl ? (
                  <div className="w-40 h-40 relative flex items-center justify-center">
                    <Image
                      src={qrDataUrl}
                      alt={`QR Code Presensi ${member.name}`}
                      width={160}
                      height={160}
                      className="rounded-lg object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
                    Membuat QR Code...
                  </div>
                )}
                <div className="mt-2 text-center">
                  <div className="text-[11px] font-black text-slate-800 tracking-wider uppercase">
                    Pindai Untuk Presensi
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Arahkan ke kamera pelatih di lapangan
                  </div>
                </div>
              </div>

              {/* Card Footer Security Note */}
              <div className="w-full pt-2 border-t border-white/10 text-center space-y-0.5">
                <div className="text-[10px] font-bold text-amber-400/90 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  KARTU RESMI TERVERIFIKASI
                </div>
                <div className="text-[9px] text-slate-400">
                  Akademi Bola Voli Smart 09 • Sidoarjo, Jawa Timur
                </div>
              </div>
            </div>
          </div>

          {/* Quick Help Tip */}
          <p className="mt-3 text-center text-xs text-slate-400 max-w-xs print:hidden">
            💡 Simpan gambar kartu ke galeri HP atau cetak sebagai kartu tanda pengenal untuk digantung di tas latihan.
          </p>
        </div>
      </div>
    </div>
  );
}
