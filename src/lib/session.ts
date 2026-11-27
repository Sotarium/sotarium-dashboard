import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export const OWNER_DISCORD_ID = '1079074717799030824';
export const SESSION_COOKIE_NAME = 'sotarium_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSigningKey(): Buffer {
  const raw =
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NOWPAYMENTS_IPN_SECRET;
  if (!raw) {
    throw new Error('Missing server signing secret environment variable');
  }
  return createHmac('sha256', raw).update('sotarium-session-v1').digest();
}

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, exp: Date.now() + SESSION_TTL_MS }),
    'utf8'
  ).toString('base64url');
  const sig = createHmac('sha256', getSigningKey())
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token?: string | null): { userId: string } | null {
  if (!token || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, providedSig] = parts;

  try {
    const expectedSig = createHmac('sha256', getSigningKey())
      .update(payload)
      .digest('base64url');

    const a = Buffer.from(providedSig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }

    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!parsed?.userId || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }

    return { userId: String(parsed.userId) };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(maxAgeSeconds = 30 * 24 * 60 * 60) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export interface AuthenticatedSession {
  userId: string;
  username: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member';
  fullRole: string;
  isOwner: boolean;
  isAdmin: boolean;
}

export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const verified = verifySessionToken(token);
    if (!verified) return null;

    const { userId } = verified;
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, username, avatar, role')
      .eq('id', userId)
      .maybeSingle();

    const isOwner = userId === OWNER_DISCORD_ID;
    const fullRole = dbUser?.role || (isOwner ? 'owner' : 'member');
    const role: 'owner' | 'admin' | 'member' = isOwner
      ? 'owner'
      : fullRole.split(/[\s:]/)[0] === 'admin'
      ? 'admin'
      : 'member';

    return {
      userId,
      username: dbUser?.username || 'Discord Member',
      avatar: dbUser?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
      role,
      fullRole,
      isOwner,
      isAdmin: isOwner || role === 'admin',
    };
  } catch {
    return null;
  }
}
