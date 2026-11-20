import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

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

    // 1. Fetch from Supabase loan_requests
    const { data: dbLoans, error } = await supabase
      .from('loan_requests')
      .select('*')
      .in('status', ['overdue', 'active', 'approved']);

    if (error) console.error('Error fetching loan requests for hall of shame:', error);

    const userIds = [...new Set((dbLoans || []).map((r) => r.user_id).filter(Boolean))];
    const { data: dbUsers } = await supabase.from('users').select('id, avatar').in('id', userIds);
    const dbAvatarMap: Record<string, string> = {};
    (dbUsers || []).forEach((u) => {
      if (u.avatar) dbAvatarMap[u.id] = u.avatar;
    });

    for (const item of (dbLoans || [])) {
      // Check if past due
      let dueTimestamp = 0;
      if (item.due_date) {
        const parsed = new Date(item.due_date).getTime();
        if (!isNaN(parsed)) dueTimestamp = parsed;
      }
      if (!dueTimestamp && item.created_at) {
        // Standard grace term is 48 hours
        dueTimestamp = new Date(item.created_at).getTime() + 48 * 3600 * 1000;
      }

      const isOverdue = item.status === 'overdue' || (dueTimestamp > 0 && dueTimestamp < now);

      if (isOverdue) {
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

    // 2. Fetch from local loans_data.json if present
    const loansFilePath = path.join(process.cwd(), 'loans_data.json');
    if (fs.existsSync(loansFilePath)) {
      try {
        const raw = fs.readFileSync(loansFilePath, 'utf-8');
        const jsonLoans = JSON.parse(raw);
        if (Array.isArray(jsonLoans)) {
          for (const l of jsonLoans) {
            if (l.status === 'overdue') {
              const dueTs = l.dueDate ? new Date(l.dueDate).getTime() : now;
              const overdueDays = Math.max(1, Math.floor((now - dueTs) / (1000 * 60 * 60 * 24)));
              if (!scammers.some((s) => s.id === l.id || (s.userId === l.userId && s.principal === l.principal))) {
                scammers.push({
                  id: l.id,
                  userId: l.userId,
                  userName: l.userName || 'Defaulter',
                  userAvatar: l.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
                  principal: l.principal || 0,
                  totalDue: l.totalDue || Math.round((l.principal || 0) * 1.15 * 100) / 100,
                  cryptoCurrency: 'SOL',
                  dueDate: l.dueDate || 'Past Due',
                  overdueDays,
                  reason: l.notes || 'Defaulted on repayment deadline',
                  status: 'scammer',
                });
              }
            }
          }
        }
      } catch {}
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
