'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Coins, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Loader2
} from 'lucide-react';

export interface UserLoan {
  id: string;
  user_id: string;
  user_name: string;
  amount: number;
  total_due: number;
  crypto_currency?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'repaid' | 'active';
  is_paid?: boolean;
  created_at: string;
}

export interface UserProfileData {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl: string;
  role?: string;
  hwid?: string | null;
  created_at?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  initialUser?: UserProfileData | null;
  onLoanUpdated?: () => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  userId,
  initialUser,
  onLoanUpdated,
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'loans' | 'paid' | 'due'>('loans');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserProfileData | null>(initialUser || null);
  const [loans, setLoans] = useState<UserLoan[]>([]);
  const [stats, setStats] = useState({
    totalLoans: 0,
    totalLent: 0,
    totalPaid: 0,
    totalDue: 0,
    paidCount: 0,
    dueCount: 0,
  });
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUserDetails = useCallback(async (targetId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/lookup?q=${encodeURIComponent(targetId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUserData(data.user);
        }
        if (data.loans) {
          setLoans(
            (data.loans || []).filter((l: any) =>
              ['approved', 'active', 'completed', 'repaid'].includes(l.status)
            )
          );
        }
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails(userId);
    } else {
      setLoans([]);
      setUserData(initialUser || null);
    }
  }, [isOpen, userId, fetchUserDetails, initialUser]);

  if (!isOpen) return null;

  const handleCopyId = () => {
    if (!userData?.id) return;
    navigator.clipboard.writeText(userData.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkAsPaid = async (loanId: string) => {
    setActionLoading(`paid-${loanId}`);
    try {
      const res = await fetch('/api/loan-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loanId, status: 'completed' }),
      });
      if (res.ok) {
        if (userId) await fetchUserDetails(userId);
        if (onLoanUpdated) onLoanUpdated();
      }
    } catch (err) {
      console.error('Failed to mark loan as paid:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteLoan = async (loanId: string) => {
    if (!confirm('Are you sure you want to delete this loan record?')) return;
    setActionLoading(`del-${loanId}`);
    try {
      const res = await fetch(`/api/loan-requests?id=${loanId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (userId) await fetchUserDetails(userId);
        if (onLoanUpdated) onLoanUpdated();
      }
    } catch (err) {
      console.error('Failed to delete loan:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter loans based on active tab (refused/rejected loans are completely excluded)
  const displayedLoans = loans.filter((l) => {
    if (!['approved', 'active', 'completed', 'repaid'].includes(l.status)) return false;
    const isCompleted = l.status === 'completed' || l.status === 'repaid' || l.is_paid;
    const isApproved = l.status === 'approved' || l.status === 'active';
    if (activeTab === 'paid') return isCompleted;
    if (activeTab === 'due') return isApproved && !isCompleted;
    return true; // 'loans' tab shows all
  });

  const displayName = userData?.displayName || userData?.username || 'Discord User';
  const handleName = userData?.username ? `@${userData.username.toLowerCase()}` : '';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[460px] bg-[#141416] border border-white/[0.08] rounded-3xl p-6 shadow-2xl relative select-none max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Close Button ONLY */}
        <div className="flex items-center justify-end pb-2">
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-5 pt-1 pb-2 pr-1 custom-scrollbar">
          {/* Centered Avatar and User Header */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-2 border-white/10 p-0.5 bg-[#1a1a1e] shadow-xl overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={userData?.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                  alt={displayName}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    // Fallback avatar
                    (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                  }}
                />
              </div>
              {userData?.role === 'owner' && (
                <div className="absolute -bottom-1 -right-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md">
                  OWNER
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight mt-3">
              {displayName}
            </h3>
            {handleName && (
              <p className="text-[13px] text-neutral-400 font-normal mt-0.5">
                {handleName}
              </p>
            )}
          </div>

          {/* Category Tabs: Loans | Paid | Due */}
          <div className="bg-[#1a1a1e] p-1 rounded-2xl flex items-center justify-between gap-1 border border-white/[0.04]">
            <button
              onClick={() => setActiveTab('loans')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'loans'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Loans</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'loans' ? 'bg-black/10 text-black' : 'bg-white/10 text-neutral-300'
              }`}>
                {stats.totalLoans}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('paid')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'paid'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Paid</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'paid' ? 'bg-black/20 text-black font-bold' : 'bg-white/10 text-neutral-300'
              }`}>
                {stats.paidCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('due')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'due'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Due</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'due' ? 'bg-black/20 text-black font-bold' : 'bg-white/10 text-neutral-300'
              }`}>
                {stats.dueCount}
              </span>
            </button>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-xl">
              <span className="text-[10px] text-neutral-500 block uppercase font-medium">Total Lent</span>
              <span className="text-sm font-bold text-white">${stats.totalLent.toFixed(2)}</span>
            </div>
            <div className="bg-emerald-500/[0.03] border border-emerald-500/10 p-2.5 rounded-xl">
              <span className="text-[10px] text-emerald-400/80 block uppercase font-medium">Total Paid</span>
              <span className="text-sm font-bold text-emerald-400">${stats.totalPaid.toFixed(2)}</span>
            </div>
            <div className="bg-amber-500/[0.03] border border-amber-500/10 p-2.5 rounded-xl">
              <span className="text-[10px] text-amber-400/80 block uppercase font-medium">Pending Due</span>
              <span className="text-sm font-bold text-amber-400">${stats.totalDue.toFixed(2)}</span>
            </div>
          </div>

          {/* Loan List under active tab */}
          <div className="space-y-2.5 pt-1">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                <span className="text-xs">Fetching borrower records...</span>
              </div>
            ) : displayedLoans.length === 0 ? (
              <div className="py-10 text-center rounded-2xl bg-white/[0.01] border border-white/[0.03] p-4">
                <Coins className="w-7 h-7 mx-auto text-neutral-600 mb-2" />
                <p className="text-xs font-medium text-neutral-400">
                  {activeTab === 'paid' && 'No repaid loans on record for this user.'}
                  {activeTab === 'due' && 'No pending debts! This user has zero due.'}
                  {activeTab === 'loans' && 'No loans recorded for this user yet.'}
                </p>
              </div>
            ) : (
              displayedLoans.map((loan) => {
                const isPaid = loan.status === 'completed' || loan.status === 'repaid' || loan.is_paid;
                const isApproved = loan.status === 'approved' || loan.status === 'active';
                const dueAmt = isApproved ? (loan.total_due || Math.round(loan.amount * 1.15 * 100) / 100) : 0;

                return (
                  <div
                    key={loan.id}
                    className="p-3.5 rounded-2xl bg-[#18181b] border border-white/[0.06] hover:border-white/10 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white">
                            ${loan.amount.toFixed(2)}
                          </span>
                          {!isPaid && (
                            <span className="text-[11px] font-medium text-amber-400">
                              Due: ${dueAmt.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {loan.reason && (
                          <p className="text-xs text-neutral-300 mt-1 line-clamp-2">
                            {loan.reason}
                          </p>
                        )}
                        <span className="text-[10px] text-neutral-500 block mt-1">
                          {new Date(loan.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Settled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.04]">
                      {!isPaid && (
                        <button
                          onClick={() => handleMarkAsPaid(loan.id)}
                          disabled={actionLoading === `paid-${loan.id}`}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {actionLoading === `paid-${loan.id}` ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          <span>Mark as Paid</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteLoan(loan.id)}
                        disabled={actionLoading === `del-${loan.id}`}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete this loan"
                      >
                        {actionLoading === `del-${loan.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
