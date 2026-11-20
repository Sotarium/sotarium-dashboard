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

  // Check cache (valid for 5 minutes)
  const cached = avatarCache[userId];
  if (cached && Date.now() - cached.fetchedAt < 300000) {
    return NextResponse.json(cached);
  }

  // Official Discord default avatar based on User ID
  let defaultAvatar = 'https://cdn.discordapp.com/embed/avatars/0.png';
  try {
    const idx = Number((BigInt(userId) >> BigInt(22)) % BigInt(6));
    defaultAvatar = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  } catch {}

  // Fetch directly from Discord API using the user ID
  if (/^\d{17,20}$/.test(userId)) {
    try {
      const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
        next: { revalidate: 300 },
      });

      if (res.ok) {
        const data = await res.json();
        let avatarUrl = defaultAvatar;

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
      console.error('Failed to fetch Discord avatar for user ID:', userId, err);
    }
  }

  return NextResponse.json({
    userId,
    username: 'User',
    avatarUrl: defaultAvatar,
    fetchedAt: Date.now(),
  });
}
