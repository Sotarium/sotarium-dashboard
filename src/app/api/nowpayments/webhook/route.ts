import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

const NP_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || '';

// Statuses NOWPayments sends when a payment is fully confirmed
const FINISHED_STATUSES = new Set(['finished', 'confirmed', 'sending', 'partially_paid']);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    // Verify HMAC signature from NOWPayments
    if (NP_IPN_SECRET) {
      const sig = req.headers.get('x-nowpayments-sig') || '';
      const sorted = JSON.stringify(sortObjectKeys(payload));
      const expected = createHmac('sha512', NP_IPN_SECRET).update(sorted).digest('hex');
      if (sig !== expected) {
        console.warn('[webhook] Invalid NOWPayments signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const { payment_status, order_id, actually_paid, price_amount, pay_currency } = payload;

    console.log('[webhook] NOWPayments callback:', { payment_status, order_id, actually_paid });

    if (!FINISHED_STATUSES.has(payment_status)) {
      // Not confirmed yet — just acknowledge
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }

    // order_id format: `${loanId}:${userId}:${timestamp}` or legacy `${userId}:${timestamp}`
    const parts = order_id.split(':');
    const loanId = parts.length >= 3 ? parts[0] : null;
    const userId = parts.length >= 3 ? parts[1] : parts[0];

    const paidUsd = parseFloat(price_amount) || 0;

    if (loanId) {
      // Update the specific loan by ID
      const { data: loan, error: fetchErr } = await supabase
        .from('loan_requests')
        .select('id, amount, amount_paid, status')
        .eq('id', loanId)
        .single();

      if (fetchErr || !loan) {
        console.error('[webhook] Loan not found:', loanId, fetchErr);
        return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
      }

      const currentPaid = parseFloat(loan.amount_paid) || 0;
      const principal = parseFloat(loan.amount) || 0;
      const totalDue = principal * 1.15; // fallback; ideally use getTotalDue
      const newPaid = currentPaid + paidUsd;
      const isFullyPaid = newPaid >= totalDue;

      await supabase
        .from('loan_requests')
        .update({
          amount_paid: newPaid,
          status: isFullyPaid ? 'completed' : loan.status,
        })
        .eq('id', loanId);

      console.log(`[webhook] Updated loan ${loanId}: paid $${newPaid} / $${totalDue}${isFullyPaid ? ' — FULLY PAID' : ''}`);
    } else {
      // Legacy: find the most recent active loan for this userId
      const { data: loans } = await supabase
        .from('loan_requests')
        .select('id, amount, amount_paid, status')
        .eq('user_id', userId)
        .in('status', ['approved', 'active'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (!loans || loans.length === 0) {
        console.warn('[webhook] No active loan found for user:', userId);
        return NextResponse.json({ ok: true, note: 'No active loan found' });
      }

      const loan = loans[0];
      const currentPaid = parseFloat(loan.amount_paid) || 0;
      const principal = parseFloat(loan.amount) || 0;
      const totalDue = principal * 1.15;
      const newPaid = currentPaid + paidUsd;
      const isFullyPaid = newPaid >= totalDue;

      await supabase
        .from('loan_requests')
        .update({
          amount_paid: newPaid,
          status: isFullyPaid ? 'completed' : loan.status,
        })
        .eq('id', loan.id);

      console.log(`[webhook] Updated loan ${loan.id} for user ${userId}: paid $${newPaid}${isFullyPaid ? ' — FULLY PAID' : ''}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[webhook] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// NOWPayments requires keys sorted alphabetically for HMAC verification
function sortObjectKeys(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = typeof obj[key] === 'object' && obj[key] !== null
        ? sortObjectKeys(obj[key] as Record<string, unknown>)
        : obj[key];
      return acc;
    }, {} as Record<string, unknown>);
}
