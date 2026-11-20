'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Check, 
  Search, 
  Plus, 
  MessageSquare, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  X,
  Coins
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
  const { user, isAdmin, isOwner, isLoaded } = useAuth();
  const [items, setItems] = useState<RoadmileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Add Item Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTier, setModalTier] = useState<number>(50);
  const [newUserName, setNewUserName] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newAmount, setNewAmount] = useState('50');
  const [newCurrency, setNewCurrency] = useState('SOL');
  const [newReason, setNewReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Known quick-select Discord users
  const KNOWN_USERS = [
    { name: 'Slax', id: '1417666933201047574' },
    { name: 'Korak', id: '1399577280057184348' },
    { name: 'azrael', id: '775733039513731082' },
    { name: 'sotarium', id: '1079074717799030824' },
  ];

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/roadmap');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error('Failed to load roadmap items:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchItems();
    }
  }, [isAdmin]);

  // Toggle paid back checkmark
  const handleTogglePaid = async (item: RoadmileItem) => {
    const nextPaid = !item.is_paid;
    setTogglingId(item.id);

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              is_paid: nextPaid,
              status: nextPaid ? 'completed' : 'approved',
            }
          : i
      )
    );

    try {
      const res = await fetch('/api/roadmap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isPaid: nextPaid }),
      });
      if (!res.ok) {
        // Revert on failure
        fetchItems();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      fetchItems();
    } finally {
      setTogglingId(null);
    }
  };

  // Delete item from board
  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this borrower from the board?')) return;

    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/roadmap?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete item:', err);
      fetchItems();
    }
  };

  // Open Add Modal preset to a tier
  const handleOpenAdd = (tierAmount?: number) => {
    const amt = tierAmount || 50;
    setModalTier(amt);
    setNewAmount(amt.toString());
    setNewUserName('');
    setNewUserId('');
    setNewReason('');
    setIsModalOpen(true);
  };

  // Submit new borrower
  const handleCreateBorrower = async (e: React.FormEvent) => {
    e.preventDefault();
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
          reason: newReason || 'Roadmile loan entry',
          isPaid: false,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchItems();
      }
    } catch (err) {
      console.error('Failed to create borrower:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.user_name.toLowerCase().includes(search.toLowerCase()) ||
        item.user_id.includes(search) ||
        (item.reason && item.reason.toLowerCase().includes(search.toLowerCase()));

      if (filter === 'unpaid') return matchesSearch && !item.is_paid;
      if (filter === 'paid') return matchesSearch && item.is_paid;
      return matchesSearch;
    });
  }, [items, search, filter]);

  // Overall metrics
  const totalBorrowed = useMemo(() => items.reduce((acc, i) => acc + i.amount, 0), [items]);
  const totalPaid = useMemo(() => items.filter((i) => i.is_paid).reduce((acc, i) => acc + i.amount, 0), [items]);
  const totalDuePending = useMemo(
    () => items.filter((i) => !i.is_paid).reduce((acc, i) => acc + i.total_due, 0),
    [items]
  );
  const paidCount = useMemo(() => items.filter((i) => i.is_paid).length, [items]);

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
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-neutral-300 font-normal">
              Repayment Board
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Track loan tiers and checkmark borrowers who have paid back.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd(50)}
          className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-semibold text-xs flex items-center gap-2 transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99]"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Borrower</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="soteria-card p-4 sm:p-5 space-y-1">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            Total Lent Out
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-sans">
            ${totalBorrowed.toFixed(2)}
          </div>
          <div className="text-[11px] text-neutral-500">
            Across {items.length} total loans
          </div>
        </div>

        <div className="soteria-card p-4 sm:p-5 space-y-1">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            Total Paid Back
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-sans">
            ${totalPaid.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-500/80 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{paidCount} borrowers settled</span>
          </div>
        </div>

        <div className="soteria-card p-4 sm:p-5 space-y-1">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            Pending Repayment
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-400 font-sans">
            ${totalDuePending.toFixed(2)}
          </div>
          <div className="text-[11px] text-neutral-500">
            Total with 15% interest
          </div>
        </div>

        <div className="soteria-card p-4 sm:p-5 space-y-1">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            Settlement Progress
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-sans">
            {items.length > 0 ? Math.round((paidCount / items.length) * 100) : 0}%
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${items.length > 0 ? (paidCount / items.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="soteria-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search borrower or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#171717] border border-white/[0.06] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start md:self-auto bg-[#171717] p-1 rounded-xl border border-white/[0.04]">
          {(['all', 'unpaid', 'paid'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === tab
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab === 'unpaid' ? 'Unpaid' : tab === 'paid' ? 'Paid Back' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Board Columns: $10, $25, $50, $100, $250, $500+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
        {TIERS.map((tier) => {
          // Find items falling into this column tier
          const tierItems = filteredItems.filter(
            (item) => item.amount >= tier.min && item.amount <= tier.max
          );
          const tierPaidCount = tierItems.filter((i) => i.is_paid).length;
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
                  title={`Add borrower to ${tier.title}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Column Meta Sub-header */}
              <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-2.5 px-0.5">
                <span>${tierTotalSum.toFixed(0)} Total</span>
                <span>{tierPaidCount}/{tierItems.length} Settled</span>
              </div>

              {/* Borrower Cards in Column */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                {tierItems.length === 0 ? (
                  <div className="h-44 border border-dashed border-white/[0.06] rounded-xl flex flex-col items-center justify-center p-4 text-center">
                    <span className="text-[11px] text-neutral-500">No loans</span>
                    <button
                      onClick={() => handleOpenAdd(tier.amount)}
                      className="mt-2 text-[10px] text-neutral-400 hover:text-white underline underline-offset-2"
                    >
                      + Add {tier.title} loan
                    </button>
                  </div>
                ) : (
                  tierItems.map((item) => {
                    const isChecked = item.is_paid;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleTogglePaid(item)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer group select-none relative overflow-hidden ${
                          isChecked
                            ? 'bg-[#18221c]/60 border-emerald-500/30 hover:border-emerald-500/50'
                            : 'bg-[#181818] border-white/[0.05] hover:border-white/15'
                        }`}
                      >
                        {/* Top row: Checkbox + User info */}
                        <div className="flex items-start gap-2.5">
                          {/* Tactile Checkmark Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePaid(item);
                            }}
                            disabled={togglingId === item.id}
                            className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                : 'border border-neutral-600 group-hover:border-white bg-neutral-900/60'
                            }`}
                            title={isChecked ? 'Mark as Unpaid' : 'Mark as Paid Back'}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

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
                              <span className={`text-xs font-semibold truncate ${
                                isChecked ? 'text-neutral-300 line-through' : 'text-white'
                              }`}>
                                {item.user_name}
                              </span>
                            </div>

                            {/* Loan Amount & Currency */}
                            <div className="mt-1.5 flex items-baseline justify-between">
                              <span className="text-xs font-bold text-white">
                                ${item.amount.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                Due: ${item.total_due.toFixed(2)}
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
                              {isChecked ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Paid Back</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>Pending</span>
                                </span>
                              )}

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.dispatchEvent(new CustomEvent('open-support-chat', {
                                      detail: {
                                        userId: item.user_id,
                                        userName: item.user_name,
                                        userAvatar: item.user_avatar,
                                        subject: `Roadmile Loan (${item.user_name} - $${item.amount.toFixed(2)} ${item.crypto_currency})`
                                      }
                                    }));
                                  }}
                                  className="p-1 rounded hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
                                  title="Message in Support"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteItem(item.id, e)}
                                  className="p-1 rounded hover:bg-white/10 text-neutral-500 hover:text-red-400 transition-colors"
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

      {/* Add Borrower Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#161616] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-lg font-bold text-white font-sans">Add to Roadmile Board</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Assign a borrower to a tier column</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBorrower} className="space-y-4">
              {/* Quick Select Known User */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Quick Select User</label>
                <div className="grid grid-cols-2 gap-2">
                  {KNOWN_USERS.map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => {
                        setNewUserName(u.name);
                        setNewUserId(u.id);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left flex items-center gap-2 ${
                        newUserId === u.id
                          ? 'bg-white text-black border-white'
                          : 'bg-[#1e1e1e] text-neutral-300 border-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="truncate">{u.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Username & Discord ID */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-400">Borrower Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Korak"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
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
                    onChange={(e) => setNewUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1e1e1e] border border-white/[0.06] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400"
                  />
                </div>
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-400">Loan Amount ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="50"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#1e1e1e] border border-white/[0.06] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-400">Crypto Currency</label>
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

              {/* Tier Quick Select Pills */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-400">Quick Tier</label>
                <div className="flex flex-wrap gap-1.5">
                  {[10, 25, 50, 100, 250, 500].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setNewAmount(amt.toString())}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        newAmount === amt.toString()
                          ? 'bg-white text-black border-white'
                          : 'bg-[#1e1e1e] text-neutral-400 border-white/[0.04] hover:text-white'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-400">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="Ticket reference or collateral note..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1e1e1e] border border-white/[0.06] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400"
                />
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
                  className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-semibold text-xs transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add to Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
