import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getTotalDue } from '@/lib/interest';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';

async function fetchDiscordProfile(userId: string) {
  let defaultAvatar = 'https://cdn.discordapp.com/embed/avatars/0.png';
  try {
    const idx = Number((BigInt(userId) >> BigInt(22)) % BigInt(6));
    defaultAvatar = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  } catch {}

  if (/^\d{17,20}$/.test(userId) && DISCORD_BOT_TOKEN) {
    try {
      const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        let avatarUrl = defaultAvatar;
        if (data.avatar) {
          avatarUrl = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=256`;
        }
        return {
          id: data.id,
          username: data.username,
          displayName: data.global_name || data.username,
          avatarUrl,
          fetchedAt: Date.now(),
        };
      }
    } catch (e) {
      console.error('Error fetching Discord user:', e);
    }
  }

  return {
    id: userId,
    username: 'Discord Member',
    displayName: 'Discord Member',
    avatarUrl: defaultAvatar,
    fetchedAt: Date.now(),
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';

    // If querying a specific snowflake user ID directly:
    if (/^\d{17,20}$/.test(q)) {
      const discordUser = await fetchDiscordProfile(q);

      // Fetch user from DB if exists
      const { data: dbUser } = await supabase.from('users').select('*').eq('id', q).maybeSingle();

      // Fetch user's loans
      const { data: userLoans, error: loansErr } = await supabase
        .from('loan_requests')
        .select('*')
        .eq('user_id', q)
        .order('created_at', { ascending: false });

      if (loansErr) console.error('Loans query error:', loansErr);

      // Strictly only accepted/active/completed/repaid loans - refused/rejected loans are completely ignored
      const loansList = (userLoans || []).filter((l) => 
        ['approved', 'active', 'completed', 'repaid'].includes(l.status)
      );

      let totalLent = 0;
      let totalPaid = 0;
      let totalDue = 0;

      loansList.forEach((l) => {
        const amt = parseFloat(l.amount) || 0;
        const isCompleted = l.status === 'completed' || l.status === 'repaid';
        const isApproved = l.status === 'approved' || l.status === 'active';

        if (isCompleted) {
          totalPaid += amt;
          totalLent += amt;
        } else if (isApproved) {
          totalDue += Math.round(getTotalDue(amt) * 100) / 100;
          totalLent += amt;
        }
        // Rejected loans do NOT add to totalDue or totalLent ($0 due)
      });

      const userProfile = {
        id: q,
        username: discordUser.username || dbUser?.username || 'Discord User',
        displayName: discordUser.displayName || dbUser?.username || 'Discord User',
        avatarUrl: discordUser.avatarUrl || dbUser?.avatar,
        role: dbUser?.role || (q === '1079074717799030824' ? 'owner' : 'member'),
        hwid: dbUser?.hwid || null,
        created_at: dbUser?.created_at || null,
      };

      return NextResponse.json({
        user: userProfile,
        loans: loansList.map((l) => ({
          ...l,
          total_due: Math.round((parseFloat(l.amount) || 0) * 1.15 * 100) / 100,
          is_paid: l.status === 'completed' || l.status === 'repaid',
        })),
        stats: {
          totalLoans: loansList.length,
          totalLent,
          totalPaid,
          totalDue,
          paidCount: loansList.filter((l) => l.status === 'completed' || l.status === 'repaid').length,
          dueCount: loansList.filter((l) => l.status === 'approved' || l.status === 'active').length,
        },
      });
    }

    // Otherwise, fetch all users or search by text
    const { data: allDbUsers } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    const { data: allLoans } = await supabase.from('loan_requests').select('*');

    // Group loans by user_id
    const loansByUser: Record<string, any[]> = {};
    (allLoans || []).forEach((l) => {
      if (l.user_id) {
        if (!loansByUser[l.user_id]) loansByUser[l.user_id] = [];
        loansByUser[l.user_id].push(l);
      }
    });

    // Merge registered users and borrowers
    const userMap: Record<string, {
      id: string;
      username: string;
      displayName?: string;
      avatarUrl: string;
      role?: string;
      totalLoans: number;
      totalLent: number;
      totalPaid: number;
      totalDue: number;
      pendingCount: number;
      completedCount: number;
    }> = {};

    (allDbUsers || []).forEach((u) => {
      const uLoans = (loansByUser[u.id] || []).filter((l) =>
        ['approved', 'active', 'completed', 'repaid'].includes(l.status)
      );
      let totalLent = 0;
      let totalPaid = 0;
      let totalDue = 0;
      let pendingCount = 0;
      let completedCount = 0;

      uLoans.forEach((l) => {
        const amt = parseFloat(l.amount) || 0;
        if (l.status === 'completed' || l.status === 'repaid') {
          totalPaid += amt;
          totalLent += amt;
          completedCount++;
        } else if (l.status === 'approved' || l.status === 'active') {
          totalDue += Math.round(getTotalDue(amt) * 100) / 100;
          totalLent += amt;
          pendingCount++;
        }
      });

      userMap[u.id] = {
        id: u.id,
        username: u.username,
        displayName: u.username,
        avatarUrl: u.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
        role: u.role || 'member',
        totalLoans: uLoans.length,
        totalLent,
        totalPaid,
        totalDue,
        pendingCount,
        completedCount,
      };
    });

    // Also include any borrowers from loan_requests not yet in users table (if they have approved loans)
    (allLoans || []).forEach((l) => {
      if (l.user_id && !userMap[l.user_id]) {
        const uLoans = (loansByUser[l.user_id] || []).filter((item) =>
          ['approved', 'active', 'completed', 'repaid'].includes(item.status)
        );
        if (uLoans.length === 0) return; // Do not show borrowers whose loans were only refused/pending
        let totalLent = 0;
        let totalPaid = 0;
        let totalDue = 0;
        let pendingCount = 0;
        let completedCount = 0;

        uLoans.forEach((item) => {
          const amt = parseFloat(item.amount) || 0;
          if (item.status === 'completed' || item.status === 'repaid') {
            totalPaid += amt;
            totalLent += amt;
            completedCount++;
          } else if (item.status === 'approved' || item.status === 'active') {
            totalDue += Math.round(getTotalDue(amt) * 100) / 100;
            totalLent += amt;
            pendingCount++;
          }
        });

        userMap[l.user_id] = {
          id: l.user_id,
          username: l.user_name || 'Borrower',
          displayName: l.user_name || 'Borrower',
          avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
          role: 'member',
          totalLoans: uLoans.length,
          totalLent,
          totalPaid,
          totalDue,
          pendingCount,
          completedCount,
        };
      }
    });

    // Resolve real Discord avatars for all users in parallel
    await Promise.all(
      Object.values(userMap).map(async (u) => {
        const disc = await fetchDiscordProfile(u.id);
        if (disc && disc.avatarUrl) {
          u.avatarUrl = disc.avatarUrl;
        }
        if (disc && disc.displayName && disc.displayName !== 'Discord Member') {
          u.displayName = disc.displayName;
        }
      })
    );

    let results = Object.values(userMap);

    if (q) {
      const lower = q.toLowerCase();
      results = results.filter(
        (u) =>
          u.username.toLowerCase().includes(lower) ||
          u.id.includes(lower) ||
          (u.displayName && u.displayName.toLowerCase().includes(lower))
      );
    }

    return NextResponse.json({ users: results });
  } catch (err: any) {
    if (err?.digest?.includes('NEXT_PRERENDER')) throw err;
    console.error('Error in users lookup:', err);
    return NextResponse.json({ error: 'Failed to lookup users' }, { status: 500 });
  }
}

