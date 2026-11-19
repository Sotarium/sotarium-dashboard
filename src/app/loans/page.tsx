'use client';

import { useState, useEffect } from 'react';
import { Loan } from '@/lib/data';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/loans')
      .then((res) => res.json())
      .then((data) => setLoans(data))
      .catch((err) => console.error(err));
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLoans = loans.filter((loan) =>
    loan.userName.toLowerCase().includes(search.toLowerCase()) ||
    loan.userId.includes(search)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Active Loans Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">Detailed breakdown of player loans, 15% interest accruals, and crypto payback channels.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all w-64"
            />
          </div>
        </div>
      </div>

      {/* Loan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLoans.map((loan) => {
          const percent = Math.min(100, Math.round((loan.repaidAmount / loan.totalDue) * 100));
          return (
            <div
              key={loan.id}
              className="glass-panel rounded-2xl p-6 border border-white/5 relative overflow-hidden transition-all duration-300 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={loan.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                      alt={loan.userName}
                      className="w-12 h-12 rounded-xl border border-white/10 object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-white text-base tracking-tight">{loan.userName}</h3>
                      <p className="text-xs text-slate-500 font-mono">ID: {loan.userId}</p>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    loan.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                  }`}>
                    {loan.status}
                  </span>
                </div>

                {/* Amounts Breakdown */}
                <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-xl bg-white/[0.02] border border-white/5 mb-4 text-center">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">Principal</span>
                    <span className="text-sm font-semibold text-slate-200">${loan.principal}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-cyan-400 font-semibold block">Interest</span>
                    <span className="text-sm font-semibold text-cyan-300">+${loan.interestAmount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Total Due</span>
                    <span className="text-sm font-bold text-white">${loan.totalDue}</span>
                  </div>
                </div>

                {/* Repayment Progress */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium">Progress Repaid</span>
                    <span className="text-cyan-400 font-bold">${loan.repaidAmount} / ${loan.totalDue} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-white/5">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-500 shadow-sm shadow-cyan-400/50"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Payback Address Footer */}
              <div className="pt-4 border-t border-white/5">
                <span className="text-[11px] text-slate-400 font-medium block mb-2">NOWPayments Payback Address:</span>
                {loan.addresses?.sol ? (
                  <button
                    onClick={() => copyToClipboard(loan.addresses.sol!, loan.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-xs text-slate-300 transition-all font-mono"
                  >
                    <span>SOL: {loan.addresses.sol.slice(0, 8)}...{loan.addresses.sol.slice(-6)}</span>
                    {copiedId === loan.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                  </button>
                ) : (
                  <p className="text-xs text-slate-500 italic">No deposit address generated yet.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
