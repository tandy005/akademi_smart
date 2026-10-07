import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById } from '@/lib/neon-db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('vla_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ user: null });
    }

    const decoded = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString('utf8')
    );

    if (!decoded || !decoded.id) {
      return NextResponse.json({ user: null });
    }

    // Refresh data from Neon DB
    const freshUser = await getUserById(decoded.id);

    return NextResponse.json({
      user: freshUser || decoded,
    });
  } catch (err) {
    console.error('Session check error:', err);
    return NextResponse.json({ user: null });
  }
}
