'use client';

import { useState, useEffect } from 'react';
import { Loan } from '@/lib/data';
import { Search, Copy, Check, Plus, ExternalLink } from 'lucide-react';

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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header with Action Button */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Loans</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Active player debt, 15% interest calculations, and payback addresses.
          </p>
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
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={loan.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                          alt={loan.userName}
                          className="w-8 h-8 rounded-full border border-white/[0.08]"
                        />
                        <div>
                          <div className="font-medium text-white">{loan.userName}</div>
                          <div className="text-[11px] text-neutral-500 font-mono">ID: {loan.userId}</div>
                        </div>
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

                    <td className="py-4 px-3">
                      {loan.addresses?.sol ? (
                        <button
                          onClick={() => copyToClipboard(loan.addresses.sol!, loan.id)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181818] hover:bg-[#222222] border border-white/[0.06] text-xs text-neutral-300 transition-colors font-mono"
                        >
                          {copiedId === loan.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-neutral-400" />
                              <span>{loan.addresses.sol.slice(0, 4)}...{loan.addresses.sol.slice(-4)}</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-500">—</span>
                      )}
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
    </div>
  );
}
