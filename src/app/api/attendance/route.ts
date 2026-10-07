import { NextResponse } from 'next/server';
import { getDatabaseAsync, saveDatabaseAsync } from '@/lib/storage';
import { AttendanceRecord, AttendanceStatus } from '@/lib/types';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scheduleId = searchParams.get('scheduleId');
  const db = await getDatabaseAsync();

  if (scheduleId) {
    const list = db.attendances.filter((a) => a.scheduleId === scheduleId);
    return NextResponse.json(list);
  }

  return NextResponse.json(db.attendances);
}

export async function POST(req: Request) {
  try {
    const body: {
      scheduleId: string;
      records: Array<{ memberId: string; status: AttendanceStatus; notes?: string }>;
    } = await req.json();

    if (!body.scheduleId || !body.records) {
      return NextResponse.json({ error: 'scheduleId and records are required' }, { status: 400 });
    }

    const db = await getDatabaseAsync();

    // Remove existing attendances for this scheduleId and replace with new
    db.attendances = db.attendances.filter((a) => a.scheduleId !== body.scheduleId);

    const now = new Date().toISOString();
    const newRecords: AttendanceRecord[] = body.records.map((r, i) => ({
      id: `att-${Date.now()}-${i}`,
      scheduleId: body.scheduleId,
      memberId: r.memberId,
      status: r.status,
      notes: r.notes || '',
      recordedAt: now,
    }));

    db.attendances.push(...newRecords);
    await saveDatabaseAsync(db);

    return NextResponse.json({ success: true, count: newRecords.length, records: newRecords });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
