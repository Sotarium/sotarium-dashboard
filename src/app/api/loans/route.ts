import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const avatarCache: Record<string, string> = {};

async function resolveAvatar(userId: string, dbAvatar?: string): Promise<string> {
  if (dbAvatar) return dbAvatar;
  if (avatarCache[userId]) return avatarCache[userId];

  const defaultAvatar = `https://cdn.discordapp.com/embed/avatars/0.png`;

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
  return defaultAvatar;
}

export async function GET() {
  try {
    const now = Date.now();

    // Fetch active/approved loans (not yet paid, not yet scammer)
    const { data, error } = await supabase
      .from('loan_requests')
      .select('*')
      .in('status', ['approved', 'active', 'completed', 'repaid'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    const userIds = [...new Set((data || []).map((r) => r.user_id).filter(Boolean))];
    const { data: dbUsers } = await supabase.from('users').select('id, avatar').in('id', userIds);
    const dbAvatarMap: Record<string, string> = {};
    (dbUsers || []).forEach((u) => { if (u.avatar) dbAvatarMap[u.id] = u.avatar; });

    const enriched = [];

    for (const item of (data || [])) {
      const principal = parseFloat(item.amount) || 0;
      const interest = Math.round(principal * 0.15 * 100) / 100;
      const totalDue = Math.round((principal + interest) * 100) / 100;
      const isPaid = item.status === 'completed' || item.status === 'repaid';

      // Compute due date
      let dueDate = item.due_date || null;
      if (!dueDate) {
        const created = new Date(item.created_at);
        created.setTime(created.getTime() + 48 * 60 * 60 * 1000);
        dueDate = created.toISOString();
      }

      const dueTs = new Date(dueDate).getTime();
      const isOverdue = !isPaid && dueTs > 0 && dueTs < now;

      // Auto-promote overdue unpaid loans → scammer, exclude from this list
      if (isOverdue) {
        await supabase
          .from('loan_requests')
          .update({ status: 'scammer' })
          .eq('id', item.id);
        // Skip — it now lives in Hall of Shame
        continue;
      }

      const avatar = await resolveAvatar(item.user_id, dbAvatarMap[item.user_id]);

      enriched.push({
        id: item.id,
        userId: item.user_id,
        userName: item.user_name || 'Borrower',
        userAvatar: avatar,
        principal,
        interestRate: 0.15,
        interestAmount: interest,
        totalDue,
        repaidAmount: isPaid ? principal : 0,
        status: isPaid ? 'completed' : 'active',
        loanDate: item.created_at,
        dueDate,
        reason: item.reason || '',
        notes: item.notes || '',
        cryptoCurrency: item.crypto_currency || 'SOL',
        addresses: {},
      });
    }

    return NextResponse.json(enriched);
  } catch (err) {
    console.error('Failed to fetch loans:', err);
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 });
  }
}
