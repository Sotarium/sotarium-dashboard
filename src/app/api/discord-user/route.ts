import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';

// In-memory cache for Discord avatars
const avatarCache: Record<string, { avatarUrl: string; username: string; fetchedAt: number }> = {};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  // Check cache (valid for 10 minutes)
  const cached = avatarCache[userId];
  if (cached && Date.now() - cached.fetchedAt < 600000) {
    return NextResponse.json(cached);
  }

  // 1. Check Supabase users table first
  try {
    const { data: dbUser } = await supabase
      .from('users')
      .select('username, avatar')
      .eq('id', userId)
      .single();

    if (dbUser && dbUser.avatar && !dbUser.avatar.includes('embed/avatars/0.png')) {
      const result = {
        userId,
        username: dbUser.username || 'User',
        avatarUrl: dbUser.avatar,
        fetchedAt: Date.now(),
      };
      avatarCache[userId] = result;
      return NextResponse.json(result);
    }
  } catch {
    // continue
  }

  // 2. If it's a valid Discord snowflake (17-20 digits), try Discord API
  if (/^\d{17,20}$/.test(userId)) {
    try {
      const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
        next: { revalidate: 600 },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.avatar) {
          // Verify Discord CDN avatar actually exists and does not 404
          const cdnUrl = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=128`;
          try {
            const checkRes = await fetch(cdnUrl, { method: 'HEAD' });
            if (checkRes.ok) {
              const result = {
                userId: data.id,
                username: data.global_name || data.username,
                avatarUrl: cdnUrl,
                fetchedAt: Date.now(),
              };
              avatarCache[userId] = result;
              return NextResponse.json(result);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch Discord avatar for user:', userId, err);
    }
  }

  // 3. Fallback: Aesthetic local avatar, never the default blue discord controller logo
  const fallbackAvatars = [
    '/avatars/slax.jpg',
    '/avatars/azrael.jpg',
    '/avatars/default.jpg',
  ];
  let avatarIndex = 0;
  try {
    avatarIndex = Math.abs(userId.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)) % fallbackAvatars.length;
  } catch {}

  const result = {
    userId,
    username: 'User',
    avatarUrl: fallbackAvatars[avatarIndex] || '/avatars/default.jpg',
    fetchedAt: Date.now(),
  };

  avatarCache[userId] = result;
  return NextResponse.json(result);
}
