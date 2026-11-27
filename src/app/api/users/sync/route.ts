import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import {
  OWNER_DISCORD_ID,
  createSessionToken,
  getAuthenticatedSession,
  getSessionCookieOptions,
} from '@/lib/session';

function sanitizeHwid(raw?: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { accessToken, tokenType, supabaseAccessToken, hwid } = body;
    const cleanHwid = sanitizeHwid(hwid);

    let verifiedId: string | null = null;
    let verifiedUsername: string | null = null;
    let verifiedAvatar: string | null = null;
    let issueNewCookie = false;

    // 1. Authenticate using Discord OAuth Access Token verified server-side
    if (typeof accessToken === 'string' && accessToken.length > 10) {
      const scheme = tokenType === 'Bearer' ? 'Bearer' : 'Bearer';
      const discordRes = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `${scheme} ${accessToken}` },
        cache: 'no-store',
      });

      if (!discordRes.ok) {
        return NextResponse.json({ error: 'Invalid Discord OAuth token' }, { status: 401 });
      }

      const d = await discordRes.json();
      if (!d?.id || !/^\d{17,20}$/.test(String(d.id))) {
        return NextResponse.json({ error: 'Invalid Discord user ID' }, { status: 401 });
      }

      verifiedId = String(d.id);
      verifiedUsername = String(d.global_name || d.username || 'Discord Member').slice(0, 64);
      verifiedAvatar = d.avatar
        ? `https://cdn.discordapp.com/avatars/${verifiedId}/${d.avatar}.png`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';
      issueNewCookie = true;
    } else if (typeof supabaseAccessToken === 'string' && supabaseAccessToken.length > 10) {
      // 2. Or authenticate using verified Supabase JWT
      const { data: userRes, error: authErr } = await supabase.auth.getUser(supabaseAccessToken);
      if (authErr || !userRes?.user) {
        return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
      }
      const meta = userRes.user.user_metadata || {};
      const pid = String(meta.provider_id || userRes.user.id);
      verifiedId = pid;
      verifiedUsername = String(
        meta.custom_claims?.global_name || meta.full_name || meta.user_name || 'Discord User'
      ).slice(0, 64);
      const rawAvatar = String(meta.avatar_url || '');
      verifiedAvatar = rawAvatar.startsWith('https://cdn.discordapp.com/')
        ? rawAvatar
        : 'https://cdn.discordapp.com/embed/avatars/0.png';
      issueNewCookie = true;
    } else {
      // 3. Otherwise require an existing signed HttpOnly session cookie
      const session = await getAuthenticatedSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized: Missing session' }, { status: 401 });
      }
      verifiedId = session.userId;
      verifiedUsername = session.username;
      verifiedAvatar = session.avatar;
    }

    const isOwner = verifiedId === OWNER_DISCORD_ID;

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', verifiedId)
      .maybeSingle();

    let role = isOwner ? 'owner' : 'member';

    if (existingUser) {
      const firstWord = (existingUser.role || 'member').split(/[\s:]/)[0];
      const baseRole = isOwner ? 'owner' : firstWord === 'admin' ? 'admin' : 'member';
      const limitMatch = existingUser.role?.match(/:limit:\d+/);
      const bypassMatch = existingUser.role?.includes('[bypass]') ? '[bypass]' : '';
      const extraTags = `${limitMatch ? limitMatch[0] : ''}${bypassMatch}`;
      const existingHwidMatch = existingUser.role?.match(/\[HWID:[a-zA-Z0-9_-]+\]/);
      const hwidTag = cleanHwid
        ? ` [HWID:${cleanHwid}]`
        : existingHwidMatch
        ? ` ${existingHwidMatch[0]}`
        : '';

      role = `${baseRole}${extraTags}${hwidTag}`.trim();

      await supabase
        .from('users')
        .update({
          username: verifiedUsername || existingUser.username,
          avatar: verifiedAvatar || existingUser.avatar,
          role,
        })
        .eq('id', verifiedId);
    } else {
      const hwidTag = cleanHwid ? ` [HWID:${cleanHwid}]` : '';
      role = `${role}${hwidTag}`.trim();

      await supabase.from('users').insert({
        id: verifiedId,
        username: verifiedUsername || 'Discord Member',
        avatar: verifiedAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
        role,
      });
    }

    const uiRole: 'owner' | 'admin' | 'member' = isOwner
      ? 'owner'
      : role.startsWith('admin')
      ? 'admin'
      : 'member';

    const limitNumMatch = role.match(/:limit:(\d+)/);
    const limitTier = role.includes('[bypass]')
      ? 250
      : limitNumMatch
      ? parseInt(limitNumMatch[1], 10)
      : 1;

    const response = NextResponse.json({
      id: verifiedId,
      username: verifiedUsername || existingUser?.username || 'Discord Member',
      avatar: verifiedAvatar || existingUser?.avatar,
      role: uiRole,
      limitTier,
      hwid: cleanHwid || undefined,
    });

    if (issueNewCookie) {
      response.cookies.set({
        ...getSessionCookieOptions(),
        value: createSessionToken(verifiedId),
      });
    }

    return response;
  } catch (err) {
    console.error('Error syncing user:', err);
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
  }
}
