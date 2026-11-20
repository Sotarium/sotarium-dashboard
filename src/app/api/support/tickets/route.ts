import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { OWNER_DISCORD_ID } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const isAdmin = searchParams.get('isAdmin') === 'true';

    let query = supabase
      .from('support_tickets')
      .select('*')
      .order('updated_at', { ascending: false });

    // If regular user and not admin/owner, only see their own tickets
    if (userId && !isAdmin && userId !== OWNER_DISCORD_ID) {
      query = query.eq('user_id', userId);
    }

    const { data: tickets, error } = await query;
    if (error) throw error;

    const userIds = [...new Set((tickets || []).map((t) => t.user_id))];
    const { data: dbUsers } = await supabase.from('users').select('id, avatar').in('id', userIds);
    const avatarMap: Record<string, string> = {};
    (dbUsers || []).forEach((u) => {
      if (u.avatar) avatarMap[u.id] = u.avatar;
    });

    // Fetch latest message for each ticket to show preview
    const ticketsWithPreview = await Promise.all(
      (tickets || []).map(async (t) => {
        const { data: latestMsg } = await supabase
          .from('support_messages')
          .select('id, message, created_at, sender_name, sender_id')
          .eq('ticket_id', t.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

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
    const body = await req.json();
    const { 
      userId, 
      userName, 
      userAvatar, 
      subject, 
      message, 
      creatorId, 
      creatorName, 
      creatorRole, 
      creatorAvatar 
    } = body;

    if (!userId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create ticket
    const { data: ticket, error: ticketErr } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        user_name: userName || 'Borrower',
        user_avatar: userAvatar || '',
        subject: subject || 'Loan Support Ticket',
        status: 'open',
      })
      .select()
      .single();

    if (ticketErr) throw ticketErr;

    // 2. Insert initial message
    const senderId = creatorId || userId;
    const senderName = creatorName || userName || 'User';
    const isOwnerSender = senderId === OWNER_DISCORD_ID || creatorRole === 'owner' || senderName?.toLowerCase() === 'sotarium';
    const senderRole = isOwnerSender ? 'owner' : (creatorRole || 'user');
    const senderAvatar = creatorAvatar || userAvatar || '';

    const { data: firstMsg, error: msgErr } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: senderId,
        sender_name: senderName,
        sender_role: senderRole,
        sender_avatar: senderAvatar,
        message: message.trim(),
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
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing ticket ID or status' }, { status: 400 });
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
