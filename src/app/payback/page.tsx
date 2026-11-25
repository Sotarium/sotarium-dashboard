'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Loader2, AlertCircle } from 'lucide-react';
import { CheckmarkAnim } from '@/components/CopyButton';
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
  {
    symbol: 'BTC', name: 'Bitcoin', icon: '/assets/btc.svg',
    color: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/30',
    ring: 'ring-amber-500/30', text: 'text-amber-300', dot: 'bg-amber-400',
  },
];

interface PaymentData {
  paymentId: string;
  address: string;
  coin: string;
  validUntil?: string;
}

interface LoanSummary {
  id: string;
  userId: string;
  userName?: string;
  principal: number;
  totalDue: number;
  repaidAmount: number;
  dueDate: string;
  loanDate: string;
  status: string;
}

function formatDueCountdown(ms: number): string {
  if (ms <= 0) return 'Overdue';
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function PaybackPage() {
  const { user, isLoaded } = useAuth();
  const [myLoan, setMyLoan] = useState<LoanSummary | null>(null);
  const [loadingLoan, setLoadingLoan] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState<typeof COINS[0] | null>(null);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [animAddr, setAnimAddr] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchMyLoan = useCallback(async () => {
    if (!user?.id) {
      if (isLoaded) setLoadingLoan(false);
      return;
    }
    setLoadingLoan(true);
    try {
      const res = await fetch('/api/loans');
      if (res.ok) {
        const data: LoanSummary[] = await res.json();
        const mine = data.find((l) => 
          (l.userId === user.id || (user.username?.toLowerCase() === 'sotarium' && l.userName?.toLowerCase() === 'sotarium')) && 
          l.status !== 'completed'
        );
        setMyLoan(mine || null);
      }
    } catch { /* silent */ } finally {
      setLoadingLoan(false);
    }
  }, [user?.id, user?.username, isLoaded]);

  useEffect(() => { 
    fetchMyLoan();
    // Poll loan progress every 4 seconds so any received payment automatically reflects live
    const interval = setInterval(fetchMyLoan, 4000);
    return () => clearInterval(interval);
  }, [fetchMyLoan]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(true);
    setAnimAddr(true);
    setTimeout(() => { setCopiedAddr(false); setAnimAddr(false); }, 2000);
  };

  // Fetch or retrieve permanent deposit address whenever user selects a coin
  const loadDepositAddress = useCallback(async (coin: typeof COINS[0]) => {
    if (!user?.id) return;
    setLoadingAddress(true);
    setAddressError('');
    try {
      const res = await fetch('/api/nowpayments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coin: coin.symbol,
          userId: user.id,
          userName: user.username || 'User',
          loanId: myLoan?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get deposit address');
      setPayment(data);
    } catch (err: unknown) {
      setAddressError(err instanceof Error ? err.message : 'Could not retrieve deposit address.');
    } finally {
      setLoadingAddress(false);
    }
  }, [user?.id, user?.username, myLoan?.id]);

  useEffect(() => {
    if (selectedCoin && user?.id) {
      loadDepositAddress(selectedCoin);
    }
  }, [selectedCoin, user?.id, loadDepositAddress]);

  const loanProgress = (() => {
    if (!myLoan) return null;
    const pct = myLoan.totalDue > 0
      ? Math.min(100, Math.max(0, (myLoan.repaidAmount / myLoan.totalDue) * 100))
      : 0;
    const dueMs = myLoan.dueDate ? new Date(myLoan.dueDate).getTime() - now : null;
    return { pct, dueMs };
  })();

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Payback</h1>

      {/* Loan Summary Card */}
      {myLoan && (
        <div className="soteria-card p-5 space-y-4">
          {/* Countdown — top center */}
          {loanProgress && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">Time Left</span>
              <span className={`text-base font-semibold tracking-tight ${
                loanProgress.dueMs !== null && loanProgress.dueMs <= 0 ? 'text-red-400' : 'text-white'
              }`}>
                {loanProgress.dueMs === null ? '' : loanProgress.dueMs <= 0 ? '⚠ Overdue' : formatDueCountdown(loanProgress.dueMs)}
              </span>
            </div>
          )}

          {/* Amount + Active badge */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-neutral-400 mb-0.5">Remaining Due</div>
              <div className="text-2xl font-bold text-white font-sans">
                ${Math.max(0, myLoan.totalDue - myLoan.repaidAmount).toFixed(2)}
                <span className="text-sm text-neutral-400 font-normal ml-2">
                  (${myLoan.repaidAmount.toFixed(2)} paid of ${myLoan.totalDue.toFixed(2)} total)
                </span>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 shrink-0">
              Active
            </div>
          </div>

          {/* Progress bar */}
          {loanProgress && (
            <div className="relative w-full h-5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 animate-progress-stripes"
                style={{
                  width: `${loanProgress.pct}%`,
                  backgroundColor: loanProgress.pct >= 100 ? '#00E823' : '#0284C7',
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow">
                {loanProgress.pct.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Choose coin */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest px-1">
          Select Deposit Coin
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {COINS.map((coin) => {
            const active = selectedCoin?.symbol === coin.symbol;
            return (
              <button
                key={coin.symbol}
                onClick={() => { setSelectedCoin(coin); }}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer bg-gradient-to-b ${coin.color} ${
                  active ? `${coin.border} ring-1 ring-inset ${coin.ring}` : 'border-white/[0.06] hover:border-white/20'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coin.icon} alt={coin.name} className="w-8 h-8 rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="text-center">
                  <div className={`text-xs font-bold ${active ? coin.text : 'text-white'}`}>{coin.symbol}</div>
                  <div className="text-[9px] text-neutral-500">{coin.name}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Permanent Deposit Address Card */}
      {selectedCoin && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest px-1">
            Deposit Address ({selectedCoin.name})
          </div>

          {loadingAddress ? (
            <div className="soteria-card p-8 flex flex-col items-center justify-center gap-3 text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
              <span className="text-xs font-medium">Getting your {selectedCoin.symbol} deposit address...</span>
            </div>
          ) : addressError ? (
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{addressError}</span>
            </div>
          ) : payment ? (
            <div className={`soteria-card p-5 border ${selectedCoin.border} bg-gradient-to-b ${selectedCoin.color} space-y-4`}>
              <div>
                <div className="text-[11px] text-neutral-300 font-semibold uppercase tracking-wider mb-2">
                  Send Any Amount of {selectedCoin.symbol} to:
                </div>
                <div className="flex items-center justify-between gap-3 bg-black/40 p-3.5 rounded-xl border border-white/[0.08]">
                  <div className={`text-xs sm:text-sm font-mono font-semibold ${selectedCoin.text} break-all select-all leading-relaxed`}>
                    {payment.address}
                  </div>
                  <button
                    onClick={() => handleCopy(payment.address)}
                    className="relative p-2.5 rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/[0.1] text-neutral-300 hover:text-white transition-all shrink-0 cursor-pointer"
                    title="Copy Address"
                  >
                    {animAddr ? <CheckmarkAnim size="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-xs text-neutral-400 leading-relaxed">
                Send whatever you want in <strong className="text-white">{selectedCoin.symbol}</strong>. Your loan balance automatically updates as soon as the transaction is confirmed on the blockchain.
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
