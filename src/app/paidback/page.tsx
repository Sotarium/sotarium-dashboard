'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getInterest, getTotalDue } from '@/lib/interest';

interface PaidLoan {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  principal: number;
  interestRate: number;
  interestAmount: number;
  totalDue: number;
  repaidAmount: number;
  status: 'active' | 'completed' | 'overdue';
  loanDate: string;
  dueDate: string;
  reason: string;
  notes: string;
  cryptoCurrency: string;
}

export default function PaidbackPage() {
  const { user, isAdmin, isLoaded } = useAuth();
  const [loans, setLoans] = useState<PaidLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPaidLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/loans');
      if (res.ok) {
        const data: PaidLoan[] = await res.json();
        // Only show paid back loans
        setLoans(data.filter((l) => l.status === 'completed' || l.repaidAmount >= l.totalDue));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaidLoans();
  }, [fetchPaidLoans]);

  const handleDelete = async (id: string) => {
    setLoans((prev) => prev.filter((l) => l.id !== id));
    try {
      await fetch(`/api/loan-requests?id=${id}&requesterId=${user?.id || ''}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
      fetchPaidLoans();
    }
  };

  if (!isLoaded) {
    return (
      <div className="space-y-6 animate-pulse max-w-6xl">
        <div className="h-10 w-48 bg-white/[0.04] rounded-xl" />
        <div className="soteria-card p-6 h-96 bg-white/[0.02]" />
      </div>
    );
  }

  const filtered = loans.filter((l) =>
    l.userName.toLowerCase().includes(search.toLowerCase()) ||
    l.userId.includes(search) ||
    (l.reason && l.reason.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl">
      {/* Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Paid Back</h1>
          <p className="text-sm text-neutral-500 mt-1">Completed and settled loans.</p>
        </div>
        <div className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-neutral-300">
          {filtered.length} settled loan{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Search + Table Card */}
      <div className="soteria-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search borrower..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171717] border border-white/[0.06] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-neutral-500 text-xs">Loading paid back loans...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-neutral-500 text-xs">
            {loans.length === 0 ? 'No paid back loans yet.' : 'No loans match your search.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header */}
              <div className={`grid ${isAdmin ? 'grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr_auto]' : 'grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr]'} gap-x-3 px-3 pb-3 border-b border-white/[0.06] text-xs font-medium text-neutral-400`}>
                <div className="text-neutral-400">Borrower</div>
                <div className="text-neutral-400">Borrowed</div>
                <div className="text-neutral-400">Interest</div>
                <div className="text-neutral-400">Total Due</div>
                <div className="text-neutral-400 text-center">Status</div>
                <div className="text-neutral-400 text-center">Paid Back</div>
                {isAdmin && <div className="text-neutral-400 text-right w-16">Actions</div>}
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/[0.04]">
                {filtered.map((loan) => {
                  const interest = getInterest(loan.principal);
                  const totalDue = getTotalDue(loan.principal);

                  return (
                    <div
                      key={loan.id}
                      className={`grid ${isAdmin ? 'grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr_auto]' : 'grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr]'} gap-x-3 px-3 py-4 items-center hover:bg-white/[0.02] transition-colors`}
                    >
                      {/* Borrower */}
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={loan.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                          alt={loan.userName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full border border-white/10 shadow-sm object-cover bg-neutral-800 shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                        />
                        <div className="font-semibold text-white text-sm truncate">{loan.userName}</div>
                      </div>

                      {/* Borrowed */}
                      <div className="font-medium text-white text-sm">${loan.principal.toFixed(2)}</div>

                      {/* Interest */}
                      <div className="text-neutral-400 text-sm">${interest.toFixed(2)}</div>

                      {/* Total Due */}
                      <div className="font-semibold text-white text-sm">${totalDue.toFixed(2)}</div>

                      {/* Status */}
                      <div className="flex justify-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Paid
                        </span>
                      </div>

                      {/* 100% Progress Bar */}
                      <div className="flex items-center justify-center">
                        <div className="relative w-full max-w-[140px] h-6 rounded-full bg-[#00E823] overflow-hidden flex items-center justify-center shadow-[0_0_12px_rgba(0,232,35,0.2)]">
                          <span className="text-[11px] font-black text-black tracking-tight">
                            100%
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-2 w-16">
                          <button
                            onClick={() => handleDelete(loan.id)}
                            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
