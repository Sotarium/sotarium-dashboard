import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

const OWNER_DISCORD_ID = "1079074717799030824";
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const avatarCache: Record<string, string> = {};

async function resolveAvatar(userId: string, dbAvatar?: string): Promise<string> {
  if (dbAvatar && !dbAvatar.includes('embed/avatars')) return dbAvatar;
  if (avatarCache[userId]) return avatarCache[userId];
  if (/^\d{17,20}$/.test(userId) && DISCORD_BOT_TOKEN) {
    try {
      const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const d = await res.json();
        if (d.avatar) {
          const url = `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.png?size=128`;
          avatarCache[userId] = url;
          return url;
        }
      }
    } catch {}
  }
  return dbAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
}

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

export async function GET() {
  try {
    // 1. Fetch all loans that have been approved, active, completed, or repaid (users that have received a loan)
    const { data: loans, error } = await supabase
      .from('loan_requests')
      .select('*')
      .in('status', ['approved', 'active', 'completed', 'repaid'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group loans by user_id
    const userLoansMap: Record<string, {
      userId: string;
      userName: string;
      highestRepaidTier: number;
      totalRepaidAmount: number;
      completedLoansCount: number;
      hasActiveLoan: boolean;
    }> = {};

    (loans || []).forEach((l) => {
      const uid = l.user_id;
      if (!uid) return;

      if (!userLoansMap[uid]) {
        userLoansMap[uid] = {
          userId: uid,
          userName: l.user_name || 'Borrower',
          highestRepaidTier: 0,
          totalRepaidAmount: 0,
          completedLoansCount: 0,
          hasActiveLoan: false,
        };
      }

      const isRepaid = l.status === 'completed' || l.status === 'repaid';
      const principal = parseFloat(l.amount) || 0;

      if (isRepaid) {
        userLoansMap[uid].totalRepaidAmount += principal;
        userLoansMap[uid].completedLoansCount += 1;
        if (principal > userLoansMap[uid].highestRepaidTier) {
          userLoansMap[uid].highestRepaidTier = principal;
        }
      } else {
        userLoansMap[uid].hasActiveLoan = true;
      }
    });

    const userList = Object.values(userLoansMap);

    // Resolve avatars
    const userIds = userList.map((u) => u.userId);
    const { data: dbUsers } = await supabase
      .from('users')
      .select('id, avatar')
      .in('id', userIds);

    const dbAvatarMap: Record<string, string> = {};
    (dbUsers || []).forEach((u) => {
      if (u.avatar) dbAvatarMap[u.id] = u.avatar;
    });

    const enriched = await Promise.all(
      userList.map(async (u) => {
        const avatar = await resolveAvatar(u.userId, dbAvatarMap[u.userId]);
        return {
          ...u,
          avatar,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error('Error fetching trusted borrowers:', err);
    return NextResponse.json({ error: 'Failed to fetch trusted borrowers' }, { status: 500 });
  }
}

// DELETE: Owner-only action to mark a user as a scammer / remove from trusted
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');
    const requesterId = searchParams.get('requesterId');

    const isOwner = await verifyIsOwner(requesterId || undefined);
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized: Owner access only' }, { status: 403 });
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Mark all their non-completed loans as 'scammer' so they move to the Scammers page
    const { error: loanErr } = await supabase
      .from('loan_requests')
      .update({ status: 'scammer' })
      .eq('user_id', targetUserId)
      .not('status', 'in', '("completed","repaid")');

    if (loanErr) throw loanErr;

    // Reset their user role if they had bypass/limits
    await supabase
      .from('users')
      .update({ role: 'scammer' })
      .eq('id', targetUserId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error removing user from trusted:', err);
    return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 });
  }
}
