import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getTotalDue } from '@/lib/interest';

const NP_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || '';
const SYSTEM_TICKET_ID = 'c4e47994-0742-42f1-9dc7-8a16daeae8c6';

// Statuses NOWPayments sends when a payment is processed/confirmed
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

    const { payment_status, order_id, actually_paid, actually_paid_at_fiat, price_amount, pay_address, payment_id } = payload;

    console.log('[webhook] NOWPayments callback:', {
      payment_status,
      order_id,
      actually_paid,
      actually_paid_at_fiat,
      price_amount,
      pay_address,
      payment_id,
    });

    if (!FINISHED_STATUSES.has(payment_status)) {
      // Not confirmed yet — acknowledge
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Determine the exact USD amount sent by the user
    // actually_paid_at_fiat provides the exact fiat equivalent of the crypto received
    let receivedUsd = parseFloat(actually_paid_at_fiat) || 0;
    if (receivedUsd <= 0 && payment_status === 'finished') {
      receivedUsd = parseFloat(price_amount) || 0;
    }

    if (receivedUsd <= 0) {
      console.warn('[webhook] Received 0 or invalid USD amount:', payload);
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Check if this payment_id has already been credited (idempotency check via system log)
    const { data: existingCredit } = await supabase
      .from('support_messages')
      .select('id, message')
      .eq('ticket_id', SYSTEM_TICKET_ID)
      .eq('sender_role', 'payment_credit')
      .eq('sender_name', String(payment_id))
      .maybeSingle();

    let previousCreditedUsd = 0;
    if (existingCredit) {
      try {
        const parsed = JSON.parse(existingCredit.message);
        previousCreditedUsd = parseFloat(parsed.creditedUsd) || 0;
      } catch {}
    }

    // The incremental amount to credit to the borrower's loan
    const deltaToCredit = Math.max(0, receivedUsd - previousCreditedUsd);
    if (deltaToCredit <= 0) {
      console.log(`[webhook] Payment ${payment_id} already fully credited ($${previousCreditedUsd}). Skipping.`);
      return NextResponse.json({ ok: true, duplicate: true });
    }

    // order_id format: `${loanId}:${userId}:${timestamp}` or `${userId}:${timestamp}`
    let loanId: string | null = null;
    let userId: string | null = null;

    if (order_id) {
      const parts = order_id.split(':');
      if (parts.length >= 3) {
        loanId = parts[0];
        userId = parts[1];
      } else {
        userId = parts[0];
      }
    }

    // If loanId is known, credit that loan; otherwise find borrower's active loan
    let targetLoan = null;
    if (loanId) {
      const { data: loan } = await supabase
        .from('loan_requests')
        .select('id, amount, amount_paid, status, user_id')
        .eq('id', loanId)
        .maybeSingle();
      targetLoan = loan;
    }

    if (!targetLoan && userId) {
      const { data: loans } = await supabase
        .from('loan_requests')
        .select('id, amount, amount_paid, status, user_id')
        .eq('user_id', userId)
        .in('status', ['approved', 'active'])
        .order('created_at', { ascending: false })
        .limit(1);
      if (loans && loans.length > 0) targetLoan = loans[0];
    }

    if (!targetLoan) {
      console.warn('[webhook] No active loan found to credit for order_id:', order_id);
      return NextResponse.json({ ok: true, note: 'No loan found' });
    }

    const currentPaid = parseFloat(targetLoan.amount_paid) || 0;
    const principal = parseFloat(targetLoan.amount) || 0;
    const totalDue = getTotalDue(principal);
    const newPaid = currentPaid + deltaToCredit;
    const tolerance = Math.max(0.05, totalDue * 0.05);
    const isFullyPaid = newPaid >= (totalDue - tolerance);

    await supabase
      .from('loan_requests')
      .update({
        amount_paid: newPaid,
        status: isFullyPaid ? 'completed' : targetLoan.status,
      })
      .eq('id', targetLoan.id);

    // Save credit record for idempotency
    if (existingCredit) {
      await supabase
        .from('support_messages')
        .update({
          message: JSON.stringify({ creditedUsd: receivedUsd, loanId: targetLoan.id, updatedAt: new Date().toISOString() }),
        })
        .eq('id', existingCredit.id);
    } else {
      await supabase.from('support_messages').insert({
        ticket_id: SYSTEM_TICKET_ID,
        sender_id: targetLoan.user_id,
        sender_name: String(payment_id),
        sender_role: 'payment_credit',
        message: JSON.stringify({ creditedUsd: receivedUsd, loanId: targetLoan.id, createdAt: new Date().toISOString() }),
      });
    }

    console.log(`[webhook] Successfully credited $${deltaToCredit.toFixed(2)} to loan ${targetLoan.id}. Total paid: $${newPaid.toFixed(2)} / $${totalDue.toFixed(2)}${isFullyPaid ? ' (COMPLETED)' : ''}`);

    return NextResponse.json({ ok: true, credited: deltaToCredit });
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
