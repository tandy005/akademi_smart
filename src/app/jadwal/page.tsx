'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRole } from '@/context/RoleContext';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  UserCheck,
  Send,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
} from 'lucide-react';
import { TrainingSchedule, Member, AgeCategory } from '@/lib/types';
import ReminderModal from '@/components/ReminderModal';
import {
  PageHeader,
  Button,
  Badge,
  Modal,
  FormInput,
  FormSelect,
} from '@/components/ui';

export default function JadwalPage() {
  const { role } = useRole();
  const [schedules, setSchedules] = useState<TrainingSchedule[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScheduleForReminder, setSelectedScheduleForReminder] =
    useState<TrainingSchedule | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TrainingSchedule | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<TrainingSchedule>>({
    title: '',
    category: 'Semua Kategori',
    date: new Date().toISOString().split('T')[0],
    startTime: '16:00',
    endTime: '18:00',
    location: 'GOR Siliwangi Lapangan A',
    coachName: 'Bambang Supriyanto',
    focusMaterial: 'Passing Bawah & Jump Serve',
    description: '',
    reminderHoursBefore: 4,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schRes, memRes] = await Promise.all([
        fetch('/api/schedules'),
        fetch('/api/members'),
      ]);
      if (schRes.ok) setSchedules(await schRes.json());
      if (memRes.ok) setMembers(await memRes.json());
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingSchedule(null);
    setFormData({
      title: '',
      category: 'Semua Kategori',
      date: new Date().toISOString().split('T')[0],
      startTime: '16:00',
      endTime: '18:00',
      location: 'GOR Siliwangi Lapangan A',
      coachName: 'Bambang Supriyanto',
      focusMaterial: 'Passing Bawah & Jump Serve',
      description: '',
      reminderHoursBefore: 4,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (s: TrainingSchedule) => {
    setEditingSchedule(s);
    setFormData(s);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus jadwal "${title}"?`)) return;
    try {
      const res = await fetch(`/api/schedules?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Gagal menghapus jadwal');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.startTime || !formData.location) {
      setErrorMsg('Harap lengkapi semua kolom wajib');
      return;
    }

    setFormSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingSchedule) {
        const res = await fetch('/api/schedules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, id: editingSchedule.id }),
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchData();
        } else {
          const d = await res.json();
          setErrorMsg(d.error || 'Gagal mengubah jadwal');
        }
      } else {
        const res = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchData();
        } else {
          const d = await res.json();
          setErrorMsg(d.error || 'Gagal membuat jadwal');
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMsg(errorMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Reusable PageHeader */}
      <PageHeader
        badgeText="Jadwal & Sesi Latihan"
        badgeIcon={<CalendarDays className="w-3.5 h-3.5" />}
        title="Jadwal Latihan & Pengingat 4 Jam"
        subtitle="Sistem otomatis mengirim WhatsApp reminder ke atlet dan orang tua 4 jam sebelum latihan dimulai"
        actions={
          role !== 'MEMBER' && (
            <Button
              variant="primary"
              size="sm"
              onClick={openAddModal}
              icon={<Plus className="w-4 h-4" />}
            >
              Tambah Jadwal Latihan
            </Button>
          )
        }
      />

      {/* Auto Reminder Info Box with Smart Red/Maroon theme */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#7A0000]/40 via-[#260303] to-[#120101] border border-smart-red/40 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-smart-red/20 text-smart-gold-light border border-smart-red/40 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">
              Mekanisme Auto-Reminder WhatsApp Akademi Voly Smart 09
            </div>
            <div className="text-slate-300 leading-relaxed mt-0.5 max-w-2xl">
              Setiap sesi latihan yang dijadwalkan akan otomatis dimonitor. Ketika waktu latihan
              berjarak &le; 4 jam dari waktu saat ini, sistem akan otomatis mengirim notifikasi
              pengingat ke nomor WhatsApp atlet dan wali murid yang bersangkutan.
            </div>
          </div>
        </div>
        <Link href="/reminder">
          <Button variant="outline" size="sm">
            Konfigurasi Template WA &rarr;
          </Button>
        </Link>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        {schedules.map((schedule) => {
          const scheduleDateTime = new Date(`${schedule.date}T${schedule.startTime}`);
          const diffMs = scheduleDateTime.getTime() - now.getTime();
          const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
          const isPast = diffHours < -2;
          const isWithin4Hours = diffHours >= 0 && diffHours <= 4.2;

          return (
            <div
              key={schedule.id}
              className={`p-5 rounded-2xl border transition-all duration-200 shadow-md ${
                isWithin4Hours
                  ? 'bg-smart-card border-smart-red/70 ring-1 ring-smart-gold/40 shadow-smart-red/20'
                  : isPast
                  ? 'bg-smart-card/50 border-smart-border/70 opacity-75'
                  : 'bg-smart-card border-smart-border hover:border-smart-border-light'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Schedule Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="gold" size="sm">
                      {schedule.category}
                    </Badge>

                    {isWithin4Hours && (
                      <Badge variant="red" size="sm" dot={true} pulse={true}>
                        Sesi &le; 4 Jam ({diffHours} jam lagi)
                      </Badge>
                    )}

                    {schedule.reminderSent ? (
                      <Badge variant="green" size="sm" dot={true}>
                        Reminder WA Terkirim
                      </Badge>
                    ) : (
                      <Badge variant="slate" size="sm">
                        Belum Terkirim
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight">{schedule.title}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300 pt-1">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-smart-gold-light flex-shrink-0" />
                      <span>
                        {new Date(`${schedule.date}T00:00:00`).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        &bull; <strong>{schedule.startTime} - {schedule.endTime} WIB</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-smart-gold-light flex-shrink-0" />
                      <span className="truncate">{schedule.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-smart-gold-light flex-shrink-0" />
                      <span>Coach {schedule.coachName}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 pt-1">
                    <strong className="text-smart-gold-light">Materi:</strong>{' '}
                    {schedule.focusMaterial}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap lg:flex-col items-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-smart-border">
                  <div className="flex items-center gap-2">
                    <Link href={`/absensi?scheduleId=${schedule.id}`}>
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={<ClipboardCheck className="w-3.5 h-3.5" />}
                      >
                        Absensi
                      </Button>
                    </Link>

                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => setSelectedScheduleForReminder(schedule)}
                      icon={<Send className="w-3.5 h-3.5" />}
                    >
                      Kirim Reminder WA
                    </Button>
                  </div>

                  {role !== 'MEMBER' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(schedule)}
                        className="p-1.5 text-slate-400 hover:text-smart-gold-light hover:bg-smart-maroon/20 rounded-lg transition cursor-pointer"
                        title="Edit Jadwal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id, schedule.title)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {schedules.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-sm bg-smart-card rounded-2xl border border-smart-border">
            Belum ada jadwal latihan. Klik tombol &quot;Tambah Jadwal Latihan&quot; di atas untuk membuat.
          </div>
        )}
      </div>

      {/* Add / Edit Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? 'Edit Jadwal Latihan' : 'Buat Sesi Latihan Baru'}
        subtitle="Akademi Smart Volleyball Club"
        icon={<Plus className="w-4 h-4" />}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <FormInput
            label="Nama / Judul Sesi Latihan"
            required
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Contoh: Latihan Taktik & Receive Servis"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Kategori Peserta"
              required
              value={formData.category || 'Semua Kategori'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as AgeCategory | 'Semua Kategori',
                })
              }
            >
              <option value="Semua Kategori">Semua Kategori (Gabungan)</option>
              <option value="U-12">U-12 (Usia Dini)</option>
              <option value="U-15">U-15 (Pemula)</option>
              <option value="U-18">U-18 (Remaja / Taruna)</option>
              <option value="Senior">Senior</option>
            </FormSelect>

            <FormInput
              label="Tanggal Latihan"
              type="date"
              required
              value={formData.date || ''}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />

            <FormInput
              label="Jam Mulai"
              type="time"
              required
              value={formData.startTime || '16:00'}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />

            <FormInput
              label="Jam Selesai"
              type="time"
              required
              value={formData.endTime || '18:00'}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />

            <FormInput
              label="Lokasi / GOR Lapangan"
              required
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Contoh: GOR Siliwangi Lapangan A"
            />

            <FormInput
              label="Pelatih Penanggung Jawab"
              required
              value={formData.coachName || ''}
              onChange={(e) => setFormData({ ...formData, coachName: e.target.value })}
              placeholder="Contoh: Coach Bambang"
            />
          </div>

          <FormInput
            label="Fokus Materi Latihan"
            value={formData.focusMaterial || ''}
            onChange={(e) => setFormData({ ...formData, focusMaterial: e.target.value })}
            placeholder="Contoh: Passing bawah cepat, transisi pertahanan, jump serve"
          />

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Waktu Notifikasi Reminder (Jam Sebelum Mulai)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="24"
                value={formData.reminderHoursBefore || 4}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reminderHoursBefore: Number(e.target.value) || 4,
                  })
                }
                className="w-24 px-3 py-2 bg-smart-dark border border-smart-border rounded-xl text-white focus:outline-none focus:border-smart-gold font-mono"
              />
              <span className="text-slate-400">
                Jam sebelum sesi (Sesuai kebutuhan: <strong>4 jam</strong> disarankan)
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-smart-border flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={formSubmitting}>
              {editingSchedule ? 'Simpan Perubahan' : 'Simpan Jadwal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={Boolean(selectedScheduleForReminder)}
        onClose={() => setSelectedScheduleForReminder(null)}
        schedule={selectedScheduleForReminder}
        members={members}
        onSuccess={() => fetchData()}
      />
    </div>
  );
}
