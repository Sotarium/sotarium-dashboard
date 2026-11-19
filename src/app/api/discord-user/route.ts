import { NextResponse } from 'next/server';

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

  try {
    const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
      next: { revalidate: 600 },
    });

    if (res.ok) {
      const data = await res.json();
      let avatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';

      if (data.avatar) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=128`;
      }

      const result = {
        userId: data.id,
        username: data.global_name || data.username,
        avatarUrl,
        fetchedAt: Date.now(),
      };

      avatarCache[userId] = result;
      return NextResponse.json(result);
    }
  } catch (err) {
    console.error('Failed to fetch Discord avatar for user:', userId, err);
  }

  // Fallback
  return NextResponse.json({
    userId,
    username: 'sotarium',
    avatarUrl: 'https://cdn.discordapp.com/avatars/1079074717799030824/64db63e7b0bcbe6b841ba40535473949.png?size=128',
    fetchedAt: Date.now(),
  });
}
