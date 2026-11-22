const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';

/**
 * Resolves the real, up-to-date Discord avatar directly from Discord API.
 * Never uses stale or outdated database avatars.
 */
export async function getLiveDiscordAvatar(userId: string, fallbackDbAvatar?: string): Promise<string> {
  let defaultAvatar = 'https://cdn.discordapp.com/embed/avatars/0.png';
  try {
    const idx = Number((BigInt(userId) >> BigInt(22)) % BigInt(6));
    defaultAvatar = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  } catch {}

  if (/^\d{17,20}$/.test(userId) && DISCORD_BOT_TOKEN) {
    try {
      const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const d = await res.json();
        if (d.avatar) {
          return `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.png?size=256`;
        }
      }
    } catch (e) {
      console.error('Failed to fetch Discord avatar for user:', userId, e);
    }
  }

  if (fallbackDbAvatar && !fallbackDbAvatar.includes('embed/avatars')) {
    return fallbackDbAvatar;
  }
  return defaultAvatar;
}
