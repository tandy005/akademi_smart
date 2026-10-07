import { NextResponse } from 'next/server';
import { getDatabaseAsync, saveDatabaseAsync } from '@/lib/storage';
import { TrainingSchedule } from '@/lib/types';
import { requireAuth } from '@/lib/auth-session';

export async function GET() {
  const db = await getDatabaseAsync();
  // Sort schedules by date and startTime
  const sorted = [...db.schedules].sort((a, b) => {
    const dtA = `${a.date}T${a.startTime}`;
    const dtB = `${b.date}T${b.startTime}`;
    return dtA.localeCompare(dtB);
  });
  return NextResponse.json(sorted);
}

export async function POST(req: Request) {
  try {
    // RBAC: Hanya ADMIN dan COACH yang berhak membuat jadwal
    const auth = await requireAuth(['ADMIN', 'COACH']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.errorResponse?.error || 'Akses ditolak' },
        { status: auth.errorResponse?.status || 403 }
      );
    }

    const body: Partial<TrainingSchedule> = await req.json();

    // Validasi data input
    if (!body.title?.trim() || !body.date || !body.startTime || !body.endTime || !body.location?.trim()) {
      return NextResponse.json(
        { error: 'Judul, tanggal, jam mulai, jam selesai, dan lokasi wajib diisi' },
        { status: 400 }
      );
    }

    if (body.startTime >= body.endTime) {
      return NextResponse.json(
        { error: 'Jam selesai latihan harus lebih akhir dari jam mulai' },
        { status: 400 }
      );
    }

    const db = await getDatabaseAsync();

    const newSchedule: TrainingSchedule = {
      id: `sch-${Date.now()}`,
      title: body.title.trim(),
      category: body.category || 'Semua Kategori',
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      location: body.location.trim(),
      coachName: (body.coachName || auth.user?.name || 'Coach').trim(),
      focusMaterial: (body.focusMaterial || 'Latihan Taktik & Fisik').trim(),
      description: (body.description || '').trim(),
      reminderSent: false,
      reminderHoursBefore: Math.max(1, Math.min(24, Number(body.reminderHoursBefore) || 4)),
    };

    db.schedules.push(newSchedule);
    await saveDatabaseAsync(db);
    return NextResponse.json(newSchedule, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    // RBAC: Hanya ADMIN dan COACH yang berhak mengubah jadwal
    const auth = await requireAuth(['ADMIN', 'COACH']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.errorResponse?.error || 'Akses ditolak' },
        { status: auth.errorResponse?.status || 403 }
      );
    }

    const body: TrainingSchedule = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: 'ID jadwal wajib disertakan' }, { status: 400 });
    }

    if (body.startTime && body.endTime && body.startTime >= body.endTime) {
      return NextResponse.json(
        { error: 'Jam selesai latihan harus lebih akhir dari jam mulai' },
        { status: 400 }
      );
    }

    const db = await getDatabaseAsync();

    const idx = db.schedules.findIndex((s) => s.id === body.id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 });
    }

    db.schedules[idx] = {
      ...db.schedules[idx],
      ...body,
      title: body.title ? body.title.trim() : db.schedules[idx].title,
      location: body.location ? body.location.trim() : db.schedules[idx].location,
      coachName: body.coachName ? body.coachName.trim() : db.schedules[idx].coachName,
    };

    await saveDatabaseAsync(db);
    return NextResponse.json(db.schedules[idx]);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    // RBAC: Hanya ADMIN dan COACH yang berhak menghapus jadwal
    const auth = await requireAuth(['ADMIN', 'COACH']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.errorResponse?.error || 'Akses ditolak' },
        { status: auth.errorResponse?.status || 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const db = await getDatabaseAsync();
    db.schedules = db.schedules.filter((s) => s.id !== id);
    // Also remove related attendances
    db.attendances = db.attendances.filter((a) => a.scheduleId !== id);

    await saveDatabaseAsync(db);
    return NextResponse.json({ success: true, message: 'Jadwal berhasil dihapus' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
