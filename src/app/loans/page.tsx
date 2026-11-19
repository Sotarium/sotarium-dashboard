'use client';

import { useState, useEffect } from 'react';
import { Loan } from '@/lib/data';
import { Search, Copy, Check, Lock, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function LoansPage() {
  const { user, isOwner } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [search, setSearch] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/loans')
      .then((res) => res.json())
      .then((data) => setLoans(data))
      .catch((err) => console.error(err));
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
      {/* Title Header with Action Button - Cleaned banner and subtitle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Loans</h1>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-5 py-2 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors shadow-sm">
            Issue new loan
          </button>
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
                <th className="pb-3 px-3">Deposit Address</th>
                <th className="pb-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredLoans.map((loan) => {
                const percent = Math.min(100, Math.round((loan.repaidAmount / loan.totalDue) * 100));
                return (
                  <tr key={loan.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Borrower row: only username */}
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={loan.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                          alt={loan.userName}
                          className="w-8 h-8 rounded-full border border-white/[0.08]"
                        />
                        <span className="font-medium text-white">{loan.userName}</span>
                      </div>
                    </td>

                    <td className="py-4 px-3 text-neutral-300 font-medium">
                      ${loan.principal.toFixed(2)}
                    </td>

                    <td className="py-4 px-3 text-neutral-300 font-medium">
                      +${loan.interestAmount.toFixed(2)}
                    </td>

                    <td className="py-4 px-3 font-semibold text-white">
                      ${loan.totalDue.toFixed(2)}
                    </td>

                    <td className="py-4 px-3 min-w-[180px]">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-400">${loan.repaidAmount}</span>
                        <span className="text-neutral-300 font-medium">{percent}%</span>
                      </div>
                      <div className="w-full bg-[#1e1e1e] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-white h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>

                    {/* Deposit Address Button opening Activity Detail Modal */}
                    <td className="py-4 px-3">
                      <button
                        onClick={() => setSelectedLoan(loan)}
                        className="px-3 py-1.5 rounded-lg bg-[#181818] hover:bg-[#222222] border border-white/[0.06] hover:border-white/20 text-xs font-semibold text-neutral-200 transition-all flex items-center gap-1.5"
                      >
                        <span>Deposit Addresses</span>
                        <span className="text-[10px] text-neutral-400 font-normal">(SOL/ETH/LTC)</span>
                      </button>
                    </td>

                    <td className="py-4 px-3">
                      {loan.status === 'completed' ? (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-neutral-900 text-neutral-300 border border-white/[0.08]">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white text-black">
                          Active
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

      {/* Activity Detail / Deposit Address Modal Overlay (Soteria Exact Look) */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#121212] border border-white/[0.08] rounded-3xl p-6 shadow-2xl relative space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-neutral-400 uppercase">
                ACTIVITY DETAIL
              </span>
              <button
                onClick={() => setSelectedLoan(null)}
                className="w-7 h-7 rounded-full bg-neutral-800/80 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile Badge */}
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedLoan.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                alt={selectedLoan.userName}
                className="w-16 h-16 rounded-full border-2 border-white/10 shadow-lg object-cover"
              />
              <h3 className="text-lg font-bold text-white tracking-tight">{selectedLoan.userName}</h3>
            </div>

            {/* Metadata Card (Server, Watcher, Time) */}
            <div className="p-4 rounded-2xl bg-[#171717] border border-white/[0.04] space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 font-medium">Server:</span>
                <span className="font-mono text-white">1454106247056982130</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 font-medium">Watcher:</span>
                <span className="text-white font-medium">Loan Repayment Watcher</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 font-medium">Time:</span>
                <span className="text-neutral-300 font-mono">{selectedLoan.dueDate}</span>
              </div>
            </div>

            {/* Live Crypto Payback Addresses */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Crypto Payback Addresses
              </span>

              {/* SOL Address */}
              <div className="p-3 rounded-xl bg-[#171717] border border-white/[0.04] flex items-center justify-between gap-3">
                <div className="overflow-hidden">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase block">SOLANA (SOL)</span>
                  <span className="text-xs font-mono text-neutral-300 truncate block">
                    {selectedLoan.addresses?.sol || 'Generating...'}
                  </span>
                </div>
                {selectedLoan.addresses?.sol && (
                  <button
                    onClick={() => copyToClipboard(selectedLoan.addresses.sol!, 'sol')}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-white shrink-0 font-medium transition-colors flex items-center gap-1.5"
                  >
                    {copiedKey === 'sol' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* ETH Address */}
              <div className="p-3 rounded-xl bg-[#171717] border border-white/[0.04] flex items-center justify-between gap-3">
                <div className="overflow-hidden">
                  <span className="text-[10px] text-blue-400 font-bold uppercase block">ETHEREUM (ETH)</span>
                  <span className="text-xs font-mono text-neutral-300 truncate block">
                    {selectedLoan.addresses?.eth || 'Generating...'}
                  </span>
                </div>
                {selectedLoan.addresses?.eth && (
                  <button
                    onClick={() => copyToClipboard(selectedLoan.addresses.eth!, 'eth')}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-white shrink-0 font-medium transition-colors flex items-center gap-1.5"
                  >
                    {copiedKey === 'eth' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* LTC Address */}
              <div className="p-3 rounded-xl bg-[#171717] border border-white/[0.04] flex items-center justify-between gap-3">
                <div className="overflow-hidden">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">LITECOIN (LTC)</span>
                  <span className="text-xs font-mono text-neutral-300 truncate block">
                    {selectedLoan.addresses?.ltc || 'Generating...'}
                  </span>
                </div>
                {selectedLoan.addresses?.ltc && (
                  <button
                    onClick={() => copyToClipboard(selectedLoan.addresses.ltc!, 'ltc')}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-white shrink-0 font-medium transition-colors flex items-center gap-1.5"
                  >
                    {copiedKey === 'ltc' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setSelectedLoan(null)}
                className="py-3 rounded-2xl bg-[#181818] hover:bg-[#202020] text-sm font-semibold text-white border border-white/[0.06] transition-colors"
              >
                Close
              </button>
              <a
                href={selectedLoan.ticketChannelId ? `https://discord.com/channels/1454106247056982130/${selectedLoan.ticketChannelId}` : "https://discord.com"}
                target="_blank"
                rel="noreferrer"
                className="py-3 rounded-2xl bg-white hover:bg-neutral-200 text-sm font-bold text-black transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Jump in Discord</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
