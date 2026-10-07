import { NextResponse } from 'next/server';
import { getDatabaseAsync, saveDatabaseAsync } from '@/lib/storage';
import { CashTransaction } from '@/lib/types';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month'); // e.g. "2026-10"
  const type = searchParams.get('type'); // "INCOME" | "EXPENSE"

  const db = await getDatabaseAsync();
  let list = [...db.transactions];

  if (month) {
    list = list.filter((t) => t.date.startsWith(month));
  }

  if (type) {
    list = list.filter((t) => t.type === type);
  }

  // Sort descending by date
  list.sort((a, b) => b.date.localeCompare(a.date));

  // Compute metrics across entire database
  const totalIncomeAll = db.transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenseAll = db.transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalIncomeAll - totalExpenseAll;

  // Filtered metrics
  const filteredIncome = list
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredExpense = list
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  return NextResponse.json({
    currentBalance,
    totalIncomeAll,
    totalExpenseAll,
    filteredIncome,
    filteredExpense,
    transactions: list,
  });
}

export async function POST(req: Request) {
  try {
    const body: Partial<CashTransaction> = await req.json();
    const db = await getDatabaseAsync();

    if (!body.type || !body.category || !body.amount || !body.description) {
      return NextResponse.json(
        { error: 'Tipe, kategori, nominal, dan deskripsi wajib diisi' },
        { status: 400 }
      );
    }

    const dateStr = body.date || new Date().toISOString().split('T')[0];
    const prefix = body.type === 'INCOME' ? 'KAS-IN' : 'KAS-OUT';
    const cleanDate = dateStr.replace(/-/g, '');
    const receipt = body.receiptNumber || `${prefix}-${cleanDate}-${Math.floor(100 + Math.random() * 900)}`;

    const newTx: CashTransaction = {
      id: `tx-${Date.now()}`,
      type: body.type,
      category: body.category,
      amount: Number(body.amount),
      description: body.description,
      date: dateStr,
      receiptNumber: receipt,
      recordedBy: body.recordedBy || 'Bendahara Kas',
    };

    db.transactions.push(newTx);
    await saveDatabaseAsync(db);

    return NextResponse.json(newTx, { status: 201 });
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
    db.transactions = db.transactions.filter((t) => t.id !== id);
    await saveDatabaseAsync(db);

    return NextResponse.json({ success: true, message: 'Transaksi berhasil dihapus' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
