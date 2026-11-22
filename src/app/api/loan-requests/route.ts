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

    // Enforce tier progression & limit
    if (requestedAmount > 1) {
      // 1. Check if user has explicit tier limit in database (e.g. member:limit:50) from Bypass page
      const { data: dbUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      let explicitLimit = 0;
      if (dbUser?.role && dbUser.role.includes(':limit:')) {
        const match = dbUser.role.match(/:limit:(\d+)/);
        if (match) {
          explicitLimit = parseInt(match[1], 10);
        }
      } else if (dbUser?.role?.includes('bypass')) {
        explicitLimit = 250;
      }

      // 2. Calculate tier limit earned from repaid loan milestones:
      // [1 -> 5, 5 -> 10, 10 -> 25, 25 -> 50, 50 -> 75, 75 -> 100, 100 -> 125, 125 -> 150, 150 -> 175, 175 -> 200, 200 -> 225, 225 -> 250]
      const { data: userLoans, error: userLoansError } = await supabase
        .from('loan_requests')
        .select('id, amount, status')
        .eq('user_id', userId)
        .in('status', ['completed', 'repaid']);

      if (userLoansError) {
        console.error('Error checking user loan history:', userLoansError);
      }

      const repaidLoans = userLoans || [];
      let earnedMaxLimit = 1;

      // Find highest repaid principal milestone
      const highestRepaid = repaidLoans.reduce((max, loan) => {
        const amt = parseFloat(loan.amount) || 0;
        return amt > max ? amt : max;
      }, 0);

      const TIERS = [1, 5, 10, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250];

      if (highestRepaid >= 1) {
        // If highest repaid is at or above a tier, unlock the NEXT tier
        for (let i = 0; i < TIERS.length; i++) {
          if (highestRepaid >= TIERS[i]) {
            earnedMaxLimit = TIERS[Math.min(i + 1, TIERS.length - 1)];
          }
        }
      }

      // The active allowed limit is the higher of earned milestone limit or explicit manual bypass limit
      const allowedMax = Math.max(earnedMaxLimit, explicitLimit);

      if (requestedAmount > allowedMax) {
        const limitMsg = allowedMax === 1
          ? 'First-time borrowers can only request up to $1. You gotta make your proofs with a $1 loan first!'
          : `Your current unlocked limit is $${allowedMax}.00. You gotta pay back your current tier to unlock larger amounts!`;
        return NextResponse.json(
          { error: limitMsg },
          { status: 400 }
        );
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
