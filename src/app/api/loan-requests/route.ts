import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

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

    const requestedAmount = parseFloat(amount);
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Check if user has completed/repaid at least one loan before requesting more than $1, unless they are granted tier limit or owner
    if (requestedAmount > 1) {
      const isOwner = userId === OWNER_DISCORD_ID || userName?.toLowerCase() === 'sotarium';

      // Check if user has explicit tier limit in database (e.g. member:limit:50)
      const { data: dbUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      let userMaxLimit = 1;
      if (isOwner || dbUser?.role === 'owner' || dbUser?.role === 'admin' || dbUser?.role?.includes('bypass')) {
        userMaxLimit = Infinity;
      } else if (dbUser?.role && dbUser.role.includes(':limit:')) {
        const match = dbUser.role.match(/:limit:(\d+)/);
        if (match) {
          userMaxLimit = parseInt(match[1], 10);
        }
      }

      // If user has not been granted a limit that covers this amount:
      if (requestedAmount > userMaxLimit) {
        const { data: userLoans, error: userLoansError } = await supabase
          .from('loan_requests')
          .select('id, status')
          .eq('user_id', userId)
          .in('status', ['completed', 'repaid']);

        if (userLoansError) {
          console.error('Error checking user loan history:', userLoansError);
        }

        const hasRepaidLoan = (userLoans || []).length > 0;
        if (!hasRepaidLoan) {
          const limitMsg = userMaxLimit > 1
            ? `Your approved limit is up to $${userMaxLimit}. You gotta make your proofs first before requesting more!`
            : 'First-time borrowers can only request up to $1. You gotta make your proofs with a $1 loan first!';
          return NextResponse.json(
            { error: limitMsg },
            { status: 400 }
          );
        }
      }
    }

    const { data, error } = await supabase.from('loan_requests').insert({
      user_id: userId,
      user_name: userName || 'Borrower',
      amount: requestedAmount,
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

const OWNER_DISCORD_ID = "1079074717799030824";

async function verifyIsAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false;
  if (userId === OWNER_DISCORD_ID) return true;

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  return user?.role === 'admin' || user?.role === 'owner';
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, due_date, notes, amount, reason, requesterId } = body;

    const isAdmin = await verifyIsAdmin(requesterId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

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
    const requesterId = searchParams.get('requesterId') || undefined;

    const isAdmin = await verifyIsAdmin(requesterId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

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
