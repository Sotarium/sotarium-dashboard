'use client';

import { useState, useEffect } from 'react';
import { Loan } from '@/lib/data';
import { 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  Clock, 
  Trophy, 
  Calendar, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function RoadmapPage() {
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

  const completed = loans.filter((l) => l.status === 'completed');
  const active = loans.filter((l) => l.status === 'active');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> Milestone Tracking
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Roadmap & Repayment Checklist</h1>
          <p className="text-sm text-slate-400 mt-1">
            Click any checkbox to mark a borrower as repaid. Progress immediately recalculates.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-xl glass-panel text-xs text-slate-300 border border-white/10 flex items-center gap-2">
            <span className="font-bold text-emerald-400">{completed.length}</span> / {loans.length} Settled
          </div>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Repayment List */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-white text-base">Pending Repayments ({active.length})</h2>
            </div>
            <span className="text-xs text-slate-500">Click box to settle</span>
          </div>

          <div className="space-y-3">
            {active.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No outstanding loans! All borrowers have settled.</p>
            ) : (
              active.map((loan) => (
                <div
                  key={loan.id}
                  onClick={() => toggleCheckmark(loan)}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <button className="text-slate-500 group-hover:text-cyan-400 transition-colors">
                      <Square className="w-5 h-5" />
                    </button>
                    <div>
                      <div className="font-semibold text-white text-sm group-hover:text-cyan-300 transition-colors">
                        {loan.userName}
                      </div>
                      <div className="text-xs text-slate-400">
                        Owes <span className="text-white font-bold">${loan.totalDue}</span> (Principal: ${loan.principal} + ${loan.interestAmount})
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono text-cyan-400">Due {loan.dueDate}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Milestones List */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-white text-base">Completed Milestones ({completed.length})</h2>
            </div>
            <span className="text-xs text-emerald-400 font-semibold">100% Repaid</span>
          </div>

          <div className="space-y-3">
            {completed.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No completed milestones yet.</p>
            ) : (
              completed.map((loan) => (
                <div
                  key={loan.id}
                  onClick={() => toggleCheckmark(loan)}
                  className="p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <button className="text-emerald-400">
                      <CheckSquare className="w-5 h-5" />
                    </button>
                    <div>
                      <div className="font-semibold text-slate-200 line-through text-sm">
                        {loan.userName}
                      </div>
                      <div className="text-xs text-emerald-400/80 font-medium">
                        Repaid ${loan.totalDue} in full
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-mono">
                      Settled: {loan.completedAt || 'Recently'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
