'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { ShieldAlert, Search, UserCheck } from 'lucide-react';

interface BypassUser {
  id: string;
  username: string;
  avatar?: string;
  role: string;
}

// $1, $5, $10, and then bounds of $25 up to $250
const TIERS = [1, 5, 10, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250];

function GreenCheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 72 72"
      className={className}
      style={{ fill: '#40C057' }}
    >
      <path d="M 36 12 C 22.75 12 12 22.75 12 36 C 12 49.25 22.75 60 36 60 C 49.25 60 60 49.25 60 36 C 60 33.41 59.590313 30.919844 58.820312 28.589844 L 51.529297 39.859375 C 51.506297 39.952375 51.482031 40.045672 51.457031 40.138672 C 49.640031 46.967672 43.409 52 36 52 C 27.16 52 20 44.84 20 36 C 20 27.16 27.16 20 36 20 C 38.54 20 40.940312 20.590625 43.070312 21.640625 L 47.429688 14.900391 C 44.029687 13.050391 40.14 12 36 12 z M 53.121094 17.126953 C 51.676768 17.155645 50.272109 17.877266 49.427734 19.181641 L 39.154297 35.058594 L 33.966797 29.111328 C 32.332797 27.237328 29.488187 27.045687 27.617188 28.679688 C 25.744187 30.313688 25.551547 33.155344 27.185547 35.027344 L 36.298828 45.472656 C 37.156828 46.455656 38.394453 47.015625 39.689453 47.015625 C 39.796453 47.015625 39.902766 47.010906 40.009766 47.003906 C 41.418766 46.902906 42.698797 46.147937 43.466797 44.960938 L 56.984375 24.070312 C 58.334375 21.984313 57.737391 19.198656 55.650391 17.847656 C 54.868891 17.341781 53.987689 17.109738 53.121094 17.126953 z" />
    </svg>
  );
}

export default function BypassPage() {
  const { user, isOwner, isLoaded } = useAuth();
  const [users, setUsers] = useState<BypassUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bypass?requesterId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOwner) {
      fetchUsers();
    }
  }, [isOwner, fetchUsers]);

  // Extract user's max limit from role string:
  // e.g. "member:limit:250" -> 250, "owner" -> 250, default -> 1
  const getUserMaxLimit = (role: string): number => {
    if (role.startsWith('owner') || role.startsWith('admin') || role.includes('bypass')) {
      return 250;
    }
    const match = role.match(/:limit:(\d+)/);
    if (match) return parseInt(match[1], 10);
    return 1;
  };

  const handleToggleTier = async (targetUser: BypassUser, tier: number) => {
    if (!user?.id) return;
    setUpdatingId(targetUser.id);

    const currentMax = getUserMaxLimit(targetUser.role);
    // If clicking current max limit, step back to $1
    const newLimit = currentMax === tier ? 1 : tier;

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === targetUser.id) {
          const baseRole = u.role.split(':')[0] || 'member';
          return {
            ...u,
            role: newLimit > 1 ? `${baseRole}:limit:${newLimit}` : baseRole,
          };
        }
        return u;
      })
    );

    try {
      await fetch('/api/bypass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: user.id,
          targetUserId: targetUser.id,
          targetUsername: targetUser.username,
          maxLimit: newLimit,
        }),
      });
    } catch (e) {
      console.error('Error toggling limit:', e);
      fetchUsers();
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoaded && !isOwner) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-sm text-neutral-400 max-w-md">
          Only the owner can manage loan tier limits.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter((u) =>
    (u.username && u.username.toLowerCase().includes(search.toLowerCase())) ||
    u.id.includes(search)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Bypass</h1>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#1e1e20] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors"
          />
        </div>
      </div>

      {/* Gray GUI Table Card */}
      <div className="bg-[#18181a] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-4">

        {loading ? (
          <div className="text-center py-12 text-neutral-400 text-xs">Loading borrower roster...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 text-xs">
            {search ? 'No users matched your search.' : 'No users found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-neutral-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4 min-w-[200px] sticky left-0 bg-[#18181a] z-10">User</th>
                  {TIERS.map((tier) => (
                    <th key={tier} className="py-3 px-2 text-center min-w-[56px]">
                      ${tier}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right min-w-[100px]">Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredUsers.map((u) => {
                  const maxLimit = getUserMaxLimit(u.role);
                  const isUpdating = updatingId === u.id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* User Profile Info */}
                      <td className="py-3.5 px-4 sticky left-0 bg-[#18181a] z-10 group-hover:bg-[#1b1b1e] transition-colors">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={u.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                            alt={u.username}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full border border-white/[0.1] object-cover bg-neutral-900 shrink-0"
                          />
                          <div className="leading-tight truncate max-w-[150px]">
                            <div className="font-semibold text-white text-xs truncate">
                              {u.username || 'User'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Checkmark Columns for each tier */}
                      {TIERS.map((tier) => {
                        const isChecked = maxLimit >= tier;

                        return (
                          <td key={tier} className="py-3.5 px-2 text-center">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleToggleTier(u, tier)}
                              className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-[#40C057]/15 border border-[#40C057]/40 hover:bg-[#40C057]/25 shadow-sm'
                                  : 'bg-[#222226] border border-white/[0.06] hover:border-white/20'
                              } disabled:opacity-50`}
                              title={`Set max allowed loan to $${tier}`}
                            >
                              {isChecked ? (
                                <GreenCheckIcon className="w-5 h-5 drop-shadow-[0_0_6px_rgba(64,192,87,0.4)]" />
                              ) : (
                                <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
                              )}
                            </button>
                          </td>
                        );
                      })}

                      {/* Summary */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-xs font-semibold text-neutral-300 font-sans">
                          ${maxLimit}
                        </span>
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
  );
}
