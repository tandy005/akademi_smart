import { NextResponse } from 'next/server';
import { checkAndSendAutoReminders } from '@/lib/whatsapp';

export async function GET() {
  try {
    const result = await checkAndSendAutoReminders();
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'OK',
      ...result,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
