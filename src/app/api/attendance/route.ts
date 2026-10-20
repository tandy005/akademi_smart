import { NextResponse } from 'next/server';
import { getDatabaseAsync, saveDatabaseAsync } from '@/lib/storage';
import { AttendanceRecord, AttendanceStatus } from '@/lib/types';
import { requireAuth } from '@/lib/auth-session';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scheduleId = searchParams.get('scheduleId');
  const date = searchParams.get('date');
  const memberId = searchParams.get('memberId');
  const db = await getDatabaseAsync();

  let list = db.attendances;
  if (scheduleId) {
    list = list.filter((a) => a.scheduleId === scheduleId);
  } else if (date) {
    list = list.filter((a) => a.scheduleId === date || a.date === date);
  }
  if (memberId) {
    list = list.filter((a) => a.memberId === memberId);
  }

  return NextResponse.json(list);
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.errorResponse?.error || 'Akses ditolak: Hanya Pengurus yang dapat mencatat absensi' },
        { status: auth.errorResponse?.status || 403 }
      );
    }

    const body: {
      scheduleId: string;
      replaceSession?: boolean;
      records: Array<{ memberId: string; status: AttendanceStatus; notes?: string; recordedAt?: string }>;
    } = await req.json();

    if (!body.scheduleId || !body.records) {
      return NextResponse.json({ error: 'scheduleId and records are required' }, { status: 400 });
    }

    const db = await getDatabaseAsync();
    const now = new Date().toISOString();

    if (body.replaceSession) {
      // Remove existing attendances for this scheduleId and replace with new
      db.attendances = db.attendances.filter((a) => a.scheduleId !== body.scheduleId);

      const newRecords: AttendanceRecord[] = body.records.map((r) => ({
        id: `att-${body.scheduleId}-${r.memberId}`,
        scheduleId: body.scheduleId,
        date: body.scheduleId,
        sessionTitle: 'Latihan Rutin',
        memberId: r.memberId,
        status: r.status,
        notes: r.notes || '',
        recordedAt: r.recordedAt || now,
      }));

      db.attendances.push(...newRecords);
      await saveDatabaseAsync(db);
      return NextResponse.json({ success: true, count: newRecords.length, records: newRecords });
    }

    // Default: Upsert individual member records without deleting others who scanned!
    const affectedRecords: AttendanceRecord[] = [];

    body.records.forEach((r) => {
      const existingIdx = db.attendances.findIndex(
        (a) => (a.scheduleId === body.scheduleId || a.date === body.scheduleId) && a.memberId === r.memberId
      );

      if (existingIdx >= 0) {
        db.attendances[existingIdx] = {
          ...db.attendances[existingIdx],
          status: r.status,
          notes: r.notes !== undefined ? r.notes : db.attendances[existingIdx].notes,
          recordedAt: r.recordedAt || db.attendances[existingIdx].recordedAt || now,
        };
        affectedRecords.push(db.attendances[existingIdx]);
      } else {
        const newRec: AttendanceRecord = {
          id: `att-${body.scheduleId}-${r.memberId}`,
          scheduleId: body.scheduleId,
          date: body.scheduleId,
          sessionTitle: 'Latihan Rutin',
          memberId: r.memberId,
          status: r.status,
          notes: r.notes || '',
          recordedAt: r.recordedAt || now,
        };
        db.attendances.push(newRec);
        affectedRecords.push(newRec);
      }
    });

    await saveDatabaseAsync(db);
    return NextResponse.json({ success: true, count: affectedRecords.length, records: affectedRecords });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
