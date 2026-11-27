import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getAuthenticatedSession } from '@/lib/session';

const SYSTEM_TICKET_ID = 'c4e47994-0742-42f1-9dc7-8a16daeae8c6';

export async function GET() {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Sign in required' }, { status: 401 });
    }

    let query = supabase
      .from('support_tickets')
      .select('*')
      .neq('status', 'system')
      .neq('subject', '__system_deposit_addresses__')
      .order('updated_at', { ascending: false });

    // Non-admin users strictly see ONLY their own tickets
    if (!session.isAdmin) {
      query = query.eq('user_id', session.userId);
    }

    const { data: tickets, error } = await query;
    if (error) throw error;

    const userIds = [...new Set((tickets || []).map((t) => t.user_id))];
    const { data: dbUsers } = await supabase.from('users').select('id, avatar').in('id', userIds);
    const avatarMap: Record<string, string> = {};
    (dbUsers || []).forEach((u) => {
      if (u.avatar) avatarMap[u.id] = u.avatar;
    });

    const ticketsWithPreview = await Promise.all(
      (tickets || []).map(async (t) => {
        const { data: latestMsg } = await supabase
          .from('support_messages')
          .select('id, message, created_at, sender_name, sender_id')
          .eq('ticket_id', t.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...t,
          user_avatar: avatarMap[t.user_id] || t.user_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
          lastMessage: latestMsg?.message || null,
          lastMessageTime: latestMsg?.created_at || t.updated_at,
          lastMessageSender: latestMsg?.sender_name || null,
          lastMessageSenderId: latestMsg?.sender_id || null,
          lastMessageId: latestMsg?.id || null,
        };
      })
    );

    return NextResponse.json(ticketsWithPreview);
  } catch (err) {
    console.error('Failed to fetch support tickets:', err);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Sign in required' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, userName, userAvatar, subject, message } = body;

    if (!message || !String(message).trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (subject === '__system_deposit_addresses__') {
      return NextResponse.json({ error: 'Forbidden subject' }, { status: 403 });
    }

    // Only staff/admin can open tickets on behalf of another borrower
    const targetUserId = session.isAdmin && userId ? String(userId) : session.userId;
    const targetUserName = session.isAdmin && userName ? String(userName) : session.username;
    const targetUserAvatar = session.isAdmin && userAvatar ? String(userAvatar) : session.avatar;

    const { data: ticket, error: ticketErr } = await supabase
      .from('support_tickets')
      .insert({
        user_id: targetUserId,
        user_name: targetUserName || 'Borrower',
        user_avatar: targetUserAvatar || '',
        subject: subject ? String(subject).slice(0, 120) : 'Loan Support Ticket',
        status: 'open',
      })
      .select()
      .single();

    if (ticketErr) throw ticketErr;

    const { data: firstMsg, error: msgErr } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: session.userId,
        sender_name: session.username,
        sender_role: session.role === 'member' ? 'user' : session.role,
        sender_avatar: session.avatar,
        message: String(message).trim(),
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    return NextResponse.json({ ticket, firstMessage: firstMsg }, { status: 201 });
  } catch (err) {
    console.error('Failed to create ticket:', err);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Sign in required' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status || !['open', 'closed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid ticket ID or status' }, { status: 400 });
    }

    if (id === SYSTEM_TICKET_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('id, user_id, status')
      .eq('id', id)
      .maybeSingle();

    if (!ticket || ticket.status === 'system') {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (!session.isAdmin && ticket.user_id !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error('Failed to update ticket:', err);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Sign in required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400 });
    }

    if (id === SYSTEM_TICKET_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('id, user_id, status')
      .eq('id', id)
      .maybeSingle();

    if (!ticket || ticket.status === 'system') {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (!session.isAdmin && ticket.user_id !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await supabase.from('support_messages').delete().eq('ticket_id', id);
    const { error } = await supabase.from('support_tickets').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete ticket:', err);
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 });
  }
}
