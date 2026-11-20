'use client';

import { useState, useEffect } from 'react';
import { Loan } from '@/lib/data';
import { Search, Lock, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

function TimeLeftCell({ dueDate, loanDate, status }: { dueDate: string; loanDate: string; status: string }) {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (status === 'completed') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        Paid
      </span>
    );
  }

  let dueTimestamp = 0;
  if (dueDate) {
    const parsed = new Date(dueDate);
    if (!isNaN(parsed.getTime())) {
      if (!dueDate.includes(':')) {
        parsed.setHours(23, 59, 59, 999);
      }
      dueTimestamp = parsed.getTime();
    }
  }

  if (!dueTimestamp) {
    const loanTs = loanDate ? new Date(loanDate).getTime() : 0;
    dueTimestamp = loanTs && !isNaN(loanTs) ? loanTs + 48 * 60 * 60 * 1000 : now + 24 * 60 * 60 * 1000;
  }

  const diff = dueTimestamp - now;

  if (diff <= 0) {
    const overdueMs = Math.abs(diff);
    const d = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
    const h = Math.floor((overdueMs / (1000 * 60 * 60)) % 24);
    const m = Math.floor((overdueMs / (1000 * 60)) % 60);
    const s = Math.floor((overdueMs / 1000) % 60);
    const timeStr = d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`;

    return (
      <span className="text-xs font-semibold font-sans text-red-400" title={`Overdue by ${timeStr}`}>
        Overdue ({timeStr})
      </span>
    );
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  let countdownText = '';
  if (days > 0) {
    countdownText = `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  } else {
    countdownText = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }

  const isUrgent = diff < 6 * 60 * 60 * 1000;
  const isWarning = diff < 24 * 60 * 60 * 1000;

  return (
    <span className={`text-xs font-semibold font-sans tracking-tight ${
      isUrgent ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-neutral-200'
    }`}>
      {countdownText}
    </span>
  );
}

export default function LoansPage() {
  const { user, isOwner, isLoaded } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [search, setSearch] = useState('');
  const [discordAvatars, setDiscordAvatars] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/loans')
      .then((res) => res.json())
      .then((data) => {
        setLoans(data);
        // Fetch real Discord avatars for each borrower
        data.forEach((loan: Loan) => {
          if (loan.userId) {
            fetch(`/api/discord-user?userId=${loan.userId}`)
              .then((r) => r.json())
              .then((u) => {
                if (u?.avatarUrl) {
                  setDiscordAvatars((prev) => ({ ...prev, [loan.userId]: u.avatarUrl }));
                }
              })
              .catch(() => {});
          }
        });
      })
      .catch((err) => console.error(err));
  }, []);

  const handleDeleteLoan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this loan?')) return;
    setLoans((prev) => prev.filter((l) => l.id !== id));
    try {
      await fetch(`/api/loans?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  // Guard while auth state is loading
  if (!isLoaded) {
    return (
      <div className="space-y-6 animate-pulse max-w-6xl">
        <div className="h-10 w-48 bg-white/[0.04] rounded-xl" />
        <div className="soteria-card p-6 h-96 bg-white/[0.02]" />
      </div>
    );
  }

  // Restrict to owner
  if (!isOwner) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-white/[0.08] flex items-center justify-center text-amber-400">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h2>
          <p className="text-sm text-neutral-400 max-w-md mt-1">
            The Loans directory is restricted to owner.
          </p>
        </div>
      </div>
    );
  }

  const filteredLoans = loans.filter((loan) =>
    loan.userName.toLowerCase().includes(search.toLowerCase()) ||
    loan.userId.includes(search)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Loans</h1>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="soteria-card p-6 space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search loans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#171717] border border-white/[0.06] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors"
            />
          </div>

          <div className="text-xs text-neutral-400">
            Showing <span className="font-semibold text-white">{filteredLoans.length}</span> records
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs font-medium text-neutral-400">
                <th className="pb-3 px-3">Borrower</th>
                <th className="pb-3 px-3">Principal</th>
                <th className="pb-3 px-3">Interest (15%)</th>
                <th className="pb-3 px-3">Total Due</th>
                <th className="pb-3 px-3">Repaid / Progress</th>
                <th className="pb-3 px-3">Time Left</th>
                <th className="pb-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredLoans.map((loan) => {
                const interest = loan.principal * 0.15;
                const totalDue = loan.principal + interest;
                const progress = Math.min(Math.round((loan.repaidAmount / totalDue) * 100), 100);
                const userAvatar = discordAvatars[loan.userId] || loan.userAvatar || 'https://cdn.discordapp.com/avatars/1079074717799030824/64db63e7b0bcbe6b841ba40535473949.png?size=128';

                return (
                  <tr key={loan.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Borrower Column with Real Discord Avatar */}
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={userAvatar}
                          alt={loan.userName}
                          className="w-8 h-8 rounded-full border border-white/10 shadow-sm object-cover bg-neutral-800"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                        />
                        <div className="font-semibold text-white text-sm">
                          {loan.userName}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-3 font-medium text-white">
                      ${loan.principal.toFixed(2)}
                    </td>

                    <td className="py-4 px-3 text-neutral-400">
                      ${interest.toFixed(2)}
                    </td>

                    <td className="py-4 px-3 font-semibold text-white">
                      ${totalDue.toFixed(2)}
                    </td>

                    {/* Progress Bar & Amount */}
                    <td className="py-4 px-3">
                      <div className="space-y-1.5 w-44">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-white">${loan.repaidAmount.toFixed(2)}</span>
                          <span className="text-neutral-400">{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white transition-all duration-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Time Left Live Countdown */}
                    <td className="py-4 px-3">
                      <TimeLeftCell dueDate={loan.dueDate} loanDate={loan.loanDate} status={loan.status} />
                    </td>

                    <td className="py-4 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {loan.status === 'completed' ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-neutral-900 text-neutral-300 border border-white/[0.08]">
                            Paid
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white text-black">
                            Active
                          </span>
                        )}

                        <button
                          onClick={() => handleDeleteLoan(loan.id)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-500 hover:text-red-400 transition-colors"
                          title="Delete loan record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
