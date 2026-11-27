'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  User, 
  Loader2, 
  RefreshCw, 
  X 
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import UserProfileModal, { UserProfileData } from '@/components/UserProfileModal';

interface BorrowerCardData {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl: string;
  role?: string;
  totalLoans: number;
  totalLent: number;
  totalPaid: number;
  totalDue: number;
  pendingCount: number;
  completedCount: number;
}

export default function UserSearchPage() {
  const router = useRouter();
  const { user, isOwner, isLoaded } = useAuth();

  const [query, setQuery] = useState('');
  const [usersList, setUsersList] = useState<BorrowerCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState<'all' | 'due' | 'paid'>('all');

  // Modal State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserObj, setSelectedUserObj] = useState<UserProfileData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Security: Restricted to Owner ONLY
  useEffect(() => {
    if (isLoaded && !isOwner) {
      router.push('/');
    }
  }, [isLoaded, isOwner, router]);

  const fetchUsers = useCallback(async (searchQuery = '') => {
    try {
      if (searchQuery) setSearching(true);
      const res = await fetch(`/api/users/lookup?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        // If a single user is returned (direct snowflake ID search)
        if (data.user) {
          setSelectedUserObj(data.user);
          setSelectedUserId(data.user.id);
          setIsModalOpen(true);
        } else if (data.users) {
          setUsersList(data.users);
        }
      }
    } catch (err) {
      console.error('Failed to lookup users:', err);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  // Polling every 5 seconds for real-time user and avatar freshness
  useEffect(() => {
    if (!isOwner) return;
    fetchUsers(query.trim());
    const interval = setInterval(() => {
      fetchUsers(query.trim());
    }, 5000);
    return () => clearInterval(interval);
  }, [isOwner, query, fetchUsers]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      fetchUsers();
      return;
    }
    fetchUsers(query.trim());
  };

  const handleOpenUser = (u: BorrowerCardData) => {
    setSelectedUserId(u.id);
    setSelectedUserObj({
      id: u.id,
      username: u.username,
      displayName: u.displayName || u.username,
      avatarUrl: u.avatarUrl,
      role: u.role,
    });
    setIsModalOpen(true);
  };

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (filter === 'due') return u.totalDue > 0;
      if (filter === 'paid') return u.totalPaid > 0;
      return true;
    });
  }, [usersList, filter]);

  if (!isLoaded || !isOwner) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 max-w-7xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Borrower Search
          </h1>
        </div>

        <button
          onClick={() => fetchUsers(query)}
          disabled={searching || loading}
          className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/[0.08] text-xs font-medium flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${searching || loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-neutral-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by discord user"
            className="w-full bg-[#121214] border border-white/[0.08] rounded-2xl pl-12 pr-28 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all shadow-inner"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                fetchUsers('');
              }}
              className="absolute right-24 text-neutral-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={searching}
            className="absolute right-2 px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Lookup</span>
          </button>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-white text-black font-semibold'
              : 'bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          All Users ({usersList.length})
        </button>
        <button
          onClick={() => setFilter('due')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            filter === 'due'
              ? 'bg-amber-400 text-black font-semibold'
              : 'bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          Pending Debt ({usersList.filter((u) => u.totalDue > 0).length})
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            filter === 'paid'
              ? 'bg-emerald-500 text-black font-semibold'
              : 'bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          Paid Back ({usersList.filter((u) => u.totalPaid > 0).length})
        </button>
      </div>

      {/* User Rounded Column List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-500">
          <Loader2 className="w-7 h-7 animate-spin text-neutral-400" />
          <span className="text-sm">Loading registered borrowers...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-[#121214] border border-white/[0.06] p-8">
          <User className="w-10 h-10 mx-auto text-neutral-600 mb-3" />
          <h3 className="text-base font-semibold text-white">No users found</h3>
          <p className="text-xs text-neutral-400 mt-1">
            {query ? `No matching users found for "${query}". You can enter a full 18-digit Discord ID to query anyone on Discord.` : 'No borrowers recorded yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredUsers.map((u) => {
            return (
              <div
                key={u.id}
                onClick={() => handleOpenUser(u)}
                className="p-3.5 sm:px-5 rounded-2xl bg-[#121214] border border-white/[0.06] hover:border-white/20 hover:bg-[#161619] transition-all cursor-pointer group flex items-center justify-between gap-4 select-none"
              >
                {/* Left: Avatar + Names */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-full border border-white/10 overflow-hidden bg-neutral-800 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                      alt={u.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-white truncate">
                        {u.displayName || u.username}
                      </h4>
                      {u.role === 'owner' && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold shrink-0">
                          OWNER
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 truncate">
                      @{u.username.toLowerCase()}
                    </p>
                  </div>
                </div>

                {/* Right: Metrics */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="bg-white/[0.03] border border-white/[0.05] px-2.5 py-1 rounded-xl text-center">
                    <span className="text-[9px] text-neutral-500 block uppercase font-medium">Loans</span>
                    <span className="text-xs font-bold text-white">{u.totalLoans}</span>
                  </div>

                  <div className="bg-emerald-500/[0.04] border border-emerald-500/10 px-2.5 py-1 rounded-xl text-center">
                    <span className="text-[9px] text-emerald-400/80 block uppercase font-medium">Paid</span>
                    <span className="text-xs font-bold text-emerald-400">${u.totalPaid.toFixed(0)}</span>
                  </div>

                  <div className={`px-2.5 py-1 rounded-xl text-center ${
                    u.totalDue > 0 
                      ? 'bg-amber-500/[0.06] border border-amber-500/15 text-amber-400' 
                      : 'bg-white/[0.02] border border-white/[0.04] text-neutral-400'
                  }`}>
                    <span className="text-[9px] block uppercase font-medium opacity-70">Due</span>
                    <span className="text-xs font-bold">${u.totalDue.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* User Profile Overlay Modal */}
      <UserProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={selectedUserId}
        initialUser={selectedUserObj}
        onLoanUpdated={() => fetchUsers(query)}
      />
    </div>
  );
}
