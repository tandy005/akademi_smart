'use client';

import React, { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import {
  ClipboardCheck,
  CheckCircle2,
  Save,
  X,
  Search,
  Calendar,
  Clock,
  AlertCircle,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Member,
  AttendanceRecord,
  AttendanceStatus,
  calculateMemberAge,
} from '@/lib/types';
import { PageHeader, Button, Badge } from '@/components/ui';

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
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

function AbsensiContent() {
  const { role, currentMember } = useRole();
  const searchParams = useSearchParams();
  const preselectedDate = searchParams.get('date');

  const dateInputRef = useRef<HTMLInputElement>(null);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(preselectedDate || todayStr);
  const [sessionTitle, setSessionTitle] = useState<string>('Latihan Rutin');

  const [members, setMembers] = useState<Member[]>([]);
  const [allAttendances, setAllAttendances] = useState<AttendanceRecord[]>([]);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'Putra' | 'Putri'>('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const [statusMap, setStatusMap] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [memRes, attRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/attendance'),
      ]);

      if (memRes.ok) setMembers(await memRes.json());
      if (attRes.ok) setAllAttendances(await attRes.json());
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update status map whenever selectedDate or allAttendances changes
  useEffect(() => {
    if (!selectedDate) return;

    const existingForDate = allAttendances.filter(
      (a) => a.scheduleId === selectedDate || a.date === selectedDate
    );

    const initialMap: Record<string, { status: AttendanceStatus; notes: string }> = {};

    members.forEach((m) => {
      const found = existingForDate.find((a) => a.memberId === m.id);
      if (found) {
        initialMap[m.id] = { status: found.status, notes: found.notes || '' };
      } else {
        // Default to HADIR for initial draft
        initialMap[m.id] = { status: 'HADIR', notes: '' };
      }
    });

    setStatusMap(initialMap);
  }, [selectedDate, allAttendances, members]);

  // Check if current date already has saved records
  const existingSavedRecords = useMemo(() => {
    if (!selectedDate) return [];
    return allAttendances.filter(
      (a) => a.scheduleId === selectedDate || a.date === selectedDate
    );
  }, [allAttendances, selectedDate]);

  // List of recorded dates history (for quick jump)
  const recordedDates = useMemo(() => {
    const dates = new Set<string>();
    allAttendances.forEach((a) => {
      if (a.scheduleId && /^\d{4}-\d{2}-\d{2}$/.test(a.scheduleId)) {
        dates.add(a.scheduleId);
      } else if (a.date) {
        dates.add(a.date);
      }
    });
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [allAttendances]);

  // Target members filtered
  const targetMembers = useMemo(() => {
    return members.filter((m) => {
      if (m.status === 'Non-Aktif') return false;

      if (genderFilter !== 'ALL' && m.gender !== genderFilter) {
        return false;
      }

      if (searchMemberQuery.trim()) {
        const q = searchMemberQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          (m.registrationNumber && m.registrationNumber.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [members, genderFilter, searchMemberQuery]);

  const handleStatusChange = (memberId: string, status: AttendanceStatus) => {
    setStatusMap((prev) => ({
      ...prev,
      [memberId]: {
        ...(prev[memberId] || { notes: '' }),
        status,
      },
    }));
  };

  const handleNotesChange = (memberId: string, notes: string) => {
    setStatusMap((prev) => ({
      ...prev,
      [memberId]: {
        ...(prev[memberId] || { status: 'HADIR' }),
        notes,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated = { ...statusMap };
    targetMembers.forEach((m) => {
      updated[m.id] = {
        ...(updated[m.id] || { notes: '' }),
        status,
      };
    });
    setStatusMap(updated);
  };

  const handleSaveAttendance = async () => {
    if (!selectedDate) return;
    setSaving(true);
    setSaveSuccessMsg(null);

    const records = targetMembers.map((m) => ({
      memberId: m.id,
      status: statusMap[m.id]?.status || 'HADIR',
      notes: statusMap[m.id]?.notes || '',
    }));

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: selectedDate,
          records,
        }),
      });

      if (res.ok) {
        setSaveSuccessMsg(`✅ Absensi tanggal ${formatDisplayDate(selectedDate)} berhasil disimpan untuk ${records.length} atlet!`);
        const attRes = await fetch('/api/attendance');
        if (attRes.ok) setAllAttendances(await attRes.json());
      } else {
        alert('Gagal menyimpan absensi');
      }
    } catch {
      alert('Terjadi kesalahan jaringan saat menyimpan absensi');
    } finally {
      setSaving(false);
    }
  };

  // Step date forward or backward
  const handleStepDate = (days: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + days);
      setSelectedDate(d.toISOString().split('T')[0]);
    }
  };

  // Summary counts for this date
  const counts = useMemo(() => {
    const res = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
    targetMembers.forEach((m) => {
      const st = statusMap[m.id]?.status || 'HADIR';
      if (st in res) {
        res[st]++;
      }
    });
    return res;
  }, [targetMembers, statusMap]);

  return (
    <div className="space-y-6">
      {/* PageHeader */}
      <PageHeader
        badgeText="Kehadiran & Absensi Atlet"
        badgeIcon={<ClipboardCheck className="w-3.5 h-3.5" />}
        title="Pencatatan Absensi Latihan"
        subtitle="Ceklis kehadiran atlet bola voli, rekap izin/sakit, dan sinkronisasi statistik kehadiran ke dashboard anggota"
        actions={
          role !== 'MEMBER' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAttendance}
              isLoading={saving}
              disabled={targetMembers.length === 0}
              icon={<Save className="w-4 h-4" />}
            >
              Simpan Absensi
            </Button>
          )
        }
      />

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-400 p-1 hover:text-emerald-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Date Selector & Session Bar */}
      <div className="p-5 rounded-2xl bg-smart-card border border-smart-border space-y-4 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Date Picker with Day auto-calculation */}
          <div className="space-y-1.5 flex-1 max-w-lg">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-smart-gold-light" />
              <span>Pilih Tanggal Sesi Latihan:</span>
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

              {/* Enhanced Date Picker Container */}
              <div
                onClick={() => {
                  const el = dateInputRef.current;
                  if (el) {
                    if (typeof (el as any).showPicker === 'function') {
                      (el as any).showPicker();
                    } else {
                      el.focus();
                    }
                  }
                }}
                className="flex-1 relative flex items-center bg-smart-dark border border-smart-border hover:border-smart-gold rounded-xl px-3 py-2 cursor-pointer transition group"
              >
                <Calendar className="w-4 h-4 text-smart-gold mr-2.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer [color-scheme:dark]"
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
                className="px-3 py-2.5 bg-smart-dark border border-smart-border rounded-xl text-[11px] font-bold text-smart-gold-light hover:bg-smart-card-hover hover:border-smart-gold transition cursor-pointer whitespace-nowrap"
              >
                Hari Ini
              </button>
            </div>
            <div className="text-[11px] text-slate-400">
              Hari Terpilih: <strong className="text-smart-gold-light font-bold">{formatDisplayDate(selectedDate)}</strong>
            </div>
          </div>

          {/* Session Title Input & Status Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-smart-gold-light" />
                <span>Keterangan Sesi:</span>
              </label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="Contoh: Latihan Rutin Sore"
                className="px-3 py-2 bg-smart-dark border border-smart-border rounded-xl text-xs text-white focus:outline-none focus:border-smart-gold w-48"
              />
            </div>

            <div className="space-y-1 sm:self-end">
              <div className="text-[11px] text-slate-400">Status Absensi:</div>
              {existingSavedRecords.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tersimpan ({existingSavedRecords.length} Atlet)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Belum Disimpan (Draft)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Counter Rekapitulasi Kehadiran Hari Terpilih */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-smart-border/70">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center transition">
            <span className="text-[11px] text-emerald-400 block font-medium">Hadir</span>
            <span className="text-xl font-black text-emerald-300">{counts.HADIR}</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center transition">
            <span className="text-[11px] text-blue-400 block font-medium">Izin</span>
            <span className="text-xl font-black text-blue-300">{counts.IZIN}</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center transition">
            <span className="text-[11px] text-amber-400 block font-medium">Sakit</span>
            <span className="text-xl font-black text-amber-300">{counts.SAKIT}</span>
          </div>
          <div className="p-3 rounded-xl bg-smart-red/20 border border-smart-red/30 text-center transition">
            <span className="text-[11px] text-red-300 block font-medium">Alpa</span>
            <span className="text-xl font-black text-red-300">{counts.ALPA}</span>
          </div>
        </div>

        {/* History Quick Links if any */}
        {recordedDates.length > 0 && (
          <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">Riwayat Tanggal Tersimpan:</span>
            {recordedDates.slice(0, 5).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={`px-2.5 py-1 rounded-lg border font-mono transition cursor-pointer ${
                  selectedDate === d
                    ? 'bg-smart-gold text-smart-dark font-bold border-smart-gold'
                    : 'bg-smart-dark border-smart-border text-slate-300 hover:text-white'
                }`}
              >
                {d} ({getDayName(d)})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter and Quick Action Toolbar */}
      <div className="p-4 rounded-2xl bg-smart-card border border-smart-border space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box for members */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama atlet dalam absensi..."
              value={searchMemberQuery}
              onChange={(e) => setSearchMemberQuery(e.target.value)}
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
                    ? 'bg-smart-gold text-smart-dark font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {g === 'ALL' ? 'Semua Atlet' : `Tim ${g}`}
              </button>
            ))}
          </div>

          {/* Quick Mark Buttons for Coach / Admin */}
          {role !== 'MEMBER' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px] hidden sm:inline">Tandai Cepat:</span>
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleMarkAll('HADIR')}
              >
                Semua Hadir
              </Button>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => handleMarkAll('IZIN')}
              >
                Semua Izin
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-smart-border/60">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-smart-gold-light" />
            Menampilkan <strong className="text-white">{targetMembers.length}</strong> atlet
          </span>
          {searchMemberQuery && (
            <button
              onClick={() => setSearchMemberQuery('')}
              className="text-smart-gold-light hover:underline cursor-pointer"
            >
              Hapus Pencarian
            </button>
          )}
        </div>
      </div>

      {/* Attendance Checklist Table */}
      <div className="rounded-2xl bg-smart-card border border-smart-border overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-smart-dark/80 text-slate-400 border-b border-smart-border font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Atlet</th>
                <th className="py-3.5 px-4 w-40">Umur &amp; Gender</th>
                <th className="py-3.5 px-4 w-64">Status Kehadiran</th>
                <th className="py-3.5 px-4">Catatan Performa Lapangan / Alasan Izin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-smart-border/60">
              {targetMembers.map((m, idx) => {
                const currentStatus = statusMap[m.id]?.status || 'HADIR';
                const currentNote = statusMap[m.id]?.notes || '';
                const isCurrentLoggedInMember = role === 'MEMBER' && currentMember?.id === m.id;
                const age = m.age ?? calculateMemberAge(m);

                return (
                  <tr
                    key={m.id}
                    className={`transition ${
                      isCurrentLoggedInMember
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
                        {isCurrentLoggedInMember && (
                          <Badge variant="gold" size="sm">
                            Anda
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {m.registrationNumber} &bull; {m.category || 'Reguler'}
                      </div>
                    </td>

                    {/* Umur & Gender */}
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{age > 0 ? `${age} Tahun` : '-'}</div>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        m.gender === 'Putri' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {m.gender || 'Putra'}
                      </span>
                    </td>

                    {/* Status Kehadiran (Pill Buttons) */}
                    <td className="py-3.5 px-4">
                      {role !== 'MEMBER' ? (
                        <div className="flex items-center gap-1">
                          {(['HADIR', 'IZIN', 'SAKIT', 'ALPA'] as AttendanceStatus[]).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(m.id, st)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                currentStatus === st
                                  ? st === 'HADIR'
                                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                                    : st === 'IZIN'
                                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                                    : st === 'SAKIT'
                                    ? 'bg-smart-gold text-smart-dark font-black shadow-sm ring-1 ring-yellow-400'
                                    : 'bg-smart-red text-white shadow-sm ring-1 ring-red-400'
                                  : 'bg-smart-dark text-slate-400 hover:text-white hover:bg-smart-card-hover'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <Badge
                          variant={
                            currentStatus === 'HADIR'
                              ? 'green'
                              : currentStatus === 'IZIN'
                              ? 'blue'
                              : currentStatus === 'SAKIT'
                              ? 'gold'
                              : 'red'
                          }
                          size="md"
                        >
                          {currentStatus}
                        </Badge>
                      )}
                    </td>

                    {/* Catatan Performa */}
                    <td className="py-3.5 px-4">
                      {role !== 'MEMBER' ? (
                        <input
                          type="text"
                          value={currentNote}
                          onChange={(e) => handleNotesChange(m.id, e.target.value)}
                          placeholder="Keterangan izin / catatan pelatih"
                          className="w-full px-2.5 py-1.5 bg-smart-dark border border-smart-border rounded-lg text-slate-200 text-xs focus:outline-none focus:border-smart-gold"
                        />
                      ) : (
                        <span className="text-slate-400 text-xs">{currentNote || '-'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {targetMembers.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500 text-sm">
              Tidak ada atlet yang sesuai dengan filter pencarian.
            </div>
          )}

          {loading && (
            <div className="p-8 text-center text-slate-400 text-sm">
              Memuat data kehadiran atlet...
            </div>
          )}
        </div>

        {/* Footer Save Button when list is long */}
        {role !== 'MEMBER' && targetMembers.length > 5 && (
          <div className="p-4 bg-smart-dark/80 border-t border-smart-border flex justify-between items-center">
            <span className="text-xs text-slate-400">
              Total {targetMembers.length} atlet siap disimpan untuk tanggal {formatDisplayDate(selectedDate)}.
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAttendance}
              isLoading={saving}
              icon={<Save className="w-4 h-4" />}
            >
              Simpan Absensi
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AbsensiPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat data absensi...</div>}>
      <AbsensiContent />
    </Suspense>
  );
}
