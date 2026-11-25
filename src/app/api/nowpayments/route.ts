import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

const NP_API = 'https://api.nowpayments.io/v1';
const NP_KEY = process.env.NOWPAYMENTS_API_KEY || '';
const SYSTEM_TICKET_ID = 'c4e47994-0742-42f1-9dc7-8a16daeae8c6';

// Map our coin symbols to NowPayments currency codes
const COIN_MAP: Record<string, string> = {
  SOL: 'sol',
  ETH: 'eth',
  LTC: 'ltc',
  BTC: 'btc',
};

export async function POST(req: Request) {
  try {
    const { coin, userId, userName, loanId } = await req.json();

    if (!coin || !userId) {
      return NextResponse.json({ error: 'coin and userId are required' }, { status: 400 });
    }

    const coinUpper = coin.toUpperCase();
    const currency = COIN_MAP[coinUpper];
    if (!currency) {
      return NextResponse.json({ error: `Unsupported coin: ${coin}` }, { status: 400 });
    }

    // Check if user already has a valid, non-expired deposit address for this coin
    const { data: existingMsgs } = await supabase
      .from('support_messages')
      .select('id, message, created_at')
      .eq('ticket_id', SYSTEM_TICKET_ID)
      .eq('sender_id', userId)
      .eq('sender_name', coinUpper)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingMsgs && existingMsgs.length > 0) {
      try {
        const saved = JSON.parse(existingMsgs[0].message);
        const validUntilMs = saved.validUntil ? new Date(saved.validUntil).getTime() : 0;
        // Reuse if still valid for at least 1 hour
        if (saved.address && validUntilMs > Date.now() + 3600_000) {
          return NextResponse.json({
            paymentId: saved.paymentId,
            address: saved.address,
            coin: currency,
            status: 'waiting',
            validUntil: saved.validUntil,
          });
        }
      } catch {}
    }

    // Encode loanId in order_id so webhook can find the right loan
    const orderId = loanId
      ? `${loanId}:${userId}:${Date.now()}`
      : `${userId}:${Date.now()}`;

    // Create an open-ended deposit address on NOWPayments (users can send any amount)
    const body = {
      price_amount: 100,
      price_currency: 'usd',
      pay_currency: currency,
      ipn_callback_url: 'https://sotarium.vercel.app/api/nowpayments/webhook',
      order_id: orderId,
      order_description: `Loan payback from ${userName || userId}`,
      is_fixed_rate: false,
      is_fee_paid_by_user: false,
    };

    const res = await fetch(`${NP_API}/payment`, {
      method: 'POST',
      headers: {
        'x-api-key': NP_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('NOWPayments error:', data);
      return NextResponse.json({ error: data?.message || 'NOWPayments API error' }, { status: res.status });
    }

    // Persist the deposit address in Supabase for reuse
    await supabase.from('support_messages').insert({
      ticket_id: SYSTEM_TICKET_ID,
      sender_id: userId,
      sender_name: coinUpper,
      sender_role: 'system',
      message: JSON.stringify({
        address: data.pay_address,
        paymentId: data.payment_id,
        validUntil: data.valid_until || data.expiration_estimate_date,
        creditedUsd: 0,
      }),
    });

    return NextResponse.json({
      paymentId: data.payment_id,
      address: data.pay_address,
      coin: data.pay_currency,
      status: data.payment_status,
      validUntil: data.valid_until || data.expiration_estimate_date,
    });
  } catch (err) {
    console.error('NOWPayments route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
