'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRole } from '@/context/RoleContext';
import {
  MessageSquareText,
  Send,
  Calendar,
  Users,
  CheckCircle2,
  Copy,
  ExternalLink,
  Share2,
  Clock,
  Sparkles,
  Search,
  Settings,
  Phone,
  MessageCircle,
  MapPin,
  UserCheck,
  Check,
} from 'lucide-react';
import { Member, TrainingSchedule, WhatsAppConfig } from '@/lib/types';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from '@/components/ui';
import {
  generateDirectWhatsAppUrl,
  renderReminderMessage,
} from '@/lib/whatsapp-utils';

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

export default function ReminderPage() {
  const { role } = useRole();
  const [schedules, setSchedules] = useState<TrainingSchedule[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [academyName, setAcademyName] = useState('Akademi Voly Smart 09');
  const [messageTemplate, setMessageTemplate] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [copiedGroupMessage, setCopiedGroupMessage] = useState(false);
  const [copiedMemberId, setCopiedMemberId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'Putra' | 'Putri'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [schRes, memRes, remRes] = await Promise.all([
          fetch('/api/schedules'),
          fetch('/api/members'),
          fetch('/api/reminder'),
        ]);

        if (schRes.ok) {
          const schData: TrainingSchedule[] = await schRes.json();
          setSchedules(schData);
          if (schData.length > 0) {
            // Auto select schedule nearest to today/upcoming
            const todayStr = new Date().toISOString().split('T')[0];
            const upcoming = schData.find((s) => s.date >= todayStr) || schData[0];
            setSelectedScheduleId(upcoming.id);
          }
        }

        if (memRes.ok) {
          const memData: Member[] = await memRes.json();
          setMembers(memData.filter((m) => m.status === 'Aktif'));
        }

        if (remRes.ok) {
          const remData = await remRes.json();
          if (remData.config?.messageTemplate) {
            setMessageTemplate(remData.config.messageTemplate);
          }
          if (remData.academyName) {
            setAcademyName(remData.academyName);
          }
        }
      } catch (err) {
        console.error('Failed to load WhatsApp reminder data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Selected schedule object
  const activeSchedule = useMemo(() => {
    return schedules.find((s) => s.id === selectedScheduleId) || schedules[0];
  }, [schedules, selectedScheduleId]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
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

  // Generate Group Broadcast Message Text
  const groupBroadcastText = useMemo(() => {
    if (!activeSchedule) return '';
    const dateFormatted = formatDisplayDate(activeSchedule.date);

    return `🏐 *PENGUMUMAN JADWAL LATIHAN BOLA VOLI* 🏐
*${academyName}*

Halo seluruh atlet dan wali murid, berikut adalah informasi jadwal sesi latihan terdekat:

📅 *Hari/Tanggal:* ${dateFormatted}
⏰ *Waktu:* ${activeSchedule.startTime} - ${activeSchedule.endTime} WIB *(Hadir 15 menit sebelumnya)*
📍 *Lokasi:* ${activeSchedule.location}
👨‍🏫 *Pelatih Bertugas:* Coach ${activeSchedule.coachName}
🎯 *Fokus Materi:* ${activeSchedule.focusMaterial || 'Latihan Taktik & Fisik Reguler'}

📌 *Catatan Atlet:*
• Memakai seragam/jersey latihan resmi
• Membawa sepatu voli, deker/pelindung, dan botol minum pribadi
• Jangan lupa tunjukkan KTA / QR Code saat tiba di lapangan untuk presensi otomatis 1 detik

Mari hadir tepat waktu dan semangat berlatih bersama! 💪🔥

_- Pengurus ${academyName}_ ✨`;
  }, [activeSchedule, academyName]);

  // URL untuk membagikan pengumuman langsung ke Grup WhatsApp
  const waGroupShareUrl = useMemo(() => {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(groupBroadcastText)}`;
  }, [groupBroadcastText]);

  // Copy Group Broadcast to Clipboard
  const handleCopyGroupBroadcast = () => {
    navigator.clipboard.writeText(groupBroadcastText);
    setCopiedGroupMessage(true);
    setSuccessToast('📋 Format Pengumuman Grup WhatsApp berhasil disalin ke clipboard!');
    setTimeout(() => {
      setCopiedGroupMessage(false);
      setSuccessToast(null);
    }, 4000);
  };

  // Copy individual message
  const handleCopyMemberMessage = (m: Member) => {
    if (!activeSchedule) return;
    const text = renderReminderMessage(messageTemplate, m, activeSchedule, academyName);
    navigator.clipboard.writeText(text);
    setCopiedMemberId(m.id);
    setSuccessToast(`📋 Pesan personal untuk ${m.name} berhasil disalin!`);
    setTimeout(() => {
      setCopiedMemberId(null);
      setSuccessToast(null);
    }, 3500);
  };

  // Save updated template to database
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTemplate(true);
    try {
      const res = await fetch('/api/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_CONFIG',
          config: {
            messageTemplate,
          },
        }),
      });

      if (res.ok) {
        setSuccessToast('✅ Template pesan pengingat berhasil disimpan!');
        setTimeout(() => setSuccessToast(null), 3500);
      } else {
        alert('Gagal menyimpan template');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* PageHeader */}
      <PageHeader
        badgeText="Pengingat WhatsApp Langsung"
        badgeIcon={<MessageSquareText className="w-3.5 h-3.5" />}
        title="Pengingat Latihan WhatsApp"
        subtitle="Kirim pengumuman latihan ke grup WhatsApp dan kirim pesan pengingat personal ke atlet/wali murid dengan 1 klik (100% Gratis & langsung via WhatsApp Anda)."
        actions={
          <div className="flex items-center gap-2">
            <a
              href={waGroupShareUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="gold"
                size="sm"
                icon={<MessageCircle className="w-4 h-4" />}
              >
                Kirim ke Grup WA
              </Button>
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyGroupBroadcast}
              icon={<Copy className="w-4 h-4" />}
            >
              {copiedGroupMessage ? 'Tersalin!' : 'Salin Format'}
            </Button>
          </div>
        }
      />

      {/* Success Notification */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 p-1 hover:text-emerald-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Selector Sesi Latihan */}
      <div className="p-5 rounded-2xl bg-smart-card border border-smart-border shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-smart-gold-light" />
              <span>Pilih Sesi Latihan yang Ingin Diingatkan:</span>
            </label>
            <p className="text-[11px] text-slate-400">
              Format pengumuman grup dan pesan personal ke atlet akan otomatis menyesuaikan tanggal &amp; materi sesi ini.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="bg-smart-dark border border-smart-border hover:border-smart-gold rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-smart-gold cursor-pointer [color-scheme:dark]"
            >
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.day ? `${s.day}, ` : ''}{s.date} — {s.title} ({s.startTime} WIB)
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeSchedule && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-smart-border/70 text-xs">
            <div className="p-2.5 rounded-xl bg-smart-dark border border-smart-border">
              <span className="text-[10px] text-slate-400 block font-medium">Hari &amp; Tanggal</span>
              <span className="font-bold text-white truncate block">
                {formatDisplayDate(activeSchedule.date)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-smart-dark border border-smart-border">
              <span className="text-[10px] text-slate-400 block font-medium">Waktu Sesi</span>
              <span className="font-bold text-emerald-300 truncate block">
                {activeSchedule.startTime} - {activeSchedule.endTime} WIB
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-smart-dark border border-smart-border">
              <span className="text-[10px] text-slate-400 block font-medium">Lokasi</span>
              <span className="font-bold text-white truncate block">
                {activeSchedule.location}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-smart-dark border border-smart-border">
              <span className="text-[10px] text-slate-400 block font-medium">Pelatih &amp; Materi</span>
              <span className="font-bold text-smart-gold-light truncate block">
                Coach {activeSchedule.coachName}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================================================================= */}
        {/* KOLOM KIRI (7 Kolom): DAFTAR ATLET & KIRIM DIRECT WA 1-KLIK */}
        {/* ================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-smart-gold-light" />
                    <span>Daftar Atlet &amp; Pengingat Personal</span>
                  </CardTitle>
                  <CardDescription>
                    Klik tombol WhatsApp untuk langsung membuka chat dengan pesan yang sudah terisi otomatis
                  </CardDescription>
                </div>

                <Badge variant="green" size="sm">
                  {filteredMembers.length} Atlet Aktif
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari nama atau nomor NIS atlet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-smart-dark border border-smart-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-smart-gold"
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

              {/* Members List */}
              <div className="divide-y divide-smart-border/60 max-h-[560px] overflow-y-auto pr-1">
                {filteredMembers.map((m) => {
                  const personalMessage = activeSchedule
                    ? renderReminderMessage(messageTemplate, m, activeSchedule, academyName)
                    : '';

                  const waAtletUrl = m.phone
                    ? generateDirectWhatsAppUrl(m.phone, personalMessage)
                    : '#';

                  const waWaliUrl = m.parentPhone
                    ? generateDirectWhatsAppUrl(m.parentPhone, personalMessage)
                    : '#';

                  return (
                    <div
                      key={m.id}
                      className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-smart-dark/60 rounded-xl transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-950 to-slate-900 border border-amber-400/30 text-amber-300 font-bold flex items-center justify-center text-sm flex-shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 truncate">
                            <span className="truncate">{m.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              m.gender === 'Putri' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              {m.gender || 'Putra'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                            {m.registrationNumber || m.id} &bull; {m.category || 'U-15'}
                            {m.position ? ` • ${m.position}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Action WhatsApp Buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                        {m.phone ? (
                          <a
                            href={waAtletUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                            title="Buka WhatsApp ke Atlet"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Kirim WA</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic px-2 py-1">
                            No HP kosong
                          </span>
                        )}

                        {m.parentPhone && m.parentPhone !== m.phone && (
                          <a
                            href={waWaliUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1 transition"
                            title="Kirim ke Nomor Wali Murid"
                          >
                            <span>Wali</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopyMemberMessage(m)}
                          className="p-1.5 rounded-xl bg-smart-dark border border-smart-border text-slate-400 hover:text-white hover:border-smart-gold transition cursor-pointer"
                          title="Salin Teks Pesan Atlet Ini"
                        >
                          {copiedMemberId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredMembers.length === 0 && !loading && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Tidak ada atlet yang cocok dengan pencarian.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================================================================= */}
        {/* KOLOM KANAN (5 Kolom): FORMAT PESAN GRUP & TEMPLATE PESAN */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Format Pesan Siaran Grup WhatsApp */}
          <Card className="border-amber-500/30">
            <CardHeader className="bg-amber-950/20 border-b border-amber-500/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2 text-white">
                  <Share2 className="w-4 h-4 text-amber-400" />
                  <span>Format Pengumuman Grup WA</span>
                </CardTitle>
                <Button
                  variant="gold"
                  size="xs"
                  onClick={handleCopyGroupBroadcast}
                  icon={<Copy className="w-3 h-3" />}
                >
                  {copiedGroupMessage ? 'Tersalin!' : 'Salin Teks'}
                </Button>
              </div>
              <CardDescription>
                Siap disalin dan di-paste langsung ke grup WhatsApp atlet/wali murid
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-4">
              <div className="p-3.5 rounded-xl bg-smart-dark border border-smart-border font-mono text-[11px] text-emerald-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto selection:bg-amber-500 selection:text-black">
                {groupBroadcastText}
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={waGroupShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Kirim Langsung ke Grup WhatsApp</span>
                </a>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyGroupBroadcast}
                  className="w-full font-semibold"
                  icon={<Copy className="w-4 h-4" />}
                >
                  {copiedGroupMessage ? 'Format Berhasil Disalin!' : 'Salin Format Teks Pengumuman'}
                </Button>
              </div>

              <div className="p-3 rounded-xl bg-smart-dark/80 border border-smart-border text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-smart-gold-light" />
                  Cara Kirim ke Grup:
                </span>
                <p className="leading-relaxed">
                  Klik tombol hijau <strong>&quot;Kirim Langsung ke Grup WhatsApp&quot;</strong> di atas, WhatsApp akan otomatis terbuka dan memunculkan daftar chat/grup. Pilih nama <strong>Grup Akademi / Wali Murid</strong> Anda &rarr; seluruh isi teks pengumuman sudah otomatis tertempel di kolom pesan, tinggal tekan tombol <strong>Kirim (Send)</strong>!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Kustomisasi Template Pesan Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-smart-gold-light" />
                <span>Kustomisasi Template Pesan Personal</span>
              </CardTitle>
              <CardDescription>
                Ubah kata-kata pesan WhatsApp yang dikirimkan secara pribadi ke masing-masing atlet
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSaveTemplate} className="space-y-3 text-xs">
                <div>
                  <textarea
                    rows={7}
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    className="w-full p-3 bg-smart-dark border border-smart-border rounded-xl text-emerald-300 font-mono text-xs focus:outline-none focus:border-smart-gold leading-relaxed"
                  />
                </div>

                <div className="p-3 rounded-xl bg-smart-dark border border-smart-border text-[11px] text-slate-400 space-y-1">
                  <div className="font-semibold text-smart-gold-light">Variabel yang Tersedia:</div>
                  <div className="grid grid-cols-2 gap-1 font-mono text-slate-300 text-[10px]">
                    <span>{'{nama}'} = Nama Atlet</span>
                    <span>{'{kategori}'} = Kategori Usia</span>
                    <span>{'{posisi}'} = Posisi Pemain</span>
                    <span>{'{tanggal}'} = Hari &amp; Tanggal</span>
                    <span>{'{jam}'} = Jam Sesi Latihan</span>
                    <span>{'{lokasi}'} = Lokasi Lapangan</span>
                    <span>{'{pelatih}'} = Coach Bertugas</span>
                    <span>{'{materi}'} = Fokus Materi</span>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="submit"
                    isLoading={savingTemplate}
                    icon={<Check className="w-3.5 h-3.5" />}
                  >
                    Simpan Perubahan Template
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
