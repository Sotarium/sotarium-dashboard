'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Clock, Search, ShieldAlert } from 'lucide-react';

interface LoanRequest {
  id: string;
  user_id: string;
  user_name: string;
  amount: number;
  crypto_currency: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function RequestsPage() {
  const { user, isAdmin, isLoaded } = useAuth();
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [discordAvatars, setDiscordAvatars] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const fetchRequests = () => {
    fetch('/api/loan-requests')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRequests(data);
          // Fetch Discord avatars for all unique users
          data.forEach((r: LoanRequest) => {
            if (r.user_id) {
              fetch(`/api/discord-user?userId=${r.user_id}`)
                .then((res) => res.json())
                .then((u) => {
                  if (u?.avatarUrl) {
                    setDiscordAvatars((prev) => ({ ...prev, [r.user_id]: u.avatarUrl }));
                  }
                })
                .catch(() => {});
            }
          });
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();
    }
  }, [isAdmin]);

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    setIsProcessing(id);
    try {
      const res = await fetch('/api/loan-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err) {
      console.error('Failed to update request:', err);
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoaded && !isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-white/[0.08] flex items-center justify-center text-amber-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h2>
          <p className="text-sm text-neutral-400 max-w-md mt-1">
            The Requests management portal is restricted to administrators and owner.
          </p>
        </div>
      </div>
    );
  }

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.user_name.toLowerCase().includes(search.toLowerCase()) ||
      r.user_id.includes(search) ||
      (r.reason && r.reason.toLowerCase().includes(search.toLowerCase()));

    if (filter === 'all') return matchesSearch;
    return matchesSearch && r.status === filter;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Loan Requests</h1>
        </div>

        {pendingCount > 0 && (
          <div className="px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>{pendingCount} Pending Approval</span>
          </div>
        )}
      </div>

      {/* Filter & Search Card */}
      <div className="soteria-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, ID, reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171717] border border-white/[0.06] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-[#171717] p-1 rounded-xl border border-white/[0.06] self-start md:self-auto">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filter === tab
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              No loan requests match the current filters.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs font-medium text-neutral-400">
                  <th className="pb-3 px-3">Borrower</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Coin</th>
                  <th className="pb-3 px-3">Total Due (+15%)</th>
                  <th className="pb-3 px-3">Reason / Ticket</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Borrower with Discord Avatar */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={discordAvatars[req.user_id] || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                          alt={req.user_name}
                          className="w-7 h-7 rounded-full border border-white/10 object-cover bg-neutral-800 shrink-0"
                        />
                        <span className="font-semibold text-white text-xs">{req.user_name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-white">
                      ${req.amount.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-3 text-xs font-semibold text-white">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={`/assets/${req.crypto_currency.toLowerCase()}.svg`} 
                          alt={req.crypto_currency} 
                          className="w-4 h-4 rounded-full shrink-0" 
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                        <span>{req.crypto_currency}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-xs font-semibold text-white">
                      ${(req.amount * 1.15).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-3 text-xs font-semibold text-neutral-200 tracking-tight max-w-[200px] truncate" title={req.reason}>
                      {req.reason || '—'}
                    </td>

                    <td className="py-3.5 px-3 text-xs font-semibold text-neutral-300 tracking-tight whitespace-nowrap">
                      {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        req.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : req.status === 'rejected'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        <span className="capitalize">{req.status === 'rejected' ? 'Refused' : req.status}</span>
                      </span>
                    </td>

                    {/* Approve / Refuse Clean Actions (No Fluo / No Glow) */}
                    <td className="py-3.5 px-3 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'approved')}
                            disabled={isProcessing === req.id}
                            className="px-4 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 font-semibold text-xs border border-emerald-500/25 hover:border-emerald-500/40 transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() => handleUpdateStatus(req.id, 'rejected')}
                            disabled={isProcessing === req.id}
                            className="px-4 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-semibold text-xs border border-red-500/25 hover:border-red-500/40 transition-colors disabled:opacity-50"
                          >
                            Refuse
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'pending')}
                          disabled={isProcessing === req.id}
                          className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
