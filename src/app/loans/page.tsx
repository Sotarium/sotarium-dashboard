'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Pencil, Loader2, X, Check, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface ActiveLoan {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  principal: number;
  interestRate: number;
  interestAmount: number;
  totalDue: number;
  repaidAmount: number;
  status: 'active' | 'completed' | 'overdue';
  loanDate: string;
  dueDate: string;
  reason: string;
  notes: string;
  cryptoCurrency: string;
}

// --- Countdown Timer ---
function TimeLeftCell({ dueDate, loanDate, status }: { dueDate: string; loanDate: string; status: string }) {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (status === 'completed') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [status]);

  if (status === 'completed') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        Paid
      </span>
    );
  }

  let dueTimestamp = 0;
  if (dueDate) {
    const parsed = new Date(dueDate);
    if (!isNaN(parsed.getTime())) dueTimestamp = parsed.getTime();
  }
  if (!dueTimestamp) {
    const loanTs = loanDate ? new Date(loanDate).getTime() : 0;
    dueTimestamp = loanTs ? loanTs + 48 * 60 * 60 * 1000 : now + 48 * 60 * 60 * 1000;
  }

  const diff = dueTimestamp - now;

  if (diff <= 0) {
    const ms = Math.abs(diff);
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms / 3600000) % 24);
    const m = Math.floor((ms / 60000) % 60);
    const s = Math.floor((ms / 1000) % 60);
    const str = d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`;
    return <span className="text-xs font-semibold text-red-400">Overdue ({str})</span>;
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff / 3600000) % 24);
  const minutes = Math.floor((diff / 60000) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');

  const isUrgent = diff < 6 * 3600000;
  const isWarning = diff < 24 * 3600000;

  const text = days > 0
    ? `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
    : `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

  return (
    <span className={`text-xs font-semibold tracking-tight flex items-center gap-1 ${isUrgent ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-neutral-200'}`}>
      <Clock className="w-3 h-3 opacity-60" />
      {text}
    </span>
  );
}

// --- Edit Modal ---
function EditLoanModal({
  loan,
  onClose,
  onSaved,
}: {
  loan: ActiveLoan;
  onClose: () => void;
  onSaved: (updated: Partial<ActiveLoan> & { id: string }) => void;
}) {
  // Parse remaining time from existing due date into spinners
  const getInitial = () => {
    const base = loan.dueDate ? new Date(loan.dueDate).getTime() : Date.now() + 48 * 3600000;
    const diff = Math.max(0, base - Date.now());
    const totalMins = Math.round(diff / 60000);
    return {
      d: Math.floor(totalMins / 1440),
      h: Math.floor((totalMins % 1440) / 60),
      m: totalMins % 60,
    };
  };
  const init = getInitial();
  const [days, setDays] = useState(init.d);
  const [hours, setHours] = useState(init.h);
  const [mins, setMins] = useState(init.m);
  const [notes, setNotes] = useState(loan.notes || '');
  const [reason, setReason] = useState(loan.reason || '');
  const [amount, setAmount] = useState(loan.principal.toString());
  const [saving, setSaving] = useState(false);
  const [markPaid, setMarkPaid] = useState(false);

  const computedDueISO = () => {
    const ms = (days * 1440 + hours * 60 + mins) * 60000;
    return new Date(Date.now() + ms).toISOString();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { id: loan.id };
      payload.due_date = computedDueISO();
      if (notes !== loan.notes) payload.notes = notes;
      if (reason !== loan.reason) payload.reason = reason;
      if (amount !== loan.principal.toString()) payload.amount = parseFloat(amount);
      if (markPaid) payload.status = 'completed';

      await fetch('/api/loan-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      onSaved({
        id: loan.id,
        dueDate: computedDueISO(),
        notes,
        reason,
        principal: parseFloat(amount) || loan.principal,
        status: markPaid ? 'completed' : loan.status,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save loan edits:', err);
    } finally {
      setSaving(false);
    }
  };

  const numCls = "w-full bg-[#1a1a1e] border border-white/[0.08] rounded-xl px-2 py-2.5 text-sm text-white text-center font-bold focus:outline-none focus:border-white/30 transition-all";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#141416] border border-white/[0.08] rounded-2xl p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Edit Loan</h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">{loan.userName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Due In spinners */}
          <div>
            <label className="text-[11px] text-neutral-400 font-medium block mb-2">Due in (from now)</label>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1.5">
                <input type="number" min={0} max={365} value={days}
                  onChange={(e) => setDays(Math.max(0, parseInt(e.target.value) || 0))}
                  className={numCls} />
                <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest">Days</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <input type="number" min={0} max={23} value={hours}
                  onChange={(e) => setHours(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                  className={numCls} />
                <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest">Hours</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <input type="number" min={0} max={59} value={mins}
                  onChange={(e) => setMins(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className={numCls} />
                <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest">Mins</span>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-[11px] text-neutral-400 font-medium block mb-1">Principal Amount ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
              step={0.01}
              className="w-full bg-[#1a1a1e] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-[11px] text-neutral-400 font-medium block mb-1">Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Loan reason..."
              className="w-full bg-[#1a1a1e] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] text-neutral-400 font-medium block mb-1">Internal Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Private notes..."
              className="w-full bg-[#1a1a1e] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 transition-all resize-none"
            />
          </div>

          {/* Mark as Paid toggle */}
          {loan.status !== 'completed' && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
              <div
                onClick={() => setMarkPaid((p) => !p)}
                className={`w-8 rounded-full relative transition-colors cursor-pointer ${markPaid ? 'bg-emerald-500' : 'bg-white/[0.08]'}`}
                style={{ height: '18px' }}
              >
                <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${markPaid ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-neutral-300 font-medium">Mark as Paid</span>
            </label>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-xl bg-white text-black text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer hover:bg-neutral-200 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function LoansPage() {
  const { isAdmin, isLoaded } = useAuth();
  const [loans, setLoans] = useState<ActiveLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingLoan, setEditingLoan] = useState<ActiveLoan | null>(null);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/loans');
      if (res.ok) {
        const data = await res.json();
        setLoans(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleDelete = async (id: string) => {
    setLoans((prev) => prev.filter((l) => l.id !== id));
    try {
      await fetch(`/api/loan-requests?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
      fetchLoans();
    }
  };

  const handleSaved = (updated: Partial<ActiveLoan> & { id: string }) => {
    setLoans((prev) =>
      prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l))
    );
  };

  if (!isLoaded) {
    return (
      <div className="space-y-6 animate-pulse max-w-6xl">
        <div className="h-10 w-48 bg-white/[0.04] rounded-xl" />
        <div className="soteria-card p-6 h-96 bg-white/[0.02]" />
      </div>
    );
  }

  const filteredLoans = loans.filter((l) =>
    l.userName.toLowerCase().includes(search.toLowerCase()) ||
    l.userId.includes(search) ||
    (l.reason && l.reason.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      {editingLoan && (
        <EditLoanModal
          loan={editingLoan}
          onClose={() => setEditingLoan(null)}
          onSaved={(updated) => {
            handleSaved(updated);
            setEditingLoan(null);
          }}
        />
      )}

      <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl">
        {/* Title */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Active Loans</h1>
            <p className="text-sm text-neutral-500 mt-1">Live countdown · approved loans</p>
          </div>
          <div className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-neutral-300">
            {loans.length} loan{loans.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Search + Table Card */}
        <div className="soteria-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search borrower..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171717] border border-white/[0.06] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-neutral-500 text-xs">Loading loans...</div>
          ) : filteredLoans.length === 0 ? (
            <div className="py-20 text-center text-neutral-500 text-xs">
              {loans.length === 0 ? 'No approved loans yet.' : 'No loans match your search.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs font-medium text-neutral-400">
                    <th className="pb-3 px-3">Borrower</th>
                    <th className="pb-3 px-3">Principal</th>
                    <th className="pb-3 px-3">Interest (15%)</th>
                    <th className="pb-3 px-3">Total Due</th>
                    <th className="pb-3 px-3">Time Left</th>
                    <th className="pb-3 px-3">Reason</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredLoans.map((loan) => {
                    const interest = Math.round(loan.principal * 0.15 * 100) / 100;
                    const totalDue = Math.round((loan.principal + interest) * 100) / 100;
                    const isPaid = loan.status === 'completed';

                    return (
                      <tr key={loan.id} className="hover:bg-white/[0.02] transition-colors group">
                        {/* Borrower */}
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={loan.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                              alt={loan.userName}
                              className="w-8 h-8 rounded-full border border-white/10 shadow-sm object-cover bg-neutral-800"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                            />
                            <div className="font-semibold text-white text-sm">{loan.userName}</div>
                          </div>
                        </td>

                        <td className="py-4 px-3 font-medium text-white">${loan.principal.toFixed(2)}</td>
                        <td className="py-4 px-3 text-neutral-400">${interest.toFixed(2)}</td>
                        <td className="py-4 px-3 font-semibold text-white">${totalDue.toFixed(2)}</td>

                        {/* Countdown */}
                        <td className="py-4 px-3">
                          <TimeLeftCell dueDate={loan.dueDate} loanDate={loan.loanDate} status={loan.status} />
                        </td>

                        {/* Reason */}
                        <td className="py-4 px-3 text-neutral-400 text-xs max-w-[160px]">
                          <span className="truncate block">{loan.reason || <span className="text-neutral-600 italic">—</span>}</span>
                          {loan.notes && (
                            <span className="text-neutral-600 italic truncate block">{loan.notes}</span>
                          )}
                        </td>

                        {/* Actions — edit & delete only shown to admins */}
                        <td className="py-4 px-3">
                          <div className="flex items-center justify-end gap-2">
                            {isPaid ? (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Paid
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white text-black">
                                Active
                              </span>
                            )}

                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => setEditingLoan(loan)}
                                  className="p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-500 hover:text-white transition-colors cursor-pointer"
                                  title="Edit loan"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDelete(loan.id)}
                                  className="p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Delete loan record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
