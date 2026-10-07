'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import {
  ClipboardCheck,
  CheckCircle2,
  Save,
  X,
} from 'lucide-react';
import { TrainingSchedule, Member, AttendanceRecord, AttendanceStatus } from '@/lib/types';
import {
  PageHeader,
  Button,
  Badge,
} from '@/components/ui';

function AbsensiContent() {
  const { role, currentMember } = useRole();
  const searchParams = useSearchParams();
  const preselectedScheduleId = searchParams.get('scheduleId');

  const [schedules, setSchedules] = useState<TrainingSchedule[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [allAttendances, setAllAttendances] = useState<AttendanceRecord[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
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
        initialMap[m.id] = { status: 'HADIR', notes: '' };
      }
    });

    setStatusMap(initialMap);
  }, [selectedScheduleId, allAttendances, members]);

  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);

  const targetMembers = members.filter((m) => {
    if (m.status === 'Non-Aktif') return false;
    if (!selectedSchedule || selectedSchedule.category === 'Semua Kategori') return true;
    return m.category === selectedSchedule.category;
  });

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
        setSaveSuccessMsg('✅ Absensi sesi latihan berhasil disimpan!');
        const attRes = await fetch('/api/attendance');
        if (attRes.ok) setAllAttendances(await attRes.json());
      } else {
        alert('Gagal menyimpan absensi');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const counts = {
    HADIR: 0,
    IZIN: 0,
    SAKIT: 0,
    ALPA: 0,
  };
  targetMembers.forEach((m) => {
    const st = statusMap[m.id]?.status || 'HADIR';
    counts[st] = (counts[st] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Reusable PageHeader */}
      <PageHeader
        badgeText="Kehadiran & Absensi Atlet"
        badgeIcon={<ClipboardCheck className="w-3.5 h-3.5" />}
        title="Pencatatan Absensi Latihan"
        subtitle="Ceklis kehadiran atlet voli Akademi Smart, rekap izin/sakit, dan catatan evaluasi teknis lapangan"
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

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-400 p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Select Schedule Bar */}
      <div className="p-5 rounded-2xl bg-smart-card border border-smart-border space-y-4 shadow-md">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Pilih Sesi Jadwal Latihan:
          </label>
          <select
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            className="w-full px-4 py-2.5 bg-smart-dark border border-smart-border rounded-xl text-xs text-white focus:outline-none focus:border-smart-gold font-medium"
          >
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.date} ({s.startTime} - {s.endTime} WIB) &bull; {s.title} &bull; [{s.category}] -{' '}
                {s.location}
              </option>
            ))}
          </select>
        </div>

        {selectedSchedule && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-smart-border">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[11px] text-emerald-400 block font-medium">Hadir</span>
              <span className="text-lg font-black text-emerald-300">{counts.HADIR}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
              <span className="text-[11px] text-blue-400 block font-medium">Izin</span>
              <span className="text-lg font-black text-blue-300">{counts.IZIN}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-[11px] text-amber-400 block font-medium">Sakit</span>
              <span className="text-lg font-black text-amber-300">{counts.SAKIT}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-smart-red/20 border border-smart-red/30 text-center">
              <span className="text-[11px] text-red-300 block font-medium">Alpa</span>
              <span className="text-lg font-black text-red-300">{counts.ALPA}</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Buttons for Coach */}
      {role !== 'MEMBER' && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">
            Daftar Atlet ({targetMembers.length} Orang):
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Tandai Cepat:</span>
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
        </div>
      )}

      {/* Attendance Checklist Table */}
      <div className="rounded-2xl bg-smart-card border border-smart-border overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-smart-dark/80 text-slate-400 border-b border-smart-border font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">No &amp; Jersey</th>
                <th className="py-3.5 px-4">Nama Atlet</th>
                <th className="py-3.5 px-4">Posisi &amp; Usia</th>
                <th className="py-3.5 px-4">Status Kehadiran</th>
                <th className="py-3.5 px-4">Catatan Performa Lapangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-smart-border/60">
              {targetMembers.map((m, idx) => {
                const currentStatus = statusMap[m.id]?.status || 'HADIR';
                const currentNote = statusMap[m.id]?.notes || '';
                const isCurrentLoggedInMember = role === 'MEMBER' && currentMember?.id === m.id;

                return (
                  <tr
                    key={m.id}
                    className={`transition ${
                      isCurrentLoggedInMember
                        ? 'bg-smart-maroon/20 border-l-2 border-smart-gold'
                        : 'hover:bg-smart-maroon/10'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono">
                      <div className="w-7 h-7 rounded-lg bg-smart-maroon/20 border border-smart-gold/40 text-smart-gold-light font-bold flex items-center justify-center text-xs shadow-xs">
                        {m.jerseyNumber ? `#${m.jerseyNumber}` : `#${idx + 1}`}
                      </div>
                    </td>

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
                        {m.registrationNumber}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{m.position}</div>
                      <div className="text-[11px] text-slate-400">{m.category}</div>
                    </td>

                    {/* Status Pill Radios */}
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
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : st === 'IZIN'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : st === 'SAKIT'
                                    ? 'bg-smart-gold text-smart-dark font-black shadow-sm'
                                    : 'bg-smart-red text-white shadow-sm'
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

                    {/* Notes */}
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

          {targetMembers.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              Tidak ada atlet dalam kategori sesi ini.
            </div>
          )}
        </div>
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
