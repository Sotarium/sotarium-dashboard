import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

const OWNER_DISCORD_ID = "1079074717799030824";

export async function POST(req: Request) {
  try {
    const { id, username, avatar, hwid } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Fetch existing user from Supabase
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    const isOwner = id === OWNER_DISCORD_ID || username?.toLowerCase() === 'sotarium';
    let role = isOwner ? 'owner' : 'member';

    if (existingUser) {
      // Retain existing role if already set (or ensure owner ID stays owner)
      role = isOwner ? 'owner' : (existingUser.role || 'member');

      // Update avatar, username, and role in Supabase
      await supabase
        .from('users')
        .update({
          username,
          avatar: avatar || existingUser.avatar,
          role,
        })
        .eq('id', id);
    } else {
      // Insert new user into Supabase
      await supabase.from('users').insert({
        id,
        username: username || 'Discord Member',
        avatar: avatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
        role,
      });
    }

    return NextResponse.json({
      id,
      username,
      avatar,
      role,
      hwid,
    });
  } catch (err) {
    console.error('Error syncing user with Supabase:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
