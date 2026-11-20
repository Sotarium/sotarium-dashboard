'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  User, 
  Coins, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Shield,
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

  useEffect(() => {
    if (isOwner) {
      fetchUsers();
    }
  }, [isOwner, fetchUsers]);

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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Borrower Search
            </h1>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              OWNER ONLY
            </span>
          </div>
          <p className="text-neutral-400 text-sm mt-1">
            Search any borrower or Discord ID to inspect profile cards, total borrowed, paid back, and pending dues.
          </p>
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
            placeholder="Search by Discord Snowflake ID (e.g. 897149488928555049) or username..."
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

      {/* User Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => {
            return (
              <div
                key={u.id}
                onClick={() => handleOpenUser(u)}
                className="p-5 rounded-2xl bg-[#121214] border border-white/[0.06] hover:border-white/20 hover:bg-[#161619] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full border border-white/10 overflow-hidden bg-neutral-800 shrink-0">
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
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-white group-hover:text-white truncate">
                            {u.displayName || u.username}
                          </h4>
                          {u.role === 'owner' && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                              OWNER
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 truncate">
                          @{u.username.toLowerCase()}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {/* ID Tag */}
                  <div className="mt-3.5 bg-black/40 border border-white/[0.04] px-2.5 py-1 rounded-lg flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500 font-medium">Discord ID</span>
                    <span className="font-mono text-neutral-300">{u.id}</span>
                  </div>
                </div>

                {/* Metrics preview */}
                <div className="mt-4 pt-3 border-t border-white/[0.04] grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-neutral-500 block uppercase font-medium">Loans</span>
                    <span className="text-xs font-bold text-white">{u.totalLoans}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400/70 block uppercase font-medium">Paid</span>
                    <span className="text-xs font-bold text-emerald-400">${u.totalPaid.toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400/70 block uppercase font-medium">Due</span>
                    <span className="text-xs font-bold text-amber-400">${u.totalDue.toFixed(0)}</span>
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
