import { NextResponse } from 'next/server';
import { getDatabaseAsync, saveDatabaseAsync } from '@/lib/storage';
import { NewsAgenda } from '@/lib/types';

export async function GET() {
  const db = await getDatabaseAsync();
  const sorted = [...db.news].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.date.localeCompare(a.date);
  });
  return NextResponse.json(sorted);
}

export async function POST(req: Request) {
  try {
    const body: Partial<NewsAgenda> = await req.json();
    const db = await getDatabaseAsync();

    const newItem: NewsAgenda = {
      id: `news-${Date.now()}`,
      title: body.title || 'Judul Berita/Agenda',
      category: body.category || 'PENGUMUMAN',
      date: body.date || new Date().toISOString().split('T')[0],
      author: body.author || 'Admin Akademi',
      content: body.content || '',
      summary: body.summary || (body.content ? body.content.slice(0, 100) + '...' : ''),
      location: body.location || '',
      isPinned: Boolean(body.isPinned),
    };

    db.news.unshift(newItem);
    await saveDatabaseAsync(db);
    return NextResponse.json(newItem, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body: NewsAgenda = await req.json();
    const db = await getDatabaseAsync();

    const idx = db.news.findIndex((n) => n.id === body.id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Berita tidak ditemukan' }, { status: 404 });
    }

    db.news[idx] = { ...db.news[idx], ...body };
    await saveDatabaseAsync(db);
    return NextResponse.json(db.news[idx]);
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
    db.news = db.news.filter((n) => n.id !== id);
    await saveDatabaseAsync(db);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
