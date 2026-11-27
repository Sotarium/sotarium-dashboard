import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedSession } from '@/lib/session';

export async function POST(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  const { userId, avatar } = await req.json();
  if (!userId || typeof avatar !== 'string' || !avatar.startsWith('https://cdn.discordapp.com/')) {
    return NextResponse.json({ error: 'Invalid userId or avatar URL' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ avatar })
    .eq('id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
