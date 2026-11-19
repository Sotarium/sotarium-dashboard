'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Send, Clock, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';

interface LoanRequest {
  id: string;
  amount: number;
  crypto_currency: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function AskLoanPage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [cryptoCurrency, setCryptoCurrency] = useState('SOL');
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
          cryptoCurrency,
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Principal Amount ($ USD)</label>
              <input
                type="number"
                min="10"
                step="any"
                placeholder="e.g. 100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl bg-[#171717] border border-white/[0.06] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Payout Cryptocurrency</label>
              <select
                value={cryptoCurrency}
                onChange={(e) => setCryptoCurrency(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#171717] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-neutral-400 transition-colors"
              >
                <option value="SOL">Solana (SOL)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="LTC">Litecoin (LTC)</option>
              </select>
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
                    <td className="py-3 px-3 text-xs text-neutral-400 font-mono">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      ${req.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-xs text-neutral-300 font-mono">
                      {req.crypto_currency}
                    </td>
                    <td className="py-3 px-3 text-xs font-semibold text-white">
                      ${(req.amount * 1.15).toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        req.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : req.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
