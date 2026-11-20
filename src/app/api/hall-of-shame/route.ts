import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const avatarCache: Record<string, string> = {};

async function resolveAvatar(userId: string, dbAvatar?: string): Promise<string> {
  if (dbAvatar) return dbAvatar;
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

  return 'https://cdn.discordapp.com/embed/avatars/0.png';
}

export interface ScammerEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  principal: number;
  totalDue: number;
  cryptoCurrency: string;
  dueDate: string;
  overdueDays: number;
  reason?: string;
  status: 'scammer' | 'overdue';
}

export async function GET() {
  try {
    const now = Date.now();
    const scammers: ScammerEntry[] = [];

    // Fetch active/approved/overdue/scammer loans
    const { data: dbLoans, error } = await supabase
      .from('loan_requests')
      .select('*')
      .in('status', ['overdue', 'active', 'approved', 'scammer']);

    if (error) console.error('Error fetching loan requests for hall of shame:', error);

    const userIds = [...new Set((dbLoans || []).map((r) => r.user_id).filter(Boolean))];
    const { data: dbUsers } = await supabase.from('users').select('id, avatar').in('id', userIds);
    const dbAvatarMap: Record<string, string> = {};
    (dbUsers || []).forEach((u) => {
      if (u.avatar) dbAvatarMap[u.id] = u.avatar;
    });

    for (const item of (dbLoans || [])) {
      let dueTimestamp = 0;
      if (item.due_date) {
        const parsed = new Date(item.due_date).getTime();
        if (!isNaN(parsed)) dueTimestamp = parsed;
      }
      if (!dueTimestamp && item.created_at) {
        // Default grace period: 48 hours from creation
        dueTimestamp = new Date(item.created_at).getTime() + 48 * 3600 * 1000;
      }

      const isOverdue =
        item.status === 'overdue' ||
        item.status === 'scammer' ||
        (dueTimestamp > 0 && dueTimestamp < now);

      if (isOverdue) {
        // Auto-promote to 'scammer' status in Supabase if not already
        if (item.status !== 'scammer' && item.status !== 'completed' && item.status !== 'repaid') {
          await supabase
            .from('loan_requests')
            .update({ status: 'scammer' })
            .eq('id', item.id);
        }

        const avatar = await resolveAvatar(item.user_id, dbAvatarMap[item.user_id]);
        const overdueDays = Math.max(1, Math.floor((now - dueTimestamp) / (1000 * 60 * 60 * 24)));
        const amt = parseFloat(item.amount) || 0;

        scammers.push({
          id: item.id,
          userId: item.user_id,
          userName: item.user_name || 'Defaulter',
          userAvatar: avatar,
          principal: amt,
          totalDue: Math.round(amt * 1.15 * 100) / 100,
          cryptoCurrency: item.crypto_currency || 'SOL',
          dueDate: new Date(dueTimestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          overdueDays,
          reason: item.reason || 'Unpaid loan defaulted past due date',
          status: 'scammer',
        });
      }
    }

    const totalDefaulted = scammers.reduce((acc, s) => acc + s.totalDue, 0);

    return NextResponse.json({
      scammers,
      stats: {
        totalScammers: scammers.length,
        totalDefaulted,
      },
    });
  } catch (err) {
    console.error('Error fetching hall of shame:', err);
    return NextResponse.json({ error: 'Failed to fetch hall of shame' }, { status: 500 });
  }
}
