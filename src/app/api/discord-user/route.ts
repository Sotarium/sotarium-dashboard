import { NextResponse } from 'next/server';
import { getLiveDiscordAvatar } from '@/lib/discord-avatar';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  // Official Discord default avatar based on User ID
  let defaultAvatar = 'https://cdn.discordapp.com/embed/avatars/0.png';
  try {
    const idx = Number((BigInt(userId) >> BigInt(22)) % BigInt(6));
    defaultAvatar = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  } catch {}

  // Fetch directly from Discord API with no cache
  if (/^\d{17,20}$/.test(userId) && DISCORD_BOT_TOKEN) {
    try {
      const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        let avatarUrl = defaultAvatar;

        if (data.avatar) {
          avatarUrl = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=256`;
        }

        const result = {
          userId: data.id,
          username: data.global_name || data.username,
          avatarUrl,
          fetchedAt: Date.now(),
        };

        return NextResponse.json(result, {
          headers: { 'Cache-Control': 'no-store, max-age=0' },
        });
      }
    } catch (err) {
      console.error('Failed to fetch Discord avatar for user ID:', userId, err);
    }
  }

  return NextResponse.json({
    userId,
    username: 'User',
    avatarUrl: defaultAvatar,
    fetchedAt: Date.now(),
  }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
