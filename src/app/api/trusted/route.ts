import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getLiveDiscordAvatar } from '@/lib/discord-avatar';
import { getAuthenticatedSession } from '@/lib/session';

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

    // 2. Also include users who have bypass / tier limits set in `users.role`
    const { data: allDbUsers } = await supabase
      .from('users')
      .select('id, username, avatar, role');

    const dbAvatarMap: Record<string, string> = {};
    (allDbUsers || []).forEach((u) => {
      if (u.avatar) dbAvatarMap[u.id] = u.avatar;
      const role = u.role || '';
      if (role.startsWith('scammer')) return;

      let bypassTier = 0;
      if (role.includes('bypass')) {
        bypassTier = 250;
      } else {
        const match = role.match(/:limit:(\d+)/);
        if (match) bypassTier = parseInt(match[1], 10);
      }

      if (bypassTier >= 1) {
        if (!userLoansMap[u.id]) {
          userLoansMap[u.id] = {
            userId: u.id,
            userName: u.username || 'Member',
            highestRepaidTier: bypassTier,
            totalRepaidAmount: 0,
            completedLoansCount: 0,
            hasActiveLoan: false,
          };
        } else if (bypassTier > userLoansMap[u.id].highestRepaidTier) {
          userLoansMap[u.id].highestRepaidTier = bypassTier;
        }
      }
    });

    const userList = Object.values(userLoansMap);

    const enriched = await Promise.all(
      userList.map(async (u) => {
        const avatar = await getLiveDiscordAvatar(u.userId, dbAvatarMap[u.userId]);
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
    const session = await getAuthenticatedSession();
    if (!session?.isOwner) {
      return NextResponse.json({ error: 'Unauthorized: Owner access only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

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
