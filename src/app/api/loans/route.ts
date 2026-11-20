import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const avatarCache: Record<string, string> = {};

async function resolveAvatar(userId: string, dbAvatar?: string): Promise<string> {
  if (dbAvatar) return dbAvatar;
  if (avatarCache[userId]) return avatarCache[userId];

  const defaultAvatar = `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(userId) >> BigInt(22)) % BigInt(6))}.png`;

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
    // Fetch all issued (approved/active/completed/repaid) loan requests from Supabase
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

    const enriched = await Promise.all(
      (data || []).map(async (item) => {
        const avatar = await resolveAvatar(item.user_id, dbAvatarMap[item.user_id]);
        const principal = parseFloat(item.amount) || 0;
        const interest = Math.round(principal * 0.15 * 100) / 100;
        const totalDue = Math.round((principal + interest) * 100) / 100;
        const isPaid = item.status === 'completed' || item.status === 'repaid';

        // due_date: use stored value if column exists, else default to created_at + 48h
        let dueDate = item.due_date || null;
        if (!dueDate) {
          const created = new Date(item.created_at);
          created.setTime(created.getTime() + 48 * 60 * 60 * 1000);
          dueDate = created.toISOString();
        }

        return {
          id: item.id,
          userId: item.user_id,
          userName: item.user_name || 'Borrower',
          userAvatar: avatar,
          principal,
          interestRate: 0.15,
          interestAmount: interest,
          totalDue,
          repaidAmount: isPaid ? principal : 0,
          status: isPaid ? 'completed' : (item.status === 'active' ? 'active' : 'active'),
          loanDate: item.created_at,
          dueDate,
          reason: item.reason || '',
          notes: item.notes || '',
          cryptoCurrency: item.crypto_currency || 'SOL',
          addresses: {},
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error('Failed to fetch loans:', err);
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 });
  }
}
