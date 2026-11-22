import { NextResponse } from 'next/server';
import { getLiveDiscordAvatar } from '@/lib/discord-avatar';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const avatarUrl = await getLiveDiscordAvatar(userId);

  return NextResponse.json({
    userId,
    avatarUrl,
    fetchedAt: Date.now(),
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
  });
}
