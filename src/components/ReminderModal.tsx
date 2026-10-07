'use client';

import React, { useState } from 'react';
import { TrainingSchedule, Member } from '@/lib/types';
import { Send, MessageCircle, Phone } from 'lucide-react';
import { generateDirectWhatsAppUrl } from '@/lib/whatsapp-utils';
import { Modal, Button, Badge } from '@/components/ui';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: TrainingSchedule | null;
  members: Member[];
  onSuccess?: () => void;
}

export default function ReminderModal({
  isOpen,
  onClose,
  schedule,
  members,
  onSuccess,
}: ReminderModalProps) {
  const [targetType, setTargetType] = useState<'ATLET' | 'WALI' | 'KEDUANYA'>('ATLET');
  const [isSending, setIsSending] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!isOpen || !schedule) return null;

  // Filter members who will receive the reminder
  const eligibleMembers = members.filter((m) => {
    if (m.status !== 'Aktif') return false;
    if (schedule.category === 'Semua Kategori') return true;
    return m.category === schedule.category;
  });

  const handleBroadcast = async () => {
    setIsSending(true);
    setResultMessage(null);
    try {
      const res = await fetch('/api/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BROADCAST_SCHEDULE',
          scheduleId: schedule.id,
          targetType,
          force: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResultMessage(`✅ Berhasil! Pengingat terkirim/disimulasikan ke ${data.count} kontak.`);
        if (onSuccess) onSuccess();
      } else {
        setResultMessage(`❌ Gagal: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setResultMessage(`❌ Gagal: ${errorMsg}`);
    } finally {
      setIsSending(false);
    }
  };

  const previewDate = new Date(`${schedule.date}T${schedule.startTime}`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const previewText = `🏐 *PENGINGAT LATIHAN BOLA VOLI* 🏐\n*AKADEMI SMART*\n\nHalo *[Nama Atlet]*,\nJangan lupa jadwal latihan bola voli hari ini:\n\n📅 *Hari/Tanggal:* ${previewDate}\n⏰ *Waktu:* ${schedule.startTime} - ${schedule.endTime} WIB *(Harap hadir 15 menit sebelumnya)*\n📍 *Lokasi:* ${schedule.location}\n👨‍🏫 *Pelatih:* Coach ${schedule.coachName}\n📋 *Materi:* ${schedule.focusMaterial}\n\nPastikan membawa jersey latihan, sepatu voli, dan botol minum. Semangat berlatih! 💪🔥\n_- Pengurus Akademi Smart_`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kirim WhatsApp Reminder Latihan"
      subtitle="Notifikasi 4 Jam Otomatis & Broadcast Langsung"
      icon={<MessageCircle className="w-4 h-4 text-smart-gold-light" />}
      maxWidth="xl"
    >
      <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
        {/* Target session info card */}
        <div className="p-3.5 rounded-xl bg-smart-dark/60 border border-smart-border text-xs space-y-1">
          <div className="font-bold text-white text-sm flex items-center justify-between">
            <span>{schedule.title}</span>
            <Badge variant="gold" size="sm">
              {schedule.category}
            </Badge>
          </div>
          <div className="text-slate-300">
            📅 {previewDate} &bull; ⏰ {schedule.startTime} - {schedule.endTime} WIB
          </div>
          <div className="text-slate-400">📍 {schedule.location} &bull; Coach {schedule.coachName}</div>
        </div>

        {/* Target Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Kirim Notifikasi Ke:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTargetType('ATLET')}
              className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition cursor-pointer ${
                targetType === 'ATLET'
                  ? 'bg-smart-maroon/40 border-smart-gold text-white font-bold shadow-sm'
                  : 'bg-smart-card border-smart-border text-slate-300 hover:bg-smart-card-hover'
              }`}
            >
              Nomor Atlet ({eligibleMembers.filter((m) => m.phone).length})
            </button>
            <button
              type="button"
              onClick={() => setTargetType('WALI')}
              className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition cursor-pointer ${
                targetType === 'WALI'
                  ? 'bg-smart-maroon/40 border-smart-gold text-white font-bold shadow-sm'
                  : 'bg-smart-card border-smart-border text-slate-300 hover:bg-smart-card-hover'
              }`}
            >
              Nomor Wali ({eligibleMembers.filter((m) => m.parentPhone).length})
            </button>
            <button
              type="button"
              onClick={() => setTargetType('KEDUANYA')}
              className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition cursor-pointer ${
                targetType === 'KEDUANYA'
                  ? 'bg-smart-maroon/40 border-smart-gold text-white font-bold shadow-sm'
                  : 'bg-smart-card border-smart-border text-slate-300 hover:bg-smart-card-hover'
              }`}
            >
              Keduanya (Semua)
            </button>
          </div>
        </div>

        {/* Message Preview */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Pratinjau Pesan WhatsApp:
          </label>
          <div className="bg-smart-dark p-3.5 rounded-xl border border-smart-border text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed shadow-inner">
            {previewText}
          </div>
        </div>

        {/* Quick Click-to-Chat for individual athletes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Kirim Per Atlet (Klik untuk Buka WhatsApp Web Langsung):
          </label>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {eligibleMembers.map((m) => {
              const athleteMsg = previewText.replace(/\[Nama Atlet\]/g, m.name);
              const directUrl = m.phone ? generateDirectWhatsAppUrl(m.phone, athleteMsg) : '#';
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-smart-dark/40 border border-smart-border/60 text-xs"
                >
                  <div>
                    <span className="font-semibold text-white">{m.name}</span>
                    <span className="text-slate-400 text-[11px] ml-2">({m.phone || 'No WA kosong'})</span>
                  </div>
                  {m.phone ? (
                    <a
                      href={directUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded-lg border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      <Phone className="w-3 h-3" /> Chat WA
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-500">Tidak ada nomor</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {resultMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-medium ${
              resultMessage.startsWith('✅')
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-300 border border-red-500/30'
            }`}
          >
            {resultMessage}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-smart-border bg-smart-dark/60 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Tutup
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleBroadcast}
          isLoading={isSending}
          disabled={eligibleMembers.length === 0}
          icon={<Send className="w-3.5 h-3.5" />}
        >
          Broadcast ke {eligibleMembers.length} Kontak
        </Button>
      </div>
    </Modal>
  );
}
