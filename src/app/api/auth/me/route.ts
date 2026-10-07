import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-session';

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user });
  } catch (err) {
    console.error('Session check error:', err);
    return NextResponse.json({ user: null });
  }
}
