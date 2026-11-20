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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filterMode = searchParams.get('mode'); // 'completed' | 'all' | 'pending'

    let query = supabase.from('loan_requests').select('*').order('created_at', { ascending: false });

    if (filterMode === 'completed') {
      query = query.in('status', ['completed', 'repaid']);
    } else if (filterMode === 'pending') {
      query = query.in('status', ['pending', 'approved', 'active']);
    }

    const { data, error } = await query;
    if (error) throw error;

    const userIds = [...new Set((data || []).map((r) => r.user_id).filter(Boolean))];
    const { data: dbUsers } = await supabase.from('users').select('id, avatar').in('id', userIds);
    const dbAvatarMap: Record<string, string> = {};
    (dbUsers || []).forEach((u) => {
      if (u.avatar) dbAvatarMap[u.id] = u.avatar;
    });

    const enriched = await Promise.all(
      (data || []).map(async (item) => {
        const avatar = await resolveAvatar(item.user_id, dbAvatarMap[item.user_id]);
        const isPaid = item.status === 'completed' || item.status === 'repaid';
        return {
          id: item.id,
          user_id: item.user_id,
          user_name: item.user_name || 'Borrower',
          user_avatar: avatar,
          amount: parseFloat(item.amount) || 0,
          total_due: Math.round((parseFloat(item.amount) || 0) * 1.15 * 100) / 100,
          crypto_currency: item.crypto_currency || 'SOL',
          reason: item.reason || '',
          status: item.status || 'pending',
          is_paid: isPaid,
          created_at: item.created_at,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error('Roadmap GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch roadmap items' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, userName, amount, cryptoCurrency, reason, status } = body;

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    const finalStatus = status || 'completed';

    const { data, error } = await supabase
      .from('loan_requests')
      .insert({
        user_id: userId || '1079074717799030824',
        user_name: userName || 'Borrower',
        amount: parseFloat(amount),
        crypto_currency: cryptoCurrency || 'SOL',
        reason: reason || 'Completed loan payback milestone',
        status: finalStatus,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Roadmap POST error:', err);
    return NextResponse.json({ error: 'Failed to create roadmap item' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, isPaid, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const newStatus = status ? status : isPaid ? 'completed' : 'approved';

    const { data, error } = await supabase
      .from('loan_requests')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, item: data });
  } catch (err) {
    console.error('Roadmap PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update roadmap item' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('loan_requests').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Roadmap DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete roadmap item' }, { status: 500 });
  }
}
