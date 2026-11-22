import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';

// In-memory cache for avatar URLs across requests
const avatarMemCache: Record<string, { url: string; expiresAt: number }> = {};

export async function getLiveDiscordAvatar(userId: string, fallbackDbAvatar?: string): Promise<string> {
  let defaultAvatar = 'https://cdn.discordapp.com/embed/avatars/0.png';
  try {
    const idx = Number((BigInt(userId) >> BigInt(22)) % BigInt(6));
    defaultAvatar = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  } catch {}

  const now = Date.now();

  // 1. Check in-memory cache (valid for 60 seconds)
  if (avatarMemCache[userId] && avatarMemCache[userId].expiresAt > now) {
    return avatarMemCache[userId].url;
  }

  // 2. Try fetching from Discord Bot API
  if (/^\d{17,20}$/.test(userId) && DISCORD_BOT_TOKEN) {
    try {
      const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
        // Do not spam when rate-limited
      });

      if (res.ok) {
        const d = await res.json();
        if (d.avatar) {
          const freshAvatar = `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.png?size=256`;
          avatarMemCache[userId] = { url: freshAvatar, expiresAt: now + 60000 };

          // Persist the real avatar in the database silently so we always have a bulletproof backup
          Promise.resolve(
            supabase
              .from('users')
              .update({ avatar: freshAvatar })
              .eq('id', userId)
          ).catch(() => {});

          return freshAvatar;
        }
      } else if (res.status === 429) {
        // Discord rate limit hit (too many fast requests)
        // If we hit rate limit, cache whatever we have for 15s to allow rate limit to expire
        if (avatarMemCache[userId]) {
          return avatarMemCache[userId].url;
        }
      }
    } catch (e) {
      console.error('Failed to fetch Discord avatar for user:', userId, e);
    }
  }

  // 3. Fallback to valid Supabase database avatar if available
  if (fallbackDbAvatar && !fallbackDbAvatar.includes('embed/avatars')) {
    avatarMemCache[userId] = { url: fallbackDbAvatar, expiresAt: now + 30000 };
    return fallbackDbAvatar;
  }

  return defaultAvatar;
}
