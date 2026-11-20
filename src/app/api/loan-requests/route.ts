import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let query = supabase.from('loan_requests').select('*').order('created_at', { ascending: false });
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const userIds = [...new Set((data || []).map((r) => r.user_id))];
    const { data: dbUsers } = await supabase.from('users').select('id, avatar').in('id', userIds);
    const avatarMap: Record<string, string> = {};
    (dbUsers || []).forEach((u) => {
      if (u.avatar) avatarMap[u.id] = u.avatar;
    });

    const enriched = (data || []).map((r) => ({
      ...r,
      user_avatar: avatarMap[r.user_id] || null,
    }));

    return NextResponse.json(enriched);
  } catch (err) {
    console.error('Failed to fetch loan requests:', err);
    return NextResponse.json({ error: 'Failed to fetch loan requests' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, userName, amount, reason, cryptoCurrency } = body;

    if (!userId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase.from('loan_requests').insert({
      user_id: userId,
      user_name: userName || 'Borrower',
      amount: parseFloat(amount),
      reason: reason || '',
      crypto_currency: cryptoCurrency || 'SOL',
      status: 'pending',
    }).select().single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Failed to create loan request:', err);
    return NextResponse.json({ error: 'Failed to create loan request' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, due_date, notes, amount, reason } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Build the update object — only include defined fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: Record<string, any> = {};

    if (status !== undefined) {
      if (!['approved', 'rejected', 'pending', 'completed', 'active', 'repaid'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updatePayload.status = status;
    }
    if (due_date !== undefined) updatePayload.due_date = due_date;
    if (notes !== undefined) updatePayload.notes = notes;
    if (amount !== undefined) updatePayload.amount = parseFloat(amount);
    if (reason !== undefined) updatePayload.reason = reason;

    const { data, error } = await supabase
      .from('loan_requests')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, request: data });
  } catch (err) {
    console.error('Failed to update loan request:', err);
    return NextResponse.json({ error: 'Failed to update loan request' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('loan_requests').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete loan request:', err);
    return NextResponse.json({ error: 'Failed to delete loan request' }, { status: 500 });
  }
}
