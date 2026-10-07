'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
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
  MapPin,
  User,
  AlertCircle,
  Users,
} from 'lucide-react';
import {
  TrainingSchedule,
  Member,
  AttendanceRecord,
  AttendanceStatus,
  calculateMemberAge,
} from '@/lib/types';
import { PageHeader, Button, Badge } from '@/components/ui';

function AbsensiContent() {
  const { role, currentMember } = useRole();
  const searchParams = useSearchParams();
  const preselectedScheduleId = searchParams.get('scheduleId');

  const [schedules, setSchedules] = useState<TrainingSchedule[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [allAttendances, setAllAttendances] = useState<AttendanceRecord[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'ALL_ACTIVE' | 'CATEGORY'>('ALL_ACTIVE');
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const [statusMap, setStatusMap] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schRes, memRes, attRes] = await Promise.all([
        fetch('/api/schedules'),
        fetch('/api/members'),
        fetch('/api/attendance'),
      ]);

      let schList: TrainingSchedule[] = [];
      if (schRes.ok) {
        schList = await schRes.json();
        setSchedules(schList);
      }
      if (memRes.ok) setMembers(await memRes.json());
      if (attRes.ok) setAllAttendances(await attRes.json());

      if (preselectedScheduleId && schList.some((s) => s.id === preselectedScheduleId)) {
        setSelectedScheduleId(preselectedScheduleId);
      } else if (schList.length > 0) {
        setSelectedScheduleId(schList[0].id);
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update status map whenever selectedScheduleId or allAttendances changes
  useEffect(() => {
    if (!selectedScheduleId) return;

    const existingForSchedule = allAttendances.filter(
      (a) => a.scheduleId === selectedScheduleId
    );

    const initialMap: Record<string, { status: AttendanceStatus; notes: string }> = {};

    members.forEach((m) => {
      const found = existingForSchedule.find((a) => a.memberId === m.id);
      if (found) {
        initialMap[m.id] = { status: found.status, notes: found.notes || '' };
      } else {
        // Default to HADIR for initial draft
        initialMap[m.id] = { status: 'HADIR', notes: '' };
      }
    });

    setStatusMap(initialMap);
  }, [selectedScheduleId, allAttendances, members]);

  const selectedSchedule = useMemo(() => {
    return schedules.find((s) => s.id === selectedScheduleId);
  }, [schedules, selectedScheduleId]);

  // Check if current schedule already has saved records
  const existingSavedCount = useMemo(() => {
    if (!selectedScheduleId) return 0;
    return allAttendances.filter((a) => a.scheduleId === selectedScheduleId).length;
  }, [allAttendances, selectedScheduleId]);

  // Target members eligible to be attended
  const targetMembers = useMemo(() => {
    return members.filter((m) => {
      if (m.status === 'Non-Aktif') return false;

      // Filter by category if user explicitly chose CATEGORY filter and schedule has a specific category
      if (
        filterMode === 'CATEGORY' &&
        selectedSchedule &&
        selectedSchedule.category !== 'Semua Kategori' &&
        m.category &&
        m.category !== selectedSchedule.category
      ) {
        return false;
      }

      // Filter by search query
      if (searchMemberQuery.trim()) {
        const q = searchMemberQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          (m.registrationNumber && m.registrationNumber.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [members, filterMode, selectedSchedule, searchMemberQuery]);

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
    if (!selectedScheduleId) return;
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
          scheduleId: selectedScheduleId,
          records,
        }),
      });

      if (res.ok) {
        setSaveSuccessMsg(`✅ Absensi berhasil disimpan untuk ${records.length} atlet!`);
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

  // Summary counts
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
        subtitle="Ceklis kehadiran atlet bola voli, rekap izin/sakit, dan evaluasi performa latihan"
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

      {/* Select Schedule & Session Info */}
      <div className="p-5 rounded-2xl bg-smart-card border border-smart-border space-y-4 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-smart-gold-light" />
              <span>Pilih Sesi Jadwal Latihan:</span>
            </label>
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="w-full px-4 py-2.5 bg-smart-dark border border-smart-border rounded-xl text-xs text-white focus:outline-none focus:border-smart-gold font-medium"
            >
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.date} ({s.startTime} - {s.endTime} WIB) &bull; {s.title} &bull; [{s.category}] - {s.location}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule Status Badge */}
          <div className="flex md:flex-col items-start md:items-end justify-between gap-1 pt-1">
            <span className="text-[11px] text-slate-400">Status Sesi:</span>
            {existingSavedCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sudah Diabsen ({existingSavedCount} Atlet)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                Belum Diabsen (Draft)
              </span>
            )}
          </div>
        </div>

        {/* Schedule Detail Pill */}
        {selectedSchedule && (
          <div className="p-3 rounded-xl bg-smart-dark/60 border border-smart-border/70 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-smart-gold-light" />
              <span>
                {selectedSchedule.startTime} - {selectedSchedule.endTime} WIB
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-smart-red" />
              <span>{selectedSchedule.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Pelatih: Coach {selectedSchedule.coachName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="gold" size="sm">
                Kategori: {selectedSchedule.category}
              </Badge>
            </div>
          </div>
        )}

        {/* Counter Rekapitulasi Kehadiran */}
        {selectedSchedule && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
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

          {/* Toggle All Active vs Category Filter */}
          {selectedSchedule && selectedSchedule.category !== 'Semua Kategori' && (
            <div className="flex items-center gap-1 bg-smart-dark p-1 rounded-xl border border-smart-border text-xs">
              <button
                type="button"
                onClick={() => setFilterMode('ALL_ACTIVE')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer text-xs ${
                  filterMode === 'ALL_ACTIVE'
                    ? 'bg-smart-gold text-smart-dark font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua Atlet Aktif
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('CATEGORY')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer text-xs ${
                  filterMode === 'CATEGORY'
                    ? 'bg-smart-gold text-smart-dark font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sesuai Kategori ({selectedSchedule.category})
              </button>
            </div>
          )}

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
                <th className="py-3.5 px-4">Catatan Performa Lapangan</th>
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
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-smart-maroon/40 border border-smart-gold/40 text-smart-gold-light font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-inner">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-1.5">
                            <span>{m.name}</span>
                            {isCurrentLoggedInMember && (
                              <Badge variant="gold" size="sm">
                                Anda
                              </Badge>
                            )}
                          </div>
                          {m.registrationNumber && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              {m.registrationNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Umur & Gender */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="font-medium text-xs">
                          {age > 0 ? `${age} Thn` : '-'}
                        </span>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                            m.gender === 'Putri'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                          }`}
                        >
                          {m.gender || 'Putra'}
                        </span>
                      </div>
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
                          placeholder="Catatan pelatih (misal: passing stabil, servis tajam)"
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
              Total {targetMembers.length} atlet siap disimpan.
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
