'use client';

import { useState, useEffect } from 'react';
import { Loan } from '@/lib/data';
import { Check, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function RoadmapPage() {
  const { user, isOwner } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);

  useEffect(() => {
    fetch('/api/loans')
      .then((res) => res.json())
      .then((data) => setLoans(data))
      .catch((err) => console.error(err));
  }, []);

  const toggleCheckmark = async (loan: Loan) => {
    const newStatus = loan.status === 'completed' ? 'active' : 'completed';
    const newRepaid = newStatus === 'completed' ? loan.totalDue : 0;

    const res = await fetch('/api/loans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: loan.id,
        updates: {
          status: newStatus,
          repaidAmount: newRepaid,
          completedAt: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
        }
      })
    });

    if (res.ok) {
      setLoans((prev) =>
        prev.map((l) =>
          l.id === loan.id
            ? { ...l, status: newStatus, repaidAmount: newRepaid }
            : l
        )
      );
    }
  };

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
            The Roadmap checklist is restricted to owner.
          </p>
        </div>
      </div>
    );
  }

  const completed = loans.filter((l) => l.status === 'completed');
  const active = loans.filter((l) => l.status === 'active');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Roadmap</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Check off borrowers who have paid back.
          </p>
        </div>

        <div className="px-4 py-1.5 rounded-full bg-neutral-900 border border-white/[0.08] text-xs font-medium text-neutral-300">
          <span className="text-white font-semibold">{completed.length}</span> of {loans.length} settled
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Repayments */}
        <div className="soteria-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <h3 className="text-base font-semibold text-white">Active Debtors</h3>
              <span className="text-xs text-neutral-500">Click to mark settled</span>
            </div>

            <div className="space-y-2.5">
              {active.length === 0 ? (
                <div className="py-12 text-center text-sm text-neutral-500">
                  No active loans pending.
                </div>
              ) : (
                active.map((loan) => (
                  <div
                    key={loan.id}
                    onClick={() => toggleCheckmark(loan)}
                    className="p-4 rounded-xl bg-[#171717] hover:bg-[#1f1f1f] border border-white/[0.04] transition-all cursor-pointer flex items-center justify-between group select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-md border border-neutral-600 group-hover:border-white transition-colors flex items-center justify-center">
                        {/* Empty box */}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{loan.userName}</div>
                        <div className="text-xs text-neutral-400">
                          Total Due: <span className="text-white font-semibold">${loan.totalDue}</span> (15% int.)
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-neutral-500 font-mono">
                      Due: {loan.dueDate}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Settled / Milestones */}
        <div className="soteria-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <h3 className="text-base font-semibold text-white">Completed Milestones</h3>
              <span className="text-xs text-neutral-400 font-medium">100% Repaid</span>
            </div>

            <div className="space-y-2.5">
              {completed.length === 0 ? (
                <div className="py-12 text-center text-sm text-neutral-500">
                  No settled loans yet.
                </div>
              ) : (
                completed.map((loan) => (
                  <div
                    key={loan.id}
                    onClick={() => toggleCheckmark(loan)}
                    className="p-4 rounded-xl bg-[#171717]/60 hover:bg-[#1a1a1a] border border-white/[0.04] transition-all cursor-pointer flex items-center justify-between group select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-md bg-white text-black flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-neutral-400 line-through">{loan.userName}</div>
                        <div className="text-xs text-neutral-500">
                          Repaid ${loan.totalDue} in full
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-neutral-500 font-mono">
                      {loan.completedAt || 'Settled'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
