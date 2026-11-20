import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { OWNER_DISCORD_ID } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId');

    if (!ticketId) {
      return NextResponse.json({ error: 'Missing ticketId' }, { status: 400 });
    }

    const { data: messages, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(messages || []);
  } catch (err) {
    console.error('Failed to fetch messages:', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, senderId, senderName, senderRole, senderAvatar, message } = body;

    if (!ticketId || !senderId || !message || !message.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isOwnerSender = senderId === OWNER_DISCORD_ID || senderRole === 'owner' || senderName?.toLowerCase() === 'sotarium';
    const finalRole = isOwnerSender ? 'owner' : (senderRole || 'user');

    const { data: newMsg, error: msgErr } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: senderId,
        sender_name: senderName || 'User',
        sender_role: finalRole,
        sender_avatar: senderAvatar || '',
        message: message.trim(),
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    // Bump ticket's updated_at
    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    return NextResponse.json(newMsg, { status: 201 });
  } catch (err) {
    console.error('Failed to send message:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
