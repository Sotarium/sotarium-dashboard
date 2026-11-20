'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Check, 
  Search, 
  Plus, 
  MessageSquare, 
  Trash2, 
  CheckCircle2, 
  ShieldAlert,
  X,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface RoadmileItem {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  amount: number;
  total_due: number;
  crypto_currency: string;
  reason?: string;
  status: string;
  is_paid: boolean;
  created_at: string;
}

interface ColumnTier {
  id: string;
  title: string;
  amount: number;
  min: number;
  max: number;
}

const TIERS: ColumnTier[] = [
  { id: '10', title: '$10', amount: 10, min: 0, max: 18 },
  { id: '25', title: '$25', amount: 25, min: 19, max: 35 },
  { id: '50', title: '$50', amount: 50, min: 36, max: 75 },
  { id: '100', title: '$100', amount: 100, min: 76, max: 175 },
  { id: '250', title: '$250', amount: 250, min: 176, max: 375 },
  { id: '500+', title: '$500+', amount: 500, min: 376, max: Infinity },
];

export default function RoadmilePage() {
  const { user, isAdmin, isLoaded } = useAuth();
  const [completedItems, setCompletedItems] = useState<RoadmileItem[]>([]);
  const [pendingLoans, setPendingLoans] = useState<RoadmileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Completed Loan Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTier, setModalTier] = useState<number>(50);
  const [selectedPendingId, setSelectedPendingId] = useState<string>('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newAmount, setNewAmount] = useState('50');
  const [newCurrency, setNewCurrency] = useState('SOL');
  const [newReason, setNewReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRoadmapData = async () => {
    try {
      setLoading(true);
      // Fetch both completed and pending items
      const [resCompleted, resPending] = await Promise.all([
        fetch('/api/roadmap?mode=completed'),
        fetch('/api/roadmap?mode=pending'),
      ]);

      if (resCompleted.ok) {
        const data = await resCompleted.json();
        setCompletedItems(data);
      }
      if (resPending.ok) {
        const data = await resPending.json();
        setPendingLoans(data);
      }
    } catch (e) {
      console.error('Failed to load roadmap items:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchRoadmapData();
    }
  }, [isAdmin]);

  // Mark an active/pending loan as Completed
  const handleMarkAsCompleted = async (loanId: string) => {
    try {
      const res = await fetch('/api/roadmap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loanId, isPaid: true, status: 'completed' }),
      });
      if (res.ok) {
        fetchRoadmapData();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to mark loan as completed:', err);
    }
  };

  // Reset a completed loan back to pending (removes from completed board)
  const handleResetToPending = async (item: RoadmileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Reset ${item.user_name}'s loan back to pending?`)) return;

    setCompletedItems((prev) => prev.filter((i) => i.id !== item.id));
    try {
      await fetch('/api/roadmap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isPaid: false, status: 'pending' }),
      });
      fetchRoadmapData();
    } catch (err) {
      console.error('Failed to reset loan:', err);
      fetchRoadmapData();
    }
  };

  // Delete completed record from board
  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this record?')) return;

    setCompletedItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/roadmap?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete item:', err);
      fetchRoadmapData();
    }
  };

  // Open Add Modal preset to a tier
  const handleOpenAdd = (tierAmount?: number) => {
    const amt = tierAmount || 50;
    setModalTier(amt);
    setNewAmount(amt.toString());
    setSelectedPendingId('');
    setNewUserName('');
    setNewUserId('');
    setNewReason('');
    setIsModalOpen(true);
  };

  // Create new completed loan directly
  const handleCreateCompleted = async (e: React.FormEvent) => {
    e.preventDefault();

    // If an existing pending loan was selected, mark it completed
    if (selectedPendingId) {
      setIsSubmitting(true);
      await handleMarkAsCompleted(selectedPendingId);
      setIsSubmitting(false);
      return;
    }

    if (!newAmount || parseFloat(newAmount) <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newUserId || '1079074717799030824',
          userName: newUserName || 'Borrower',
          amount: parseFloat(newAmount),
          cryptoCurrency: newCurrency,
          reason: newReason || 'Completed payback',
          status: 'completed',
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchRoadmapData();
      }
    } catch (err) {
      console.error('Failed to create completed loan:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered completed items
  const filteredCompleted = useMemo(() => {
    return completedItems.filter((item) => {
      const matchesSearch =
        item.user_name.toLowerCase().includes(search.toLowerCase()) ||
        item.user_id.includes(search) ||
        (item.reason && item.reason.toLowerCase().includes(search.toLowerCase()));
      return matchesSearch;
    });
  }, [completedItems, search]);

  const totalPaid = useMemo(() => completedItems.reduce((acc, i) => acc + i.amount, 0), [completedItems]);
  const totalPaidWithInterest = useMemo(() => completedItems.reduce((acc, i) => acc + i.total_due, 0), [completedItems]);
  const completedCount = completedItems.length;

  // Access check
  if (isLoaded && !isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-white/[0.08] flex items-center justify-center text-amber-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h2>
          <p className="text-sm text-neutral-400 max-w-md mt-1">
            The Roadmile repayment board is restricted to administrators and owner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-in fade-in duration-300 max-w-[1400px]">
      
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans flex items-center gap-3">
            <span>Roadmile</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
              Completed Paybacks
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Borrowers whose loans are marked Completed, organized into milestone tier columns.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd(50)}
          className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-semibold text-xs flex items-center gap-2 transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99]"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Mark Loan Completed</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="soteria-card p-5 space-y-1">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            Total Settled (Principal)
          </div>
          <div className="text-2xl font-bold text-white font-sans">
            ${totalPaid.toFixed(2)}
          </div>
          <div className="text-[11px] text-neutral-500">
            Across {completedCount} settled loans
          </div>
        </div>

        <div className="soteria-card p-5 space-y-1">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            Total Repaid (+15% Interest)
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-sans">
            ${totalPaidWithInterest.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-500/80 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>100% Settled into House Liquidity</span>
          </div>
        </div>

        <div className="soteria-card p-5 space-y-1">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            Active Pending Debtors
          </div>
          <div className="text-2xl font-bold text-amber-400 font-sans">
            {pendingLoans.length}
          </div>
          <div className="text-[11px] text-neutral-500">
            Click &quot;Mark Loan Completed&quot; to settle any of them
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="soteria-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search settled borrower or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#171717] border border-white/[0.06] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors"
          />
        </div>

        <div className="text-xs text-neutral-400">
          Showing <span className="text-white font-semibold">{filteredCompleted.length}</span> completed borrowers
        </div>
      </div>

      {/* Board Columns: $10, $25, $50, $100, $250, $500+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
        {TIERS.map((tier) => {
          // Display ONLY loans that are marked Completed in this tier!
          const tierItems = filteredCompleted.filter(
            (item) => item.amount >= tier.min && item.amount <= tier.max
          );
          const tierTotalSum = tierItems.reduce((acc, i) => acc + i.amount, 0);

          return (
            <div 
              key={tier.id} 
              className="bg-[#121212] rounded-2xl border border-white/[0.06] p-3.5 flex flex-col min-h-[420px] transition-colors"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-white font-bold text-xs tracking-tight">
                    {tier.title}
                  </span>
                  <span className="text-[11px] font-medium text-neutral-400">
                    ({tierItems.length})
                  </span>
                </div>

                <button
                  onClick={() => handleOpenAdd(tier.amount)}
                  className="p-1 rounded-lg hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors"
                  title={`Add completed borrower to ${tier.title}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Column Meta Sub-header */}
              <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-2.5 px-0.5">
                <span>${tierTotalSum.toFixed(0)} Settled</span>
                <span className="text-emerald-400 font-semibold">{tierItems.length} Paid</span>
              </div>

              {/* Completed Borrower Cards in Column */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                {tierItems.length === 0 ? (
                  <div className="h-44 border border-dashed border-white/[0.06] rounded-xl flex flex-col items-center justify-center p-4 text-center">
                    <span className="text-[11px] text-neutral-500">No completed loans</span>
                    <button
                      onClick={() => handleOpenAdd(tier.amount)}
                      className="mt-2 text-[10px] text-neutral-400 hover:text-white underline underline-offset-2"
                    >
                      + Add completed loan
                    </button>
                  </div>
                ) : (
                  tierItems.map((item) => {
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-emerald-500/30 bg-[#141d17] hover:border-emerald-500/50 transition-all select-none relative overflow-hidden"
                      >
                        {/* Top row: Check icon + User info */}
                        <div className="flex items-start gap-2.5">
                          {/* Completed Green Checkmark Pill */}
                          <div
                            className="w-5 h-5 rounded-md mt-0.5 flex items-center justify-center shrink-0 bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            title="Completed & Paid Back"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>

                          {/* Avatar & Username */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.user_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                                alt={item.user_name}
                                className="w-5 h-5 rounded-full object-cover border border-white/10 shrink-0 bg-neutral-800"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                              />
                              <span className="text-xs font-semibold text-white truncate">
                                {item.user_name}
                              </span>
                            </div>

                            {/* Loan Amount & Repaid Total */}
                            <div className="mt-1.5 flex items-baseline justify-between">
                              <span className="text-xs font-bold text-white">
                                ${item.amount.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                                Repaid: ${item.total_due.toFixed(2)}
                              </span>
                            </div>

                            {/* Reason / Notes */}
                            {item.reason && (
                              <p className="mt-1 text-[10px] text-neutral-400 line-clamp-1 truncate" title={item.reason}>
                                {item.reason}
                              </p>
                            )}

                            {/* Bottom Status & Actions */}
                            <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between">
                              {/* Status Badge */}
                              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <Check className="w-2.5 h-2.5" />
                                <span>Completed</span>
                              </span>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    window.dispatchEvent(new CustomEvent('open-support-chat', {
                                      detail: {
                                        userId: item.user_id,
                                        userName: item.user_name,
                                        userAvatar: item.user_avatar,
                                        subject: `Settled Loan (${item.user_name} - $${item.amount.toFixed(2)} ${item.crypto_currency})`
                                      }
                                    }));
                                  }}
                                  className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                                  title="Message in Support"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleResetToPending(item, e)}
                                  className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-amber-400 transition-colors"
                                  title="Reset back to pending (unpaid)"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteItem(item.id, e)}
                                  className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-red-400 transition-colors"
                                  title="Delete from board"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mark Loan Completed Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#161616] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-lg font-bold text-white font-sans">Mark Loan as Completed</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Select a borrower who paid back to add to the board</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCompleted} className="space-y-4">
              
              {/* Option 1: Pick from currently active/pending loans */}
              {pendingLoans.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Select Active Borrower to Settle
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {pendingLoans.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => {
                          if (selectedPendingId === l.id) {
                            setSelectedPendingId('');
                          } else {
                            setSelectedPendingId(l.id);
                            setNewUserName(l.user_name);
                            setNewUserId(l.user_id);
                            setNewAmount(l.amount.toString());
                            setNewCurrency(l.crypto_currency);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          selectedPendingId === l.id
                            ? 'bg-emerald-500/15 border-emerald-500 text-white'
                            : 'bg-[#1e1e1e] border-white/[0.06] text-neutral-300 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={l.user_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                            alt={l.user_name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="font-semibold">{l.user_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">
                            ${l.amount.toFixed(2)} {l.crypto_currency}
                          </span>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm(`Delete ${l.user_name}'s loan request permanently?`)) return;
                              setPendingLoans((prev) => prev.filter((p) => p.id !== l.id));
                              try {
                                await fetch(`/api/loan-requests?id=${l.id}`, { method: 'DELETE' });
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="p-1 rounded hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition-colors"
                            title="Delete loan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Or manual entry */}
              <div className="pt-1 border-t border-white/[0.06] space-y-3">
                <div className="text-[11px] font-medium text-neutral-400">
                  {selectedPendingId ? 'Selected Loan Details' : 'Or Record a Custom Settled Loan'}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-neutral-400">Borrower Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Slax"
                      value={newUserName}
                      onChange={(e) => {
                        setNewUserName(e.target.value);
                        setSelectedPendingId('');
                      }}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-[#1e1e1e] border border-white/[0.06] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-neutral-400">Discord User ID</label>
                    <input
                      type="text"
                      placeholder="Snowflake ID..."
                      value={newUserId}
                      onChange={(e) => {
                        setNewUserId(e.target.value);
                        setSelectedPendingId('');
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#1e1e1e] border border-white/[0.06] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-neutral-400">Amount Paid ($)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="50"
                      value={newAmount}
                      onChange={(e) => {
                        setNewAmount(e.target.value);
                        setSelectedPendingId('');
                      }}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-[#1e1e1e] border border-white/[0.06] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-neutral-400">Currency</label>
                    <select
                      value={newCurrency}
                      onChange={(e) => setNewCurrency(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1e1e1e] border border-white/[0.06] text-xs text-white focus:outline-none focus:border-neutral-400"
                    >
                      <option value="SOL">SOL (Solana)</option>
                      <option value="ETH">ETH (Ethereum)</option>
                      <option value="BTC">BTC (Bitcoin)</option>
                      <option value="LTC">LTC (Litecoin)</option>
                    </select>
                  </div>
                </div>

                {/* Quick Tier Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-400">Quick Tier</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[10, 25, 50, 100, 250, 500].map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => {
                          setNewAmount(amt.toString());
                          setSelectedPendingId('');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          newAmount === amt.toString() && !selectedPendingId
                            ? 'bg-white text-black border-white'
                            : 'bg-[#1e1e1e] text-neutral-400 border-white/[0.04] hover:text-white'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : selectedPendingId
                    ? 'Mark as Completed'
                    : 'Record Completed Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
