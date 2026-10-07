import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/neon-db';

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

    // Prepare response with secure session cookie
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

    const sessionPayload = Buffer.from(
      JSON.stringify({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        memberId: user.memberId || null,
      })
    ).toString('base64');

    response.cookies.set({
      name: 'vla_session',
      value: sessionPayload,
      httpOnly: false, // accessible to client for smooth state hydration
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (err: unknown) {
    console.error('Login error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
