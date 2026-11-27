import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getAuthenticatedSession } from '@/lib/session';

const SYSTEM_TICKET_ID = 'c4e47994-0742-42f1-9dc7-8a16daeae8c6';

export async function GET(req: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Sign in required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId');

    if (!ticketId) {
      return NextResponse.json({ error: 'Missing ticketId' }, { status: 400 });
    }

    if (ticketId === SYSTEM_TICKET_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('id, user_id, status')
      .eq('id', ticketId)
      .maybeSingle();

    if (!ticket || ticket.status === 'system') {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (!session.isAdmin && ticket.user_id !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Sign in required' }, { status: 401 });
    }

    const body = await req.json();
    const { ticketId, message } = body;

    if (!ticketId || !message || !String(message).trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (ticketId === SYSTEM_TICKET_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('id, user_id, status')
      .eq('id', ticketId)
      .maybeSingle();

    if (!ticket || ticket.status === 'system') {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (!session.isAdmin && ticket.user_id !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: newMsg, error: msgErr } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: session.userId,
        sender_name: session.username,
        sender_role: session.role === 'member' ? 'user' : session.role,
        sender_avatar: session.avatar,
        message: String(message).trim(),
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

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
