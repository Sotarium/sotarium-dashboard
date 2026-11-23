'use client';
import { getTotalDue } from '@/lib/interest';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Search, ShieldAlert, MessageSquare, Trash2, X, Wallet, Copy, Check } from 'lucide-react';
import RequestDetailOverlay from '@/components/RequestDetailOverlay';

interface LoanRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
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
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LoanRequest | null>(null);

  const fetchRequests = () => {
    fetch('/api/loan-requests')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRequests(data);
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
        body: JSON.stringify({ id, status: newStatus, requesterId: user?.id }),
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

  const handleDeleteRequest = async (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    try {
      await fetch(`/api/loan-requests?id=${id}&requesterId=${user?.id || ''}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete request:', err);
      fetchRequests();
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

  const filteredRequests = requests
    .filter((r) => r.status === 'pending')
    .filter((r) => {
      if (!search.trim()) return true;
      return (
        r.user_name.toLowerCase().includes(search.toLowerCase()) ||
        r.user_id.includes(search) ||
        (r.reason && r.reason.toLowerCase().includes(search.toLowerCase()))
      );
    });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Loan Applications</h1>
      </div>

      <div className="soteria-card p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Pending Requests</h2>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search user, ID, reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-[#171717] border border-white/[0.06] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors"
            />
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs font-medium text-neutral-400">
                <th className="pb-3 px-3">Borrower</th>
                <th className="pb-3 px-3">Principal</th>
                <th className="pb-3 px-3">Asset</th>
                <th className="pb-3 px-3">Total Due</th>
                <th className="pb-3 px-3">Applied Date</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-neutral-500">
                    No loan requests found matching query.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Borrower avatar + name (Clickable to open details modal) */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="flex items-center gap-2.5 text-left group hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={discordAvatars[req.user_id] || req.user_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                            alt={req.user_name}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full border border-white/10 group-hover:border-white/30 object-cover bg-neutral-800 shrink-0 transition-colors"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                            }}
                          />
                          <span className="font-semibold text-white text-xs group-hover:underline underline-offset-2">
                            {req.user_name}
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            window.dispatchEvent(
                              new CustomEvent('open-support-chat', {
                                detail: {
                                  userId: req.user_id,
                                  userName: req.user_name,
                                  userAvatar: discordAvatars[req.user_id],
                                  subject: `Loan Request (${req.user_name} - $${req.amount.toFixed(2)} ${req.crypto_currency})`,
                                },
                              })
                            );
                          }}
                          className="p-1 rounded-lg hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors"
                          title={`Message ${req.user_name} in Support`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
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
                      ${(getTotalDue(req.amount)).toFixed(2)}
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

                    {/* Approve / Refuse Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.status === 'pending' ? (
                          <>
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
                          </>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'pending')}
                            disabled={isProcessing === req.id}
                            className="px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 font-semibold text-xs border border-white/[0.08] transition-colors disabled:opacity-50"
                          >
                            Reset
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-neutral-400 hover:text-red-400 transition-colors"
                          title="Delete Request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Overlay */}
      {selectedRequest && (
        <RequestDetailOverlay
          req={selectedRequest}
          avatarUrl={discordAvatars[selectedRequest.user_id]}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}
