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

export async function GET() {
  try {
    const now = Date.now();

    const { data: dbLoans, error } = await supabase
      .from('loan_requests')
      .select('*')
      .in('status', ['overdue', 'active', 'approved', 'scammer']);

    if (error) console.error('Hall of shame fetch error:', error);

    const rows = dbLoans || [];

    // Resolve all avatars in parallel
    const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
    const { data: dbUsers } = await supabase.from('users').select('id, avatar').in('id', userIds);
    const dbAvatarMap: Record<string, string> = {};
    (dbUsers || []).forEach((u) => { if (u.avatar) dbAvatarMap[u.id] = u.avatar; });

    const avatarEntries = await Promise.all(
      userIds.map((uid) => resolveAvatar(uid, dbAvatarMap[uid]).then((url) => [uid, url] as [string, string]))
    );
    const avatarMap = Object.fromEntries(avatarEntries);

    // Find overdue ones, auto-promote in one batch update
    const toPromote = rows
      .filter((item) => {
        if (item.status === 'scammer') return false;
        if (item.status === 'completed' || item.status === 'repaid') return false;
        const dueTs = item.due_date
          ? new Date(item.due_date).getTime()
          : new Date(item.created_at).getTime() + 48 * 3600000;
        return dueTs > 0 && dueTs < now;
      })
      .map((item) => item.id);

    if (toPromote.length > 0) {
      await supabase.from('loan_requests').update({ status: 'scammer' }).in('id', toPromote);
    }

    // Build scammer list (already scammer OR just promoted)
    const promoteSet = new Set(toPromote);
    const scammers = rows
      .filter((item) => item.status === 'scammer' || promoteSet.has(item.id))
      .map((item) => {
        const dueTs = item.due_date
          ? new Date(item.due_date).getTime()
          : new Date(item.created_at).getTime() + 48 * 3600000;
        const overdueDays = Math.max(1, Math.floor((now - dueTs) / 86400000));
        const amt = parseFloat(item.amount) || 0;
        return {
          id: item.id,
          userId: item.user_id,
          userName: item.user_name || 'Defaulter',
          userAvatar: avatarMap[item.user_id] || 'https://cdn.discordapp.com/embed/avatars/0.png',
          principal: amt,
          totalDue: Math.round(amt * 1.15 * 100) / 100,
          cryptoCurrency: item.crypto_currency || 'SOL',
          dueDate: new Date(dueTs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          overdueDays,
          reason: item.reason || 'Unpaid loan defaulted past due date',
          status: 'scammer' as const,
        };
      });

    return NextResponse.json({
      scammers,
      stats: { totalScammers: scammers.length, totalDefaulted: scammers.reduce((a, s) => a + s.totalDue, 0) },
    });
  } catch (err) {
    console.error('Error fetching hall of shame:', err);
    return NextResponse.json({ error: 'Failed to fetch hall of shame' }, { status: 500 });
  }
}
