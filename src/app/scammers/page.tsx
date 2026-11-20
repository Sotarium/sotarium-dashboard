'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, RefreshCw, Info, X } from 'lucide-react';
import UserProfileModal, { type UserProfileData } from '@/components/UserProfileModal';

function ScammerInfoOverlay({ scammer, onClose }: { scammer: ScammerEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-[#111113] border border-white/[0.08] rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/[0.06] text-neutral-500 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <div className="w-16 h-16 rounded-full border-2 border-yellow-500/40 overflow-hidden bg-neutral-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={scammer.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
              alt={scammer.userName}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
            />
          </div>
          <div className="text-center">
            <div className="text-base font-bold text-white">{scammer.userName}</div>
            <span className="text-[9px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Scammer
            </span>
          </div>
        </div>

        {/* Info text */}
        <div className="bg-yellow-500/[0.06] border border-yellow-500/20 rounded-xl px-4 py-3 text-center">
          <p className="text-sm text-neutral-200 leading-relaxed">
            <span className="font-bold text-white">{scammer.userName}</span> scammed{' '}
            <span className="font-bold text-yellow-400">${scammer.totalDue.toFixed(2)}</span> with{' '}
            <span className="font-bold text-white">{scammer.overdueDays} day{scammer.overdueDays !== 1 ? 's' : ''}</span> past payout deadline.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
            <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Borrowed</div>
            <div className="text-sm font-bold text-white">${scammer.principal.toFixed(2)}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
            <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Total Due</div>
            <div className="text-sm font-bold text-yellow-400">${scammer.totalDue.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
function CautionSign({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 361.117 361.117" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M359.568,327.246L191.511,21.818c-2.197-3.993-6.395-6.474-10.952-6.474c-4.558,0-8.754,2.481-10.952,6.474L1.549,327.246c-2.131,3.872-2.058,8.582,0.191,12.388c2.249,3.805,6.34,6.139,10.76,6.139h336.117c4.421,0,8.512-2.334,10.761-6.139C361.627,335.828,361.699,331.118,359.568,327.246z M33.646,320.772L180.559,53.773l146.913,266.999H33.646z"/>
      <path d="M164.894,143.085v90.351c0,8.65,7.014,15.665,15.665,15.665c8.65,0,15.665-7.015,15.665-15.665v-90.351c0-8.651-7.015-15.665-15.665-15.665C171.908,127.42,164.894,134.435,164.894,143.085z"/>
      <path d="M180.559,265.364c-9.097,0-16.5,7.399-16.5,16.5c0,9.098,7.403,16.5,16.5,16.5c9.097,0,16.5-7.402,16.5-16.5C197.059,272.764,189.655,265.364,180.559,265.364z"/>
    </svg>
  );
}

interface ScammerEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  principal: number;
  totalDue: number;
  cryptoCurrency: string;
  dueDate: string;
  overdueDays: number;
  reason?: string;
  status: 'scammer' | 'overdue';
}

export default function HallOfShamePage() {
  const [scammers, setScammers] = useState<ScammerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedScammer, setSelectedScammer] = useState<ScammerEntry | null>(null);
  const fetchScammers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hall-of-shame');
      if (res.ok) {
        const data = await res.json();
        setScammers(data.scammers || []);
      }
    } catch (err) {
      console.error('Failed to load hall of shame:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScammers(); }, []);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openProfile = (scammer: ScammerEntry) => {
    setSelectedScammer(scammer);
  };

  const filtered = scammers.filter((s) => {
    if (!query) return true;
    const lower = query.toLowerCase();
    return s.userName.toLowerCase().includes(lower) || s.userId.includes(lower);
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
            <CautionSign className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Scammers</h1>
            <p className="text-xs text-neutral-500">{scammers.length} defaulted loan{scammers.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={fetchScammers}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/[0.08] text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      {scammers.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username or Discord ID..."
            className="w-full bg-[#121214] border border-white/[0.08] rounded-full pl-11 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500/40 transition-all"
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-500">
          <Loader2 className="w-7 h-7 animate-spin text-neutral-400" />
          <span className="text-sm">Scanning ledger...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-neutral-600 text-sm">No scammers found.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((scammer, i) => (
            <div
              key={scammer.id}
              className="soteria-card p-4 border border-yellow-500/10 hover:border-yellow-500/25 transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left — rank + avatar + identity */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[11px] font-bold text-neutral-600 w-5 text-center shrink-0">#{i + 1}</span>
                  <div className="w-10 h-10 rounded-full border border-yellow-500/30 overflow-hidden bg-neutral-900 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={scammer.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                      alt={scammer.userName}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white truncate">{scammer.userName}</span>
                    </div>
                  </div>
                </div>

                {/* Right — scammed amount + info */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-medium mb-0.5">Scammed</div>
                    <div className="text-base font-bold text-yellow-400">${scammer.totalDue.toFixed(2)}</div>
                  </div>
                  <button
                    onClick={() => openProfile(scammer)}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-neutral-400 hover:text-white transition-all cursor-pointer"
                    title="View profile"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scammer Info Overlay */}
      {selectedScammer && (
        <ScammerInfoOverlay scammer={selectedScammer} onClose={() => setSelectedScammer(null)} />
      )}
    </div>
  );
}
