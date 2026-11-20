'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Send, Clock, CheckCircle2, XCircle, ChevronDown, Check } from 'lucide-react';

interface LoanRequest {
  id: string;
  amount: number;
  crypto_currency: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const CRYPTO_OPTIONS = [
  {
    symbol: 'SOL',
    name: 'Solana',
    iconUrl: '/assets/sol.svg',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    iconUrl: '/assets/eth.svg',
    badge: 'ERC-20'
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    iconUrl: '/assets/ltc.svg',
  }
];

export default function AskLoanPage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_OPTIONS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/loan-requests?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setRequests(data);
        })
        .catch((err) => console.error(err));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !user) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/loan-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.username,
          amount: parseFloat(amount),
          cryptoCurrency: selectedCrypto.symbol,
          reason,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setRequests((prev) => [created, ...prev]);
        setAmount('');
        setReason('');
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Ask Loan</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Submit a cryptocurrency loan request for review and approval.
        </p>
      </div>

      {/* Main Request Form */}
      <div className="soteria-card p-6 md:p-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white">Loan Application</h2>
          <p className="text-xs text-neutral-400">Fixed 15% interest applies to all standard loan approvals.</p>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Your loan request has been submitted successfully to the administrators.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Amount Input with clean styling & no default spinners */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Principal Amount ($ USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold text-sm">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setAmount(val);
                  }}
                  required
                  className="w-full pl-8 pr-4 py-3 rounded-2xl bg-[#171717] border border-white/[0.08] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Custom High-End Crypto Payout Selector */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-semibold text-neutral-300">Payout Cryptocurrency</label>
              
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#171717] border border-white/[0.08] hover:border-white/20 text-sm text-white flex items-center justify-between cursor-pointer transition-all select-none shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedCrypto.iconUrl}
                    alt={selectedCrypto.name}
                    className="w-7 h-7 rounded-full shrink-0"
                  />
                  <div className="text-left">
                    <div className="font-semibold text-xs text-white leading-tight">
                      {selectedCrypto.name} <span className="text-neutral-400 font-mono">({selectedCrypto.symbol})</span>
                    </div>
                    {selectedCrypto.badge && (
                      <div className="text-[10px] text-neutral-400 leading-tight">
                        {selectedCrypto.badge}
                      </div>
                    )}
                  </div>
                </div>

                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-white' : ''}`} />
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-2 bg-[#171717] border border-white/[0.1] rounded-2xl p-1.5 shadow-2xl z-50 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    {CRYPTO_OPTIONS.map((crypto) => (
                      <div
                        key={crypto.symbol}
                        onClick={() => {
                          setSelectedCrypto(crypto);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                          selectedCrypto.symbol === crypto.symbol
                            ? 'bg-white/10 text-white'
                            : 'hover:bg-white/[0.05] text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={crypto.iconUrl}
                            alt={crypto.name}
                            className="w-7 h-7 rounded-full shrink-0"
                          />
                          <div className="text-left">
                            <div className="text-xs font-semibold text-white">
                              {crypto.name} <span className="text-neutral-400 font-mono">({crypto.symbol})</span>
                            </div>
                            {crypto.badge && (
                              <div className="text-[10px] text-neutral-400">
                                {crypto.badge}
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedCrypto.symbol === crypto.symbol && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">Reason / Discord Ticket Link (Optional)</label>
            <textarea
              rows={3}
              placeholder="State the purpose of the loan or your Discord ticket link..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#171717] border border-white/[0.06] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-neutral-400">
              {amount && !isNaN(parseFloat(amount)) ? (
                <span>Total repayment (+15%): <strong className="text-white">${(parseFloat(amount) * 1.15).toFixed(2)}</strong></span>
              ) : (
                <span>15% flat interest calculation</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* User's Request History */}
      <div className="soteria-card p-6 space-y-4">
        <h3 className="text-base font-semibold text-white">Your Requests</h3>

        {requests.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-xs">
            No previous loan applications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs font-medium text-neutral-400">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Coin</th>
                  <th className="pb-3 px-3">Total Due (+15%)</th>
                  <th className="pb-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-3 text-xs text-neutral-400 font-sans">
                      {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-white font-sans">
                      ${req.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-xs font-semibold text-white font-sans">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={`/assets/${req.crypto_currency.toLowerCase()}.svg`} 
                          alt={req.crypto_currency} 
                          className="w-4 h-4 rounded-full shrink-0" 
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                        <span>{req.crypto_currency}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs font-semibold text-white">
                      ${(req.amount * 1.15).toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        req.status === 'approved'
                          ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/50 shadow-[0_0_8px_rgba(0,230,118,0.2)]'
                          : req.status === 'rejected'
                          ? 'bg-[#FF1744]/20 text-[#FF2D55] border border-[#FF1744]/50 shadow-[0_0_8px_rgba(255,23,68,0.2)]'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {req.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        {req.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {req.status === 'pending' && <Clock className="w-3 h-3" />}
                        <span className="capitalize">{req.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
