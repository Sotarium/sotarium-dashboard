'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { CheckCircle2, Loader2, Search, RefreshCw } from 'lucide-react';

interface LoanRecord {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  principal: number;
  totalDue: number;
  cryptoCurrency: string;
  status: string;
  createdAt: string;
  paidAt?: string;
}

export default function PaybackPage() {
  const { isAdmin } = useAuth();
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPaid = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/roadmap?mode=completed');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLoans(
            data.map((item) => ({
              id: item.id,
              userId: item.user_id,
              userName: item.user_name,
              userAvatar: item.user_avatar,
              principal: item.amount,
              totalDue: item.total_due,
              cryptoCurrency: item.crypto_currency,
              status: item.status,
              createdAt: item.created_at,
            }))
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaid();
  }, []);

  const filtered = loans.filter((l) =>
    l.userName.toLowerCase().includes(search.toLowerCase()) ||
    l.userId.includes(search)
  );

  const totalRepaid = loans.reduce((acc, l) => acc + (l.totalDue || l.principal * 1.15), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Payback</h1>
          <p className="text-sm text-neutral-500 mt-1">Completed & repaid loans</p>
        </div>
        <button
          onClick={fetchPaid}
          disabled={loading}
          className="px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="soteria-card p-5">
          <div className="text-xs text-neutral-400 font-medium mb-1.5">Total Paid Back</div>
          <div className="text-2xl font-bold text-emerald-400 font-sans">
            ${totalRepaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Principal + 15% interest</div>
        </div>
        <div className="soteria-card p-5">
          <div className="text-xs text-neutral-400 font-medium mb-1.5">Repaid Loans</div>
          <div className="text-2xl font-bold text-white font-sans">{loans.length}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Completed repayments</div>
        </div>
        <div className="soteria-card p-5">
          <div className="text-xs text-neutral-400 font-medium mb-1.5">Avg. Repayment</div>
          <div className="text-2xl font-bold text-white font-sans">
            ${loans.length > 0 ? (totalRepaid / loans.length).toFixed(2) : '0.00'}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Per loan</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="soteria-card p-6 space-y-4">
        <div className="relative max-w-xs">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search borrower..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171717] border border-white/[0.06] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all"
          />
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center gap-3 text-neutral-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Loading payback records...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-neutral-500 text-xs">
            {loans.length === 0 ? 'No repaid loans yet.' : 'No results match your search.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs font-medium text-neutral-400">
                  <th className="pb-3 px-3">Borrower</th>
                  <th className="pb-3 px-3">Principal</th>
                  <th className="pb-3 px-3">Total Paid (+15%)</th>
                  <th className="pb-3 px-3">Coin</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((loan) => (
                  <tr key={loan.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={loan.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                          alt={loan.userName}
                          className="w-7 h-7 rounded-full border border-white/10 object-cover bg-neutral-800 shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                        />
                        <span className="font-semibold text-white text-xs">{loan.userName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-white text-xs">${loan.principal.toFixed(2)}</td>
                    <td className="py-3.5 px-3 font-semibold text-emerald-400 text-xs">${loan.totalDue.toFixed(2)}</td>
                    <td className="py-3.5 px-3 text-xs font-semibold text-neutral-300">{loan.cryptoCurrency}</td>
                    <td className="py-3.5 px-3 text-xs text-neutral-400">
                      {new Date(loan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Paid
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
