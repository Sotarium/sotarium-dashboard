'use client';

import { useState, useEffect } from 'react';
import { Loan } from '@/lib/data';
import { Search, Copy, Check, Lock, X, ExternalLink, ShieldCheck, Clock } from 'lucide-react';
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30">
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
      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FF2D55]" title={`Overdue by ${timeStr}`}>
        <Clock className="w-3.5 h-3.5 text-[#FF2D55] shrink-0 animate-pulse" />
        <span>Overdue ({timeStr})</span>
      </div>
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
    <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
      <Clock className={`w-3.5 h-3.5 shrink-0 ${isUrgent ? 'text-[#FF2D55] animate-pulse' : isWarning ? 'text-amber-400' : 'text-neutral-400'}`} />
      <span className={isUrgent ? 'text-[#FF2D55]' : isWarning ? 'text-amber-300' : 'text-neutral-200'}>
        {countdownText}
      </span>
    </div>
  );
}

export default function LoansPage() {
  const { user, isOwner, isLoaded } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [search, setSearch] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
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

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
                    {/* Borrower Column with Real Discord Avatar - Click to view deposit details */}
                    <td className="py-4 px-3 cursor-pointer" onClick={() => setSelectedLoan(loan)} title="Click to view addresses & ticket">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={userAvatar}
                          alt={loan.userName}
                          className="w-8 h-8 rounded-full border border-white/10 shadow-sm object-cover bg-neutral-800"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                        />
                        <div className="font-semibold text-white text-sm hover:underline">
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

      {/* High-End Activity Detail / Deposit Addresses Modal Overlay */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[460px] bg-[#141414] border border-white/[0.08] rounded-3xl p-6 md:p-7 shadow-2xl relative space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <span className="text-xs font-bold tracking-wider text-neutral-300 uppercase">
                DEPOSIT CHANNELS & ACTIVITY
              </span>
              <button
                onClick={() => setSelectedLoan(null)}
                className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Borrower Profile Header */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#181818] border border-white/[0.04]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={discordAvatars[selectedLoan.userId] || selectedLoan.userAvatar || 'https://cdn.discordapp.com/avatars/1079074717799030824/64db63e7b0bcbe6b841ba40535473949.png?size=128'}
                alt={selectedLoan.userName}
                className="w-14 h-14 rounded-2xl border border-white/10 shadow-md object-cover bg-neutral-900"
              />
              <div className="leading-tight">
                <div className="text-base font-bold text-white tracking-tight">{selectedLoan.userName}</div>
                <div className="text-xs text-neutral-400 font-mono mt-0.5">ID: {selectedLoan.userId}</div>
                <div className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Active Loan Repayment Channel
                </div>
              </div>
            </div>

            {/* Loan Info Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-[#171717] border border-white/[0.04] text-center">
                <div className="text-[10px] uppercase font-semibold text-neutral-400">Total Due</div>
                <div className="text-sm font-bold text-white mt-0.5">${(selectedLoan.principal * 1.15).toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#171717] border border-white/[0.04] text-center">
                <div className="text-[10px] uppercase font-semibold text-neutral-400">Repaid</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">${selectedLoan.repaidAmount.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#171717] border border-white/[0.04] text-center">
                <div className="text-[10px] uppercase font-semibold text-neutral-400">Due Date</div>
                <div className="text-xs font-semibold text-neutral-300 mt-1 font-mono">{selectedLoan.dueDate}</div>
              </div>
            </div>

            {/* Crypto Payback Addresses */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                <span>Direct NOWPayments Wallets</span>
                <span className="text-[10px] text-neutral-500 font-mono">Instant Confirmation</span>
              </div>

              {/* Solana (SOL) Card */}
              <div className="p-3.5 rounded-2xl bg-[#181818] border border-white/[0.06] hover:border-white/15 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/sol.svg" alt="SOL" className="w-5 h-5 rounded-full shrink-0" />
                    <span className="text-xs font-bold text-white">Solana (SOL)</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedLoan.addresses?.sol || 'DMKA3rLfwVJagiV7jLiP4X4BCuoYDZ23h2JD3LDMU2MG', 'sol')}
                    className="px-3 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-xs text-white font-medium transition-colors flex items-center gap-1.5"
                  >
                    {copiedKey === 'sol' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04] text-xs font-mono text-neutral-300 select-all break-all">
                  {selectedLoan.addresses?.sol || 'DMKA3rLfwVJagiV7jLiP4X4BCuoYDZ23h2JD3LDMU2MG'}
                </div>
              </div>

              {/* Ethereum (ETH) Card */}
              <div className="p-3.5 rounded-2xl bg-[#181818] border border-white/[0.06] hover:border-white/15 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/eth.svg" alt="ETH" className="w-5 h-5 rounded-full shrink-0" />
                    <span className="text-xs font-bold text-white">Ethereum (ETH)</span>
                    <span className="text-[10px] text-neutral-400 font-mono px-1.5 py-0.5 rounded bg-white/[0.05]">ERC-20</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedLoan.addresses?.eth || '0xF1b93f0Cc886be3d1D6983116b286A07117F4f0D', 'eth')}
                    className="px-3 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-xs text-white font-medium transition-colors flex items-center gap-1.5"
                  >
                    {copiedKey === 'eth' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04] text-xs font-mono text-neutral-300 select-all break-all">
                  {selectedLoan.addresses?.eth || '0xF1b93f0Cc886be3d1D6983116b286A07117F4f0D'}
                </div>
              </div>

              {/* Litecoin (LTC) Card */}
              <div className="p-3.5 rounded-2xl bg-[#181818] border border-white/[0.06] hover:border-white/15 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/ltc.svg" alt="LTC" className="w-5 h-5 rounded-full shrink-0" />
                    <span className="text-xs font-bold text-white">Litecoin (LTC)</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedLoan.addresses?.ltc || 'MAVKtFcudkZ7LDavCLTS6PAacHhTmqVWo6', 'ltc')}
                    className="px-3 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-xs text-white font-medium transition-colors flex items-center gap-1.5"
                  >
                    {copiedKey === 'ltc' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04] text-xs font-mono text-neutral-300 select-all break-all">
                  {selectedLoan.addresses?.ltc || 'MAVKtFcudkZ7LDavCLTS6PAacHhTmqVWo6'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setSelectedLoan(null)}
                className="w-full py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-white/[0.08] text-white font-semibold text-xs transition-colors"
              >
                Close
              </button>

              <a
                href="https://discord.com/channels/1454106247056982130/1573024208118743202"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-2xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Jump in Discord</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
