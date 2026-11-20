'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Loader2, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const COINS = [
  {
    symbol: 'SOL', name: 'Solana', icon: '/assets/sol.svg',
    color: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/30',
    ring: 'ring-purple-500/30', text: 'text-purple-300', dot: 'bg-purple-400',
  },
  {
    symbol: 'ETH', name: 'Ethereum', icon: '/assets/eth.svg',
    color: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/30',
    ring: 'ring-blue-500/30', text: 'text-blue-300', dot: 'bg-blue-400',
  },
  {
    symbol: 'LTC', name: 'Litecoin', icon: '/assets/ltc.svg',
    color: 'from-neutral-500/20 to-neutral-600/5', border: 'border-neutral-500/30',
    ring: 'ring-neutral-500/30', text: 'text-neutral-300', dot: 'bg-neutral-400',
  },
];

interface PaymentData {
  paymentId: string;
  address: string;
  amount: number;
  coin: string;
  expiresAt?: string;
}

interface LoanSummary {
  id: string;
  principal: number;
  totalDue: number;
  dueDate: string;
  status: string;
  userId: string;
}

export default function PaybackPage() {
  const { user } = useAuth();
  const [myLoan, setMyLoan] = useState<LoanSummary | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<typeof COINS[0] | null>(null);
  const [amount, setAmount] = useState('');
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedAmt, setCopiedAmt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchMyLoan = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/loans');
      if (res.ok) {
        const data: LoanSummary[] = await res.json();
        const mine = data.find((l) => l.userId === user.id && l.status !== 'completed');
        setMyLoan(mine || null);
      }
    } catch { /* silent */ }
  }, [user?.id]);

  useEffect(() => { fetchMyLoan(); }, [fetchMyLoan]);

  const handleCopy = (text: string, type: 'addr' | 'amt') => {
    navigator.clipboard.writeText(text);
    if (type === 'addr') { setCopiedAddr(true); setTimeout(() => setCopiedAddr(false), 2000); }
    else { setCopiedAmt(true); setTimeout(() => setCopiedAmt(false), 2000); }
  };

  const generateAddress = async () => {
    if (!selectedCoin || !amount || parseFloat(amount) <= 0) return;
    setGenerating(true);
    setGenError('');
    setPayment(null);
    try {
      const res = await fetch('/api/nowpayments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coin: selectedCoin.symbol, amount, userId: user?.id || 'anonymous', userName: user?.username || 'User' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate address');
      setPayment(data);
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Could not generate payment address. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePaidNotify = async () => {
    if (!payment || !selectedCoin) return;
    setSubmitting(true);
    try {
      await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Payback Submitted',
          message: `Payment of $${amount} USD (${payment.amount} ${selectedCoin.symbol}) sent. Payment ID: ${payment.paymentId}. Address: ${payment.address}`,
        }),
      });
    } catch { /* silent */ } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Payback</h1>
        <div className="soteria-card p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-white font-semibold">Payment Notified ✓</div>
          <p className="text-neutral-500 text-xs max-w-xs mx-auto">
            Your ${amount} {selectedCoin?.symbol} payment (ID: {payment?.paymentId}) has been submitted. Admin will verify and update your balance.
          </p>
          <button
            onClick={() => { setSubmitted(false); setPayment(null); setAmount(''); setSelectedCoin(null); }}
            className="mt-2 px-5 py-2 rounded-full bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-xs font-medium text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            Make Another Payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Payback</h1>

      {/* Loan Summary Card */}
      {myLoan && (
        <div className="soteria-card p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-neutral-400 mb-0.5">Amount Due</div>
            <div className="text-2xl font-bold text-white font-sans">
              ${myLoan.totalDue.toFixed(2)}
              <span className="text-sm text-neutral-400 font-normal ml-1.5">+15% interest</span>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 shrink-0">
            Active
          </div>
        </div>
      )}

      {/* Step 1 — Choose coin */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest px-1">
          1 · Choose your coin
        </div>
        <div className="grid grid-cols-3 gap-3">
          {COINS.map((coin) => {
            const active = selectedCoin?.symbol === coin.symbol;
            return (
              <button
                key={coin.symbol}
                onClick={() => { setSelectedCoin(coin); setPayment(null); setGenError(''); }}
                className={`flex flex-col items-center gap-2.5 p-5 rounded-2xl border transition-all cursor-pointer bg-gradient-to-b ${coin.color} ${
                  active ? `${coin.border} ring-1 ring-inset ${coin.ring}` : 'border-white/[0.06] hover:border-white/20'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coin.icon} alt={coin.name} className="w-9 h-9 rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="text-center">
                  <div className={`text-sm font-bold ${active ? coin.text : 'text-white'}`}>{coin.symbol}</div>
                  <div className="text-[10px] text-neutral-500">{coin.name}</div>
                </div>
                {active && <div className={`w-1.5 h-1.5 rounded-full ${coin.dot}`} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2 — Amount */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest px-1">
          2 · How much are you sending? (USD)
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold text-sm">$</span>
          <input
            type="number" min={0.01} step={0.01} placeholder="0.00" value={amount}
            onChange={(e) => { setAmount(e.target.value); setPayment(null); setGenError(''); }}
            className="w-full pl-8 pr-4 py-3.5 rounded-2xl bg-[#171717] border border-white/[0.06] text-white text-lg font-bold focus:outline-none focus:border-white/30 transition-all placeholder-neutral-600"
          />
        </div>
      </div>

      {/* Step 3 — Generate unique address */}
      {selectedCoin && amount && parseFloat(amount) > 0 && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest px-1">
            3 · Get your unique {selectedCoin.symbol} address
          </div>

          {!payment ? (
            <>
              <button
                onClick={generateAddress}
                disabled={generating}
                className={`w-full py-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 ${selectedCoin.border}`}
              >
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating address...</>
                  : <><RefreshCw className="w-4 h-4" /> Generate My {selectedCoin.symbol} Address</>}
              </button>
              {genError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {genError}
                </div>
              )}
            </>
          ) : (
            <div className={`soteria-card p-4 border ${selectedCoin.border} bg-gradient-to-b ${selectedCoin.color} space-y-3`}>
              <div>
                <div className="text-[11px] text-neutral-300 font-semibold uppercase tracking-widest mb-1.5">
                  Your Unique {selectedCoin.name} Address
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className={`text-xs font-mono font-semibold ${selectedCoin.text} break-all leading-relaxed`}>
                    {payment.address}
                  </div>
                  <button onClick={() => handleCopy(payment.address, 'addr')}
                    className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-neutral-400 hover:text-white transition-all shrink-0 cursor-pointer">
                    {copiedAddr ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="border-t border-white/[0.06] pt-3">
                <div className="text-[11px] text-neutral-300 font-semibold uppercase tracking-widest mb-1.5">
                  Exact Amount to Send
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className={`text-sm font-bold ${selectedCoin.text}`}>
                    {payment.amount} {selectedCoin.symbol}
                    <span className="text-neutral-500 font-normal text-xs ml-1.5">(≈ ${amount} USD)</span>
                  </div>
                  <button onClick={() => handleCopy(payment.amount.toString(), 'amt')}
                    className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-neutral-400 hover:text-white transition-all shrink-0 cursor-pointer">
                    {copiedAmt ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {payment.expiresAt && (
                <div className="text-[10px] text-neutral-500">
                  Address valid until {new Date(payment.expiresAt).toLocaleString()}
                </div>
              )}
              <button onClick={() => { setPayment(null); setGenError(''); }}
                className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer underline underline-offset-2">
                Regenerate address
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 4 — Notify */}
      {payment && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest px-1">
            4 · After sending, notify us
          </div>
          <button
            onClick={handlePaidNotify}
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-white hover:bg-neutral-100 text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <><Check className="w-4 h-4" /> I&apos;ve Sent the Payment <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
          <p className="text-[11px] text-neutral-500 text-center">
            Admin will verify on-chain and update your loan balance.
          </p>
        </div>
      )}
    </div>
  );
}
