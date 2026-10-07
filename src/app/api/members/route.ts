import { NextResponse } from 'next/server';
import { getDatabaseAsync, saveDatabaseAsync } from '@/lib/storage';
import { Member } from '@/lib/types';

export async function GET() {
  const db = await getDatabaseAsync();
  return NextResponse.json(db.members);
}

export async function POST(req: Request) {
  try {
    const body: Partial<Member> = await req.json();
    const db = await getDatabaseAsync();

    const currentYear = new Date().getFullYear();
    const count = db.members.length + 1;
    const regNum = body.registrationNumber || `SMART-${currentYear}-${String(count).padStart(3, '0')}`;

    const memberAge = body.age !== undefined && body.age !== null && String(body.age).trim() !== '' ? Number(body.age) : undefined;
    const calculatedBirthDate = memberAge ? `${currentYear - memberAge}-01-01` : (body.birthDate || '2010-01-01');
    const autoCategory = memberAge
      ? memberAge <= 12
        ? 'U-12'
        : memberAge <= 15
        ? 'U-15'
        : memberAge <= 18
        ? 'U-18'
        : 'Senior'
      : (body.category || 'U-18');

    const newMember: Member = {
      id: `m-${Date.now()}`,
      registrationNumber: regNum,
      name: body.name || 'Nama Anggota',
      age: memberAge,
      gender: body.gender || 'Putra',
      birthDate: calculatedBirthDate,
      phone: body.phone || '',
      parentPhone: body.parentPhone || '',
      position: body.position || 'All-Round',
      category: autoCategory,
      jerseyNumber: body.jerseyNumber,
      heightCm: body.heightCm ? Number(body.heightCm) : undefined,
      weightKg: body.weightKg ? Number(body.weightKg) : undefined,
      status: body.status || 'Aktif',
      joinDate: body.joinDate || new Date().toISOString().split('T')[0],
      address: body.address || '',
      notes: body.notes || '',
    };

    db.members.push(newMember);

    // Also auto-generate monthly dues for current year for this member
    for (let m = 1; m <= 12; m++) {
      db.dues.push({
        id: `due-${newMember.id}-${currentYear}-${m}`,
        memberId: newMember.id,
        month: m,
        year: currentYear,
        amount: db.monthlyDueAmount,
        isPaid: false,
      });
    }

    await saveDatabaseAsync(db);
    return NextResponse.json(newMember, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body: Member = await req.json();
    const db = await getDatabaseAsync();

    const idx = db.members.findIndex((m) => m.id === body.id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 });
    }

    const currentYear = new Date().getFullYear();
    const memberAge = body.age !== undefined && body.age !== null && String(body.age).trim() !== '' ? Number(body.age) : undefined;
    const updatedBirthDate = memberAge ? `${currentYear - memberAge}-01-01` : body.birthDate;
    const autoCategory = memberAge
      ? memberAge <= 12
        ? 'U-12'
        : memberAge <= 15
        ? 'U-15'
        : memberAge <= 18
        ? 'U-18'
        : 'Senior'
      : body.category;

    db.members[idx] = {
      ...db.members[idx],
      ...body,
      age: memberAge,
      ...(updatedBirthDate ? { birthDate: updatedBirthDate } : {}),
      ...(autoCategory ? { category: autoCategory } : {}),
      heightCm: body.heightCm ? Number(body.heightCm) : db.members[idx].heightCm,
      weightKg: body.weightKg ? Number(body.weightKg) : db.members[idx].weightKg,
    };

    await saveDatabaseAsync(db);
    return NextResponse.json(db.members[idx]);
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
    db.members = db.members.filter((m) => m.id !== id);
    // Also remove related dues and attendances
    db.dues = db.dues.filter((d) => d.memberId !== id);
    db.attendances = db.attendances.filter((a) => a.memberId !== id);

    await saveDatabaseAsync(db);
    return NextResponse.json({ success: true, message: 'Anggota berhasil dihapus' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
