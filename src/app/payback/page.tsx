'use client';

import { useState } from 'react';
import { Copy, Check, Loader2, ChevronRight } from 'lucide-react';

const COINS = [
  {
    symbol: 'SOL',
    name: 'Solana',
    address: 'FtE4jhje3TCzRiTuxCejxu9QVJqXdkDnmW25mcvPCqj8',
    icon: '/assets/sol.svg',
    color: 'from-purple-500/20 to-purple-600/5',
    border: 'border-purple-500/30',
    ring: 'ring-purple-500/30',
    text: 'text-purple-300',
    dot: 'bg-purple-400',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x5E332519f26987709214F60e50AC69793ef5B72E',
    icon: '/assets/eth.svg',
    color: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/30',
    ring: 'ring-blue-500/30',
    text: 'text-blue-300',
    dot: 'bg-blue-400',
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    address: 'LedANhtpWzfX8Ug35mMQfthfe5ofDW5eMs',
    icon: '/assets/ltc.svg',
    color: 'from-neutral-500/20 to-neutral-600/5',
    border: 'border-neutral-500/30',
    ring: 'ring-neutral-500/30',
    text: 'text-neutral-300',
    dot: 'bg-neutral-400',
  },
];

export default function PaybackPage() {
  const [selectedCoin, setSelectedCoin] = useState<typeof COINS[0] | null>(null);
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaidNotify = async () => {
    if (!selectedCoin || !amount) return;
    setSubmitting(true);
    try {
      // Post a support message / notification for admin
      await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Payback Submitted',
          message: `Payment of $${amount} USD sent via ${selectedCoin.symbol} (${selectedCoin.address})`,
        }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      // Still show success even if notification fails
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Payback</h1>
        </div>
        <div className="soteria-card p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-white font-semibold">Payment Notified ✓</div>
          <p className="text-neutral-500 text-xs max-w-xs mx-auto">
            Your ${amount} {selectedCoin?.symbol} payment has been submitted. Admin will verify and update your balance.
          </p>
          <button
            onClick={() => { setSubmitted(false); setAmount(''); setSelectedCoin(null); }}
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
      {/* Header — no subtitle */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Payback</h1>
      </div>

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
                onClick={() => setSelectedCoin(coin)}
                className={`flex flex-col items-center gap-2.5 p-5 rounded-2xl border transition-all cursor-pointer bg-gradient-to-b ${coin.color} ${
                  active
                    ? `${coin.border} ring-1 ring-inset ${coin.ring}`
                    : 'border-white/[0.06] hover:border-white/20'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coin.icon}
                  alt={coin.name}
                  className="w-9 h-9 rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
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

      {/* Step 2 — Enter amount */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest px-1">
          2 · How much are you sending? (USD)
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold text-sm">$</span>
          <input
            type="number"
            min={0.01}
            step={0.01}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-8 pr-4 py-3.5 rounded-2xl bg-[#171717] border border-white/[0.06] text-white text-lg font-bold focus:outline-none focus:border-white/30 transition-all placeholder-neutral-600"
          />
        </div>
        <p className="text-[11px] text-neutral-500 px-1">
          You can pay any amount — partial payments are accepted.
        </p>
      </div>

      {/* Step 3 — Wallet address */}
      {selectedCoin && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest px-1">
            3 · Send to this {selectedCoin.symbol} address
          </div>
          <div className={`soteria-card p-4 border ${selectedCoin.border} bg-gradient-to-b ${selectedCoin.color}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] text-neutral-300 font-semibold uppercase tracking-widest mb-1.5">{selectedCoin.name} Address</div>
                <div className={`text-xs font-mono font-semibold ${selectedCoin.text} break-all leading-relaxed`}>
                  {selectedCoin.address}
                </div>
              </div>
              <button
                onClick={() => handleCopy(selectedCoin.address)}
                className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-neutral-400 hover:text-white transition-all shrink-0 cursor-pointer"
                title="Copy address"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Step 4 — Notify */}
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest px-1 pt-2">
            4 · After sending, notify us
          </div>
          <button
            onClick={handlePaidNotify}
            disabled={submitting || !amount || parseFloat(amount) <= 0}
            className="w-full py-3.5 rounded-2xl bg-white hover:bg-neutral-100 text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                I&apos;ve Sent ${amount || '0.00'} in {selectedCoin.symbol}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-[11px] text-neutral-500 text-center px-4">
            Admin will verify your transaction and update your loan balance.
          </p>
        </div>
      )}
    </div>
  );
}

