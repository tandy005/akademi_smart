import { NextResponse } from 'next/server';
import { getDatabaseAsync, saveDatabaseAsync } from '@/lib/storage';
import { TrainingSchedule } from '@/lib/types';

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
    const body: Partial<TrainingSchedule> = await req.json();
    const db = await getDatabaseAsync();

    const newSchedule: TrainingSchedule = {
      id: `sch-${Date.now()}`,
      title: body.title || 'Latihan Rutin Bola Voli',
      category: body.category || 'Semua Kategori',
      date: body.date || new Date().toISOString().split('T')[0],
      startTime: body.startTime || '16:00',
      endTime: body.endTime || '18:00',
      location: body.location || 'GOR Lapangan Voli',
      coachName: body.coachName || 'Coach Voli',
      focusMaterial: body.focusMaterial || 'Latihan Taktik & Fisik',
      description: body.description || '',
      reminderSent: false,
      reminderHoursBefore: body.reminderHoursBefore || 4,
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
    const body: TrainingSchedule = await req.json();
    const db = await getDatabaseAsync();

    const idx = db.schedules.findIndex((s) => s.id === body.id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 });
    }

    db.schedules[idx] = { ...db.schedules[idx], ...body };
    await saveDatabaseAsync(db);
    return NextResponse.json(db.schedules[idx]);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
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
