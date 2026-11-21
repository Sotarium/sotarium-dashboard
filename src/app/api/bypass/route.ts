import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

const OWNER_DISCORD_ID = "1079074717799030824";

async function verifyIsOwner(userId?: string): Promise<boolean> {
  if (!userId) return false;
  if (userId === OWNER_DISCORD_ID) return true;

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  return user?.role === 'owner';
}

// GET: list all registered users & borrowers with their current allowed tier limit
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requesterId = searchParams.get('requesterId');

    const isOwner = await verifyIsOwner(requesterId || undefined);
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized: Owner access only' }, { status: 403 });
    }

    // 1. Fetch all users from `users` table
    const { data: dbUsers, error: userErr } = await supabase
      .from('users')
      .select('id, username, avatar, role, created_at')
      .order('created_at', { ascending: false });

    if (userErr) throw userErr;

    // 2. Fetch borrowers from `loan_requests` so even users who haven't logged in appear
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
          avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
          role: 'member',
        };
      }
    });

    const userList = Object.values(userMap);
    return NextResponse.json(userList);
  } catch (err) {
    console.error('Error fetching bypass users:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST: Update a user's maximum allowed loan limit
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requesterId, targetUserId, targetUsername, maxLimit } = body;

    const isOwner = await verifyIsOwner(requesterId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized: Owner access only' }, { status: 403 });
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target User ID is required' }, { status: 400 });
    }

    // Check if target user exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .single();

    // Determine the base role (preserve owner/admin)
    let baseRole = 'member';
    if (existingUser?.role) {
      if (existingUser.role.startsWith('owner')) baseRole = 'owner';
      else if (existingUser.role.startsWith('admin')) baseRole = 'admin';
    }

    // If maxLimit is null/undefined or <= 1, standard limit applies
    let newRole = baseRole;
    if (maxLimit && maxLimit > 1) {
      newRole = `${baseRole}:limit:${maxLimit}`;
    }

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
