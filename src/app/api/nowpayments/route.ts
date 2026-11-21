import { NextResponse } from 'next/server';

const NP_API = 'https://api.nowpayments.io/v1';
const NP_KEY = process.env.NOWPAYMENTS_API_KEY || '';

// Map our coin symbols to NowPayments currency codes
const COIN_MAP: Record<string, string> = {
  SOL: 'sol',
  ETH: 'eth',
  LTC: 'ltc',
};

export async function POST(req: Request) {
  try {
    const { coin, amount, userId, userName, loanId } = await req.json();

    if (!coin || !amount || !userId) {
      return NextResponse.json({ error: 'coin, amount and userId are required' }, { status: 400 });
    }

    const currency = COIN_MAP[coin.toUpperCase()];
    if (!currency) {
      return NextResponse.json({ error: `Unsupported coin: ${coin}` }, { status: 400 });
    }

    // Encode loanId in order_id so webhook can find the right loan
    const orderId = loanId
      ? `${loanId}:${userId}:${Date.now()}`
      : `${userId}:${Date.now()}`;

    // Create a payment invoice on NOWPayments
    const body = {
      price_amount: parseFloat(amount),
      price_currency: 'usd',
      pay_currency: currency,
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

    return NextResponse.json({
      paymentId: data.payment_id,
      address: data.pay_address,
      amount: data.pay_amount,         // exact crypto amount to send
      coin: data.pay_currency,
      status: data.payment_status,
      expiresAt: data.expiration_estimate_date,
    });
  } catch (err) {
    console.error('NOWPayments route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
