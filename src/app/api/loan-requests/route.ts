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

    return NextResponse.json(data || []);
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
    const { id, status } = body;

    if (!id || !status || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('loan_requests')
      .update({ status })
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
