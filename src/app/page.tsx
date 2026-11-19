'use client';

import { useState, useEffect } from 'react';
import { Loan } from '@/lib/data';
import { 
  Users, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Copy, 
  Check, 
  Sparkles
} from 'lucide-react';

export default function OverviewPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/loans')
      .then((res) => res.json())
      .then((data) => setLoans(data))
      .catch((err) => console.error(err));
  }, []);

  const totalPrincipal = loans.reduce((acc, l) => acc + l.principal, 0);
  const totalRepaid = loans.reduce((acc, l) => acc + l.repaidAmount, 0);
  const totalOutstanding = loans.reduce((acc, l) => acc + (l.totalDue - l.repaidAmount), 0);
  const activeCount = loans.filter((l) => l.status === 'active').length;
  const completedCount = loans.filter((l) => l.status === 'completed').length;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Live Liquidity Vault
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">System Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time loan issuance, active borrower balances, and crypto repayments.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl glass-panel text-xs text-slate-300 flex items-center gap-2 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Auto-Sync Online</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:border-cyan-500/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Borrowers</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{activeCount}</div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">{completedCount} loans</span> fully settled
          </p>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:border-cyan-500/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Disbursed</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">${totalPrincipal.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Principal loaned out</p>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:border-cyan-500/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Repaid</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-400 tracking-tight">${totalRepaid.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Recorded repayments</p>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:border-cyan-500/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Outstanding Balance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">${totalOutstanding.toLocaleString()}</div>
          <p className="text-xs text-cyan-400 mt-1 font-medium">Includes 15% interest</p>
        </div>
      </div>

      {/* Active Borrowers Matrix */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Active Repayment Trackers</h2>
            <p className="text-xs text-slate-400 mt-0.5">Players currently carrying open debt with automated progress tracking.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/5 font-semibold">
              <tr>
                <th className="py-4 px-6">Borrower</th>
                <th className="py-4 px-6">Principal</th>
                <th className="py-4 px-6">Interest (15%)</th>
                <th className="py-4 px-6">Total Due</th>
                <th className="py-4 px-6">Repaid / Progress</th>
                <th className="py-4 px-6">Crypto Deposit</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loans.map((loan) => {
                const percent = Math.min(100, Math.round((loan.repaidAmount / loan.totalDue) * 100));
                return (
                  <tr key={loan.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={loan.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                          alt={loan.userName}
                          className="w-10 h-10 rounded-xl border border-white/10 object-cover"
                        />
                        <div>
                          <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                            {loan.userName}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">ID: {loan.userId}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-medium text-slate-300">
                      ${loan.principal.toFixed(2)}
                    </td>

                    <td className="py-4 px-6 font-medium text-cyan-400">
                      +${loan.interestAmount.toFixed(2)}
                    </td>

                    <td className="py-4 px-6 font-bold text-white">
                      ${loan.totalDue.toFixed(2)}
                    </td>

                    <td className="py-4 px-6 min-w-[200px]">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-emerald-400 font-medium">${loan.repaidAmount.toFixed(2)}</span>
                        <span className="text-slate-400">{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/5">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {loan.addresses?.sol ? (
                        <button
                          onClick={() => copyToClipboard(loan.addresses.sol!, loan.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-xs text-slate-300 transition-all font-mono"
                        >
                          {copiedId === loan.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied SOL</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{loan.addresses.sol.slice(0, 4)}...{loan.addresses.sol.slice(-4)}</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">None</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      {loan.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <Clock className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
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
