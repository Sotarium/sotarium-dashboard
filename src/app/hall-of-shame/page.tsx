'use client';

import { useState, useEffect } from 'react';
import { 
  Skull, 
  ShieldCheck, 
  AlertTriangle, 
  Copy, 
  Check, 
  Search, 
  Loader2, 
  Coins, 
  Clock, 
  RefreshCw 
} from 'lucide-react';

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

  useEffect(() => {
    fetchScammers();
  }, []);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = scammers.filter((s) => {
    if (!query) return true;
    const lower = query.toLowerCase();
    return s.userName.toLowerCase().includes(lower) || s.userId.includes(lower);
  });

  const totalDefaulted = scammers.reduce((acc, s) => acc + s.totalDue, 0);

  return (
    <div className="min-h-screen bg-black text-white p-8 max-w-7xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-500/20 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <Skull className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Hall of Shame
            </h1>
            <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Scammer Blacklist
            </span>
          </div>
          <p className="text-neutral-400 text-sm mt-1.5">
            Public registry exposing individuals who defaulted on loans and failed to pay by their due date.
          </p>
        </div>

        <button
          onClick={fetchScammers}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/[0.08] text-xs font-medium flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#131112] border border-red-500/20 p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Total Scammers</span>
          <div className="text-2xl font-bold text-red-400 mt-1">{scammers.length}</div>
        </div>

        <div className="bg-[#131112] border border-red-500/20 p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Unrecovered Debt</span>
          <div className="text-2xl font-bold text-white mt-1">${totalDefaulted.toFixed(2)}</div>
        </div>

        <div className="bg-[#131112] border border-red-500/20 p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Blacklist Policy</span>
          <div className="text-sm font-semibold text-red-400 mt-1 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Permanent Default</span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      {scammers.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scammers by username or Discord ID..."
            className="w-full bg-[#121214] border border-white/[0.08] rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500/40 transition-all"
          />
        </div>
      )}

      {/* Scammers List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-500">
          <Loader2 className="w-7 h-7 animate-spin text-neutral-400" />
          <span className="text-sm">Scanning protocol ledger...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-[#121214] border border-white/[0.06] p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No Scammers on Record</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            {query 
              ? `No registered scammers match "${query}".`
              : 'The protocol ledger is clean! All borrowers have either settled their loans or are currently within their agreed grace period.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((scammer) => (
            <div
              key={scammer.id}
              className="p-4 sm:px-6 rounded-2xl bg-[#141011] border border-red-500/20 hover:border-red-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* User Identity */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full border-2 border-red-500/40 overflow-hidden bg-neutral-900 shadow-lg shadow-red-950/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={scammer.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                      alt={scammer.userName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full border border-black shadow">
                    SCAM
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">
                      {scammer.userName}
                    </h4>
                    <span className="text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full shrink-0">
                      DEFAULTED
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-neutral-400">
                      {scammer.userId}
                    </span>
                    <button
                      onClick={() => handleCopy(scammer.userId)}
                      className="p-1 hover:bg-white/10 rounded text-neutral-500 hover:text-white transition-colors cursor-pointer"
                      title="Copy Discord ID to blacklist"
                    >
                      {copiedId === scammer.userId ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Debt & Overdue Metrics */}
              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 block uppercase font-medium">Stolen / Due</span>
                  <span className="text-base font-bold text-red-400 font-mono">
                    ${scammer.totalDue.toFixed(2)}
                  </span>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl text-center">
                  <span className="text-[9px] text-red-400/80 block uppercase font-semibold">Overdue</span>
                  <span className="text-xs font-bold text-red-300">
                    {scammer.overdueDays}d ago
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
