import crypto from 'crypto';
import { cookies } from 'next/headers';
import { UserRole } from './types';
import { getUserById, DbUser } from './neon-db';

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  memberId?: string | null;
  iat?: number;
  exp?: number;
}

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'smart-volleyball-secret-key-salt-vla-2026-production';

const COOKIE_NAME = 'vla_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Create HMAC-SHA256 signature
function signPayload(payloadStr: string): string {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadStr)
    .digest('base64url');
}

// Generate cryptographically signed token: <base64urlPayload>.<hmacSignature>
export function createSessionToken(user: {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  memberId?: string | null;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    memberId: user.memberId || null,
    iat: now,
    exp: now + COOKIE_MAX_AGE,
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signPayload(payloadStr);
  return `${payloadStr}.${signature}`;
}

// Verify cryptographically signed token
export function verifySessionToken(token: string): SessionUser | null {
  try {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 2) {
      // Legacy unsigned base64 fallback check (safe transition)
      try {
        const rawDecoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
        if (rawDecoded && rawDecoded.id && rawDecoded.role) {
          return rawDecoded as SessionUser;
        }
      } catch {}
      return null;
    }

    const [payloadStr, signature] = parts;
    const expectedSignature = signPayload(payloadStr);

    // Timing-safe comparison to prevent timing attacks
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload: SessionUser = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString('utf8')
    );

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

// Helper to get authenticated user in Server Components / API Route handlers
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(COOKIE_NAME);
    if (!tokenCookie || !tokenCookie.value) {
      return null;
    }

    const session = verifySessionToken(tokenCookie.value);
    if (!session) return null;

    // Refresh fresh user data if available from database
    try {
      const dbUser = await getUserById(session.id);
      if (dbUser) {
        return {
          ...session,
          name: dbUser.name,
          role: dbUser.role,
          memberId: dbUser.memberId,
        };
      }
    } catch {}

    return session;
  } catch {
    return null;
  }
}

// Check authorization for API routes
export async function requireAuth(allowedRoles?: UserRole[]): Promise<{
  authorized: boolean;
  user: SessionUser | null;
  errorResponse?: { error: string; status: number };
}> {
  const user = await getSessionUser();

  if (!user) {
    return {
      authorized: false,
      user: null,
      errorResponse: { error: 'Akses ditolak: Silakan login terlebih dahulu', status: 401 },
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      user,
      errorResponse: {
        error: `Akses ditolak: Peran '${user.role}' tidak memiliki izin untuk tindakan ini`,
        status: 403,
      },
    };
  }

  return { authorized: true, user };
}

export { COOKIE_NAME, COOKIE_MAX_AGE };
