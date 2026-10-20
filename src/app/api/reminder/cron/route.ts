import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    message: 'Direct WhatsApp click-to-chat mode active',
    timestamp: new Date().toISOString(),
  });
}

export async function POST() {
  return GET();
}
