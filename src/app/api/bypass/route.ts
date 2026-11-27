import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getLiveDiscordAvatar } from '@/lib/discord-avatar';
import { getAuthenticatedSession } from '@/lib/session';

const ALLOWED_TIERS = new Set([1, 5, 10, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250]);

// GET: list all registered users & borrowers with resolved Discord avatars and tier limits
export async function GET() {
  try {
    const session = await getAuthenticatedSession();
    if (!session?.isOwner) {
      return NextResponse.json({ error: 'Unauthorized: Owner access only' }, { status: 403 });
    }

    const { data: dbUsers, error: userErr } = await supabase
      .from('users')
      .select('id, username, avatar, role, created_at')
      .order('created_at', { ascending: false });

    if (userErr) throw userErr;

    const { data: loans } = await supabase
      .from('loan_requests')
      .select('user_id, user_name')
      .order('created_at', { ascending: false });

    const userMap: Record<string, { id: string; username: string; avatar?: string; role: string }> = {};

    (dbUsers || []).forEach((u) => {
      userMap[u.id] = {
        id: u.id,
        username: u.username || 'User',
        avatar: u.avatar,
        role: u.role || 'member',
      };
    });

    (loans || []).forEach((l) => {
      if (l.user_id && !userMap[l.user_id]) {
        userMap[l.user_id] = {
          id: l.user_id,
          username: l.user_name || 'Borrower',
          avatar: undefined,
          role: 'member',
        };
      }
    });

    const userList = Object.values(userMap);

    const enriched = await Promise.all(
      userList.map(async (u) => {
        const resolved = await getLiveDiscordAvatar(u.id, u.avatar);
        return {
          ...u,
          avatar: resolved,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error('Error fetching bypass users:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST: Update a user's maximum allowed loan limit
export async function POST(req: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session?.isOwner) {
      return NextResponse.json({ error: 'Unauthorized: Owner access only' }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, targetUsername, maxLimit } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target User ID is required' }, { status: 400 });
    }

    const parsedLimit = Number(maxLimit);
    if (!ALLOWED_TIERS.has(parsedLimit)) {
      return NextResponse.json({ error: 'Invalid tier limit' }, { status: 400 });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .maybeSingle();

    let baseRole = 'member';
    if (existingUser?.role) {
      if (existingUser.role.startsWith('owner')) baseRole = 'owner';
      else if (existingUser.role.startsWith('admin')) baseRole = 'admin';
    }

    const existingHwid = existingUser?.role?.match(/\[HWID:[a-zA-Z0-9_-]+\]/)?.[0] || '';
    const limitTag = parsedLimit >= 1 ? `:limit:${parsedLimit}` : '';
    const newRole = `${baseRole}${limitTag}${existingHwid ? ` ${existingHwid}` : ''}`.trim();

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: targetUserId,
        username: targetUsername || existingUser?.username || 'User',
        avatar: existingUser?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
        role: newRole,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, user: data });
  } catch (err) {
    console.error('Error updating limit for user:', err);
    return NextResponse.json({ error: 'Failed to update user limit' }, { status: 500 });
  }
}
