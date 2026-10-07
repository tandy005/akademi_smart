import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/neon-db';
import { createSessionToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth-session';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(username, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Generate tamper-proof signed session token
    const token = createSessionToken({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      memberId: user.memberId || null,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        memberId: user.memberId || null,
      },
    });

    // Set signed secure HTTP-only cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
    });

    return response;
  } catch (err: unknown) {
    console.error('Login error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
