'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Copy, Check, Loader2, ChevronRight } from 'lucide-react';

const COINS = [
  {
    symbol: 'SOL',
    name: 'Solana',
    address: 'FtE4jhje3TCzRiTuxCejxu9QVJqXdkDnmW25mcvPCqj8',
    icon: '/assets/sol.svg',
    color: 'from-purple-500/20 to-purple-600/5',
    border: 'border-purple-500/30',
    text: 'text-purple-300',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x5E332519f26987709214F60e50AC69793ef5B72E',
    icon: '/assets/eth.svg',
    color: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/30',
    text: 'text-blue-300',
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    address: 'LedANhtpWzfX8Ug35mMQfthfe5ofDW5eMs',
    icon: '/assets/ltc.svg',
    color: 'from-neutral-500/20 to-neutral-600/5',
    border: 'border-neutral-500/30',
    text: 'text-neutral-300',
  },
];

interface ActiveLoan {
  id: string;
  principal: number;
  totalDue: number;
  dueDate: string;
  cryptoCurrency: string;
  status: string;
}

export default function PaybackPage() {
  const { user, isLoaded } = useAuth();
  const [loan, setLoan] = useState<ActiveLoan | null>(null);
  const [loadingLoan, setLoadingLoan] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState<typeof COINS[0] | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchMyLoan = useCallback(async () => {
    if (!user?.id) return;
    setLoadingLoan(true);
    try {
      const res = await fetch('/api/loans');
      if (res.ok) {
        const data = await res.json();
        const mine = (data as ActiveLoan[]).find(
          (l: ActiveLoan & { userId?: string }) =>
            (l as ActiveLoan & { userId: string }).userId === user.id && l.status !== 'completed'
        );
        setLoan(mine || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLoan(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoaded && user) fetchMyLoan();
  }, [isLoaded, user, fetchMyLoan]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaidNotify = async () => {
    if (!loan || !selectedCoin) return;
    setSubmitting(true);
    try {
      // PATCH loan status to signal pending verification
      await fetch('/api/loan-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loan.id, notes: `Borrower submitted payment via ${selectedCoin.symbol}` }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="space-y-6 animate-pulse max-w-2xl">
        <div className="h-10 w-48 bg-white/[0.04] rounded-xl" />
        <div className="soteria-card p-6 h-64 bg-white/[0.02]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Payback</h1>
        <p className="text-sm text-neutral-500 mt-1">Repay your active loan</p>
      </div>

      {/* Loan Summary Card */}
      {loadingLoan ? (
        <div className="soteria-card p-6 flex items-center gap-3 text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Loading your loan...</span>
        </div>
      ) : !loan ? (
        <div className="soteria-card p-8 text-center space-y-2">
          <div className="text-white font-semibold text-sm">No Active Loan</div>
          <p className="text-neutral-500 text-xs">You don&apos;t have an active loan to repay right now.</p>
        </div>
      ) : submitted ? (
        <div className="soteria-card p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-white font-semibold">Payment Submitted</div>
          <p className="text-neutral-500 text-xs max-w-xs mx-auto">
            Your payment notification has been sent. The admin will verify and mark your loan as paid.
          </p>
        </div>
      ) : (
        <>
          {/* Loan Info */}
          <div className="soteria-card p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-neutral-400 mb-0.5">Amount Due</div>
              <div className="text-2xl font-bold text-white font-sans">
                ${(loan.principal * 1.15).toFixed(2)}
                <span className="text-sm text-neutral-400 font-normal ml-1.5">+15% interest</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Principal: ${loan.principal.toFixed(2)} · Due: {new Date(loan.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 shrink-0">
              Active
            </div>
          </div>

          {/* Step 1 — Choose coin */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest px-1">
              1 · Choose your payment coin
            </div>
            <div className="grid grid-cols-3 gap-3">
              {COINS.map((coin) => (
                <button
                  key={coin.symbol}
                  onClick={() => setSelectedCoin(coin)}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all cursor-pointer bg-gradient-to-b ${coin.color} ${
                    selectedCoin?.symbol === coin.symbol
                      ? `${coin.border} ring-1 ring-inset ${coin.border.replace('border-', 'ring-')}`
                      : 'border-white/[0.06] hover:border-white/20'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coin.icon}
                    alt={coin.name}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="text-center">
                    <div className={`text-sm font-bold ${selectedCoin?.symbol === coin.symbol ? coin.text : 'text-white'}`}>
                      {coin.symbol}
                    </div>
                    <div className="text-[10px] text-neutral-500">{coin.name}</div>
                  </div>
                  {selectedCoin?.symbol === coin.symbol && (
                    <div className={`w-1.5 h-1.5 rounded-full ${coin.text.replace('text-', 'bg-')}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 — Send to address */}
          {selectedCoin && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest px-1">
                2 · Send <span className="text-white">${(loan.principal * 1.15).toFixed(2)} USD</span> worth of {selectedCoin.symbol} to
              </div>
              <div className={`soteria-card p-4 border ${selectedCoin.border} bg-gradient-to-b ${selectedCoin.color}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">{selectedCoin.name} Address</div>
                    <div className={`text-xs font-mono font-semibold ${selectedCoin.text} break-all`}>
                      {selectedCoin.address}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(selectedCoin.address)}
                    className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-neutral-400 hover:text-white transition-all shrink-0 cursor-pointer"
                    title="Copy address"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Step 3 — Notify */}
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest px-1 pt-1">
                3 · After sending, notify the admin
              </div>
              <button
                onClick={handlePaidNotify}
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-white hover:bg-neutral-100 text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    I've Sent the Payment
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-neutral-500 text-center px-4">
                Admin will verify your transaction and mark the loan as paid. Do not close this page until confirmed.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
