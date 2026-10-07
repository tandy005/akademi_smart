'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  Filter,
} from 'lucide-react';
import { TrainingSchedule, Member, AgeCategory, AttendanceRecord } from '@/lib/types';
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
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScheduleForReminder, setSelectedScheduleForReminder] =
    useState<TrainingSchedule | null>(null);

  // Tab & Filter State
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST' | 'ALL'>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');

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
      const [schRes, memRes, attRes] = await Promise.all([
        fetch('/api/schedules'),
        fetch('/api/members'),
        fetch('/api/attendance'),
      ]);
      if (schRes.ok) setSchedules(await schRes.json());
      if (memRes.ok) setMembers(await memRes.json());
      if (attRes.ok) setAttendances(await attRes.json());
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
    if (!confirm(`Hapus jadwal "${title}"? Sesi absensi terkait juga akan dibersihkan.`)) return;
    try {
      const res = await fetch(`/api/schedules?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'Gagal menghapus jadwal');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.date || !formData.startTime || !formData.endTime || !formData.location?.trim()) {
      setErrorMsg('Harap lengkapi semua kolom wajib (Judul, Tanggal, Jam, dan Lokasi)');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setErrorMsg('Jam selesai latihan harus lebih akhir dari jam mulai (contoh: 16:00 - 18:00)');
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
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const now = new Date();

  // Helper check status for each schedule
  const getScheduleMeta = (s: TrainingSchedule) => {
    const startDt = new Date(`${s.date}T${s.startTime}`);
    const endDt = new Date(`${s.date}T${s.endTime}`);
    const diffMs = startDt.getTime() - now.getTime();
    const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

    const isPast = now.getTime() > endDt.getTime();
    const isOngoing = now.getTime() >= startDt.getTime() && now.getTime() <= endDt.getTime();
    const isWithin4Hours = !isPast && !isOngoing && diffHours >= 0 && diffHours <= 4.2;

    const attendedCount = attendances.filter((a) => a.scheduleId === s.id).length;

    return {
      startDt,
      endDt,
      diffHours,
      isPast,
      isOngoing,
      isWithin4Hours,
      attendedCount,
    };
  };

  // Filtered schedules based on activeTab and search
  const filteredSchedules = useMemo(() => {
    return schedules
      .filter((s) => {
        const meta = getScheduleMeta(s);

        if (activeTab === 'UPCOMING') {
          if (meta.isPast) return false;
        } else if (activeTab === 'PAST') {
          if (!meta.isPast) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = s.title.toLowerCase().includes(q);
          const matchCoach = s.coachName.toLowerCase().includes(q);
          const matchLoc = s.location.toLowerCase().includes(q);
          const matchFocus = s.focusMaterial.toLowerCase().includes(q);
          return matchTitle || matchCoach || matchLoc || matchFocus;
        }

        return true;
      })
      .sort((a, b) => {
        if (activeTab === 'PAST') {
          // Newest past first
          return `${b.date}T${b.startTime}`.localeCompare(`${a.date}T${a.startTime}`);
        }
        // Upcoming closest first
        return `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`);
      });
  }, [schedules, activeTab, searchQuery, attendances]);

  const upcomingCount = schedules.filter((s) => !getScheduleMeta(s).isPast).length;
  const pastCount = schedules.filter((s) => getScheduleMeta(s).isPast).length;

  return (
    <div className="space-y-6">
      {/* PageHeader */}
      <PageHeader
        badgeText="Jadwal & Sesi Latihan"
        badgeIcon={<CalendarDays className="w-3.5 h-3.5" />}
        title="Jadwal Latihan & Pengingat Sesi"
        subtitle="Manajemen jadwal sesi latihan bola voli, pemantauan otomatis H-4 jam, dan pencatatan absensi"
        actions={
          role !== 'MEMBER' && (
            <Button
              variant="primary"
              size="sm"
              onClick={openAddModal}
              icon={<Plus className="w-4 h-4" />}
            >
              Tambah Jadwal Baru
            </Button>
          )
        }
      />

      {/* Auto Reminder Info Box */}
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
              berjarak &le; 4 jam dari waktu saat ini, sistem siap mengirim notifikasi pengingat ke nomor
              WhatsApp atlet secara terkoordinasi.
            </div>
          </div>
        </div>
        <Link href="/reminder">
          <Button variant="outline" size="sm">
            Template & Pengaturan WA &rarr;
          </Button>
        </Link>
      </div>

      {/* Tab Nav & Search Bar */}
      <div className="p-4 rounded-2xl bg-smart-card border border-smart-border space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-smart-dark p-1 rounded-xl border border-smart-border text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('UPCOMING')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                activeTab === 'UPCOMING'
                  ? 'bg-smart-gold text-smart-dark shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mendatang ({upcomingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PAST')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                activeTab === 'PAST'
                  ? 'bg-smart-gold text-smart-dark shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Selesai ({pastCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                activeTab === 'ALL'
                  ? 'bg-smart-gold text-smart-dark shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({schedules.length})
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 md:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari judul, pelatih, materi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-smart-dark border border-smart-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-smart-gold transition"
            />
          </div>
        </div>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        {filteredSchedules.map((schedule) => {
          const meta = getScheduleMeta(schedule);

          return (
            <div
              key={schedule.id}
              className={`p-5 rounded-2xl border transition-all duration-200 shadow-md ${
                meta.isOngoing
                  ? 'bg-smart-card border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-emerald-950/30'
                  : meta.isWithin4Hours
                  ? 'bg-smart-card border-smart-red/80 ring-1 ring-smart-gold/50 shadow-smart-red/20'
                  : meta.isPast
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

                    {meta.isOngoing && (
                      <Badge variant="green" size="sm" dot={true} pulse={true}>
                        Sedang Berlangsung Sekarang
                      </Badge>
                    )}

                    {meta.isWithin4Hours && (
                      <Badge variant="red" size="sm" dot={true} pulse={true}>
                        Sesi Segera (&le; 4 Jam) &bull; {meta.diffHours} jam lagi
                      </Badge>
                    )}

                    {meta.isPast && (
                      <Badge variant="slate" size="sm">
                        Selesai
                      </Badge>
                    )}

                    {meta.attendedCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Absensi: {meta.attendedCount} Atlet
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        Belum Diabsen
                      </span>
                    )}

                    {schedule.reminderSent ? (
                      <Badge variant="green" size="sm" dot={true}>
                        Reminder Terkirim
                      </Badge>
                    ) : null}
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

                  <div className="text-xs text-slate-400 pt-0.5">
                    <strong className="text-smart-gold-light">Materi Latihan:</strong>{' '}
                    {schedule.focusMaterial}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap lg:flex-col items-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-smart-border">
                  <div className="flex items-center gap-2">
                    <Link href={`/absensi?scheduleId=${schedule.id}`}>
                      <Button
                        variant={meta.attendedCount > 0 ? 'secondary' : 'primary'}
                        size="xs"
                        icon={<ClipboardCheck className="w-3.5 h-3.5" />}
                      >
                        {meta.attendedCount > 0 ? 'Edit Absensi' : 'Catat Absensi'}
                      </Button>
                    </Link>

                    {!meta.isPast && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setSelectedScheduleForReminder(schedule)}
                        icon={<Send className="w-3.5 h-3.5" />}
                      >
                        Reminder WA
                      </Button>
                    )}
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

        {filteredSchedules.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500 text-sm bg-smart-card rounded-2xl border border-smart-border">
            {activeTab === 'UPCOMING'
              ? 'Tidak ada jadwal latihan mendatang. Klik "Tambah Jadwal Baru" untuk membuat sesi berikutnya.'
              : activeTab === 'PAST'
              ? 'Belum ada riwayat sesi latihan yang selesai.'
              : 'Tidak ditemukan jadwal latihan yang sesuai filter.'}
          </div>
        )}

        {loading && (
          <div className="p-12 text-center text-slate-400 text-sm">
            Memuat daftar jadwal latihan...
          </div>
        )}
      </div>

      {/* Add / Edit Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? 'Edit Jadwal Latihan' : 'Buat Sesi Latihan Baru'}
        subtitle="Akademi Voly Smart 09"
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
                Jam sebelum sesi (Standar: <strong>4 jam</strong> sebelum latihan)
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
