import { NextResponse } from 'next/server';
import { getDatabaseAsync, saveDatabaseAsync } from '@/lib/storage';
import { MonthlyDue, CashTransaction } from '@/lib/types';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear();
  const memberId = searchParams.get('memberId');

  const db = await getDatabaseAsync();
  let dues = db.dues.filter((d) => d.year === year);

  if (memberId) {
    dues = dues.filter((d) => d.memberId === memberId);
  }

  return NextResponse.json({
    year,
    monthlyDueAmount: db.monthlyDueAmount,
    dues,
  });
}

export async function POST(req: Request) {
  try {
    const body: {
      dueId: string;
      isPaid: boolean;
      paymentMethod?: 'Tunai' | 'Transfer Bank' | 'QRIS';
      amount?: number;
      note?: string;
      recordedBy?: string;
    } = await req.json();

    const db = await getDatabaseAsync();
    const dueIdx = db.dues.findIndex((d) => d.id === body.dueId);

    if (dueIdx === -1) {
      return NextResponse.json({ error: 'Data iuran tidak ditemukan' }, { status: 404 });
    }

    const due = db.dues[dueIdx];
    const member = db.members.find((m) => m.id === due.memberId);
    const memberName = member ? member.name : 'Anggota';
    const regNum = member ? member.registrationNumber : 'GMV';

    if (body.isPaid) {
      const now = new Date();
      const receiptNo = `KWT-${due.year}${String(due.month).padStart(2, '0')}-${regNum.slice(-3)}-${Math.floor(100 + Math.random() * 900)}`;

      due.isPaid = true;
      due.paidAt = now.toISOString();
      due.paymentMethod = body.paymentMethod || 'Tunai';
      due.amount = body.amount || due.amount || db.monthlyDueAmount;
      due.receiptNumber = receiptNo;
      due.note = body.note || 'Lunas';

      // Auto-record in Cash Transactions
      const txId = `tx-due-${due.id}`;
      const existingTxIdx = db.transactions.findIndex((t) => t.relatedDueId === due.id);

      const newTx: CashTransaction = {
        id: txId,
        type: 'INCOME',
        category: 'Iuran Kas',
        amount: due.amount,
        description: `Iuran Kas Bulan ${due.month}/${due.year} - ${memberName} (${regNum})`,
        date: now.toISOString().split('T')[0],
        relatedDueId: due.id,
        receiptNumber: receiptNo,
        recordedBy: body.recordedBy || 'Bendahara Kas',
      };

      if (existingTxIdx >= 0) {
        db.transactions[existingTxIdx] = newTx;
      } else {
        db.transactions.push(newTx);
      }
    } else {
      // Mark unpaid
      due.isPaid = false;
      due.paidAt = undefined;
      due.paymentMethod = undefined;
      due.receiptNumber = undefined;
      due.note = undefined;

      // Remove related transaction
      db.transactions = db.transactions.filter((t) => t.relatedDueId !== due.id);
    }

    db.dues[dueIdx] = due;
    await saveDatabaseAsync(db);

    return NextResponse.json({ success: true, due });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
