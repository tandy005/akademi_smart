import { NextResponse } from 'next/server';
import { getDatabaseAsync, saveDatabaseAsync } from '@/lib/storage';
import { AttendanceRecord, Member } from '@/lib/types';
import { getSessionUser } from '@/lib/auth-session';
import { verifyMemberKtaSignature } from '@/lib/security';

const DEFAULT_FIELD_PIN = process.env.FIELD_SCANNER_PIN || '0909';

// Helper: Menghitung tanggal kalender zona waktu Indonesia (WIB / Asia/Jakarta)
function getIndonesianDateString(d: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return d.toISOString().split('T')[0];
  }
}

// Helper to parse QR payload
function parseQrPayload(payload: string): { memberId?: string; nis?: string; token?: string } {
  const trimmed = payload.trim();
  
  // Format URL Web (untuk Google Lens / Kamera HP biasa)
  // Contoh: http://domain.com/absen?id=m-1&nis=SMART-2026-001&token=8f3b29c91a0d4e5f
  if (trimmed.includes('/absen?') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const memberId = url.searchParams.get('id') || undefined;
      const nis = url.searchParams.get('nis') || undefined;
      const token = url.searchParams.get('token') || undefined;
      if (memberId || nis) {
        return { memberId, nis, token };
      }
    } catch {
      // Jika URL parsing gagal, coba regex sederhana
      const idMatch = trimmed.match(/[?&]id=([^&#]+)/);
      const nisMatch = trimmed.match(/[?&]nis=([^&#]+)/);
      const tokenMatch = trimmed.match(/[?&]token=([^&#]+)/);
      if (idMatch || nisMatch) {
        return {
          memberId: idMatch ? decodeURIComponent(idMatch[1]) : undefined,
          nis: nisMatch ? decodeURIComponent(nisMatch[1]) : undefined,
          token: tokenMatch ? decodeURIComponent(tokenMatch[1]) : undefined,
        };
      }
    }
  }

  // Format standard: SMART_VOLLEY:ID:<memberId>:NIS:<nis>
  if (trimmed.startsWith('SMART_VOLLEY:')) {
    const parts = trimmed.split(':');
    let memberId: string | undefined;
    let nis: string | undefined;

    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'ID' && parts[i + 1]) {
        memberId = parts[i + 1];
      }
      if (parts[i] === 'NIS' && parts[i + 1]) {
        nis = parts[i + 1];
      }
    }
    return { memberId, nis };
  }

  // Jika payload langsung berupa ID atlet (e.g. m-1)
  if (trimmed.startsWith('m-')) {
    return { memberId: trimmed };
  }

  // Jika payload langsung berupa NIS (e.g. SMART-2026-001)
  if (trimmed.startsWith('SMART-')) {
    return { nis: trimmed };
  }

  return { memberId: trimmed };
}

// GET: Cek status kehadiran hari ini untuk Scanner Lapangan
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');
    const scheduleId = searchParams.get('scheduleId') || getIndonesianDateString();

    const session = await getSessionUser();
    const isAuthorized = session?.role === 'ADMIN' || pin === DEFAULT_FIELD_PIN;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Akses ditolak: PIN tidak valid' }, { status: 401 });
    }

    const db = await getDatabaseAsync();
    const todayRecords = db.attendances.filter((a) => a.scheduleId === scheduleId);
    
    // Gabungkan info atlet
    const recent = todayRecords.map((att) => {
      const member = db.members.find((m) => m.id === att.memberId);
      return {
        ...att,
        member: member || null,
      };
    });

    return NextResponse.json({
      scheduleId,
      totalMembers: db.members.length,
      totalPresent: todayRecords.filter((a) => a.status === 'HADIR').length,
      recentAttendees: recent,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// POST: Rekam scan kehadiran atlet (dari Mode Pelatih atau Mode Kiosk Meja atau Google Lens)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { payload, pin, scheduleId: customScheduleId, notes, token: directToken } = body;

    if (!payload) {
      return NextResponse.json({ error: 'Data QR Code tidak boleh kosong' }, { status: 400 });
    }

    const db = await getDatabaseAsync();
    const { memberId, nis, token: payloadToken } = parseQrPayload(payload);
    const token = directToken || payloadToken;

    // Cari member
    let member: Member | undefined;
    if (memberId) {
      member = db.members.find((m) => m.id === memberId);
    }
    if (!member && nis) {
      member = db.members.find((m) => m.registrationNumber === nis);
    }
    if (!member) {
      // Fallback cari berdasarkan nama jika QR berisi nama
      member = db.members.find((m) => m.name.toLowerCase() === payload.trim().toLowerCase());
    }

    if (!member) {
      return NextResponse.json(
        { error: 'Atlet dengan KTA ini tidak terdaftar di sistem Akademi.' },
        { status: 404 }
      );
    }

    // =========================================================================
    // LAYER KEAMANAN ANTI-MANIPULASI:
    // Jalur A: Di-scan langsung oleh Pelatih/Pengurus (Kamera PIN 0909 atau Sesi ADMIN) -> Sah!
    // Jalur B: Tautan Publik Web / Google Lens -> Wajib lolos verifikasi tanda tangan HMAC resmi!
    // =========================================================================
    const session = await getSessionUser();
    const isCoachOrAdmin = session?.role === 'ADMIN' || pin === DEFAULT_FIELD_PIN;

    if (!isCoachOrAdmin) {
      const isSignatureValid = verifyMemberKtaSignature(
        member.id,
        token || '',
        member.registrationNumber
      );

      if (!isSignatureValid) {
        return NextResponse.json(
          {
            error:
              'Akses Ditolak: Tanda tangan digital KTA tidak valid atau ID telah dimanipulasi/ditebak.',
          },
          { status: 403 }
        );
      }
    }

    const todayDate = getIndonesianDateString();
    const scheduleId = customScheduleId || todayDate;
    const nowIso = new Date().toISOString();

    // Cek apakah sudah pernah diabsen untuk sesi/tanggal ini
    const existingIndex = db.attendances.findIndex(
      (a) => a.scheduleId === scheduleId && a.memberId === member!.id
    );

    let isAlreadyRecorded = false;
    let record: AttendanceRecord;

    if (existingIndex >= 0) {
      const existing = db.attendances[existingIndex];
      if (existing.status === 'HADIR') {
        isAlreadyRecorded = true;
        record = existing;
      } else {
        // Update dari IZIN/SAKIT/ALPA menjadi HADIR jika di-scan di lapangan
        existing.status = 'HADIR';
        existing.recordedAt = nowIso;
        if (notes) existing.notes = notes;
        record = existing;
        await saveDatabaseAsync(db);
      }
    } else {
      // Tambah rekam baru
      record = {
        id: `att-${scheduleId}-${member.id}`,
        scheduleId,
        date: todayDate,
        memberId: member.id,
        status: 'HADIR',
        notes: notes || 'Presensi QR Lapangan',
        recordedAt: nowIso,
      };
      db.attendances.push(record);
      await saveDatabaseAsync(db);
    }

    // Hitung total hadir hari ini
    const totalToday = db.attendances.filter(
      (a) => a.scheduleId === scheduleId && a.status === 'HADIR'
    ).length;

    return NextResponse.json({
      success: true,
      isAlreadyRecorded,
      member: {
        id: member.id,
        name: member.name,
        registrationNumber: member.registrationNumber,
        category: member.category,
        position: member.position,
        jerseyNumber: member.jerseyNumber,
        gender: member.gender,
        status: member.status,
      },
      record,
      totalToday,
      totalMembers: db.members.length,
      message: isAlreadyRecorded
        ? `${member.name} sudah tercatat HADIR sebelumnya.`
        : `Berhasil! ${member.name} tercatat HADIR.`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
