import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getInterestRate, getInterest, getTotalDue } from '@/lib/interest';
import { getLiveDiscordAvatar } from '@/lib/discord-avatar';

export async function GET() {
  try {
    const now = Date.now();

    const { data, error } = await supabase
      .from('loan_requests')
      .select('*')
      .in('status', ['approved', 'active', 'completed', 'repaid'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    const rows = data || [];

    // Resolve avatars for all users in parallel
    const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
    const { data: dbUsers } = await supabase.from('users').select('id, avatar').in('id', userIds);
    const dbAvatarMap: Record<string, string> = {};
    (dbUsers || []).forEach((u) => { if (u.avatar) dbAvatarMap[u.id] = u.avatar; });

    const avatars = await Promise.all(
      userIds.map((uid) => getLiveDiscordAvatar(uid, dbAvatarMap[uid]).then((url) => [uid, url] as [string, string]))
    );
    const avatarMap = Object.fromEntries(avatars);

    // Auto-promote overdue loans to scammer in parallel
    const overdueIds = rows
      .filter((item) => {
        const isPaid = item.status === 'completed' || item.status === 'repaid';
        if (isPaid) return false;
        const dueTs = item.due_date
          ? new Date(item.due_date).getTime()
          : new Date(item.created_at).getTime() + 7 * 24 * 3600000;
        return dueTs > 0 && dueTs < now;
      })
      .map((item) => item.id);

    if (overdueIds.length > 0) {
      await supabase
        .from('loan_requests')
        .update({ status: 'scammer' })
        .in('id', overdueIds);
    }

    const overdueSet = new Set(overdueIds);

    const enriched = rows
      .filter((item) => !overdueSet.has(item.id))
      .map((item) => {
        const principal = parseFloat(item.amount) || 0;
        const interest = getInterest(principal);
        const totalDue = getTotalDue(principal);
        const isPaid = item.status === 'completed' || item.status === 'repaid';

        let dueDate = item.due_date || null;
        if (!dueDate) {
          dueDate = new Date(new Date(item.created_at).getTime() + 7 * 24 * 3600000).toISOString();
        }

        return {
          id: item.id,
          userId: item.user_id,
          userName: item.user_name || 'Borrower',
          userAvatar: avatarMap[item.user_id] || 'https://cdn.discordapp.com/embed/avatars/0.png',
          principal,
          interestRate: getInterestRate(principal),
          interestAmount: interest,
          totalDue,
          repaidAmount: isPaid ? totalDue : (parseFloat(item.amount_paid) || 0),
          status: isPaid ? 'completed' : 'active',
          loanDate: item.created_at,
          dueDate,
          reason: item.reason || '',
          notes: item.notes || '',
          cryptoCurrency: item.crypto_currency || 'SOL',
          addresses: {},
        };
      });

    return NextResponse.json(enriched);
  } catch (err) {
    console.error('Failed to fetch loans:', err);
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 });
  }
}
