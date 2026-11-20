'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Copy, 
  Check, 
  Search, 
  Loader2, 
  RefreshCw 
} from 'lucide-react';

function CautionSign({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 361.117 361.117" 
      fill="currentColor" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M359.568,327.246L191.511,21.818c-2.197-3.993-6.395-6.474-10.952-6.474c-4.558,0-8.754,2.481-10.952,6.474L1.549,327.246
        c-2.131,3.872-2.058,8.582,0.191,12.388c2.249,3.805,6.34,6.139,10.76,6.139h336.117c4.421,0,8.512-2.334,10.761-6.139
        C361.627,335.828,361.699,331.118,359.568,327.246z M33.646,320.772L180.559,53.773l146.913,266.999H33.646z"/>
      <path d="M164.894,143.085v90.351c0,8.65,7.014,15.665,15.665,15.665c8.65,0,15.665-7.015,15.665-15.665v-90.351
        c0-8.651-7.015-15.665-15.665-15.665C171.908,127.42,164.894,134.435,164.894,143.085z"/>
      <path d="M180.559,265.364c-9.097,0-16.5,7.399-16.5,16.5c0,9.098,7.403,16.5,16.5,16.5c9.097,0,16.5-7.402,16.5-16.5
        C197.059,272.764,189.655,265.364,180.559,265.364z"/>
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

  return (
    <div className="min-h-screen bg-black text-white p-8 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
            <CautionSign className="w-4 h-4 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Hall of Shame
          </h1>
          <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            scammers
          </span>
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

      {/* Search Input */}
      {scammers.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scammers by username or Discord ID..."
            className="w-full bg-[#121214] border border-white/[0.08] rounded-full pl-11 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500/40 transition-all"
          />
        </div>
      )}

      {/* Scammers List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-500">
          <Loader2 className="w-7 h-7 animate-spin text-neutral-400" />
          <span className="text-sm">Scanning protocol ledger...</span>
        </div>
      ) : filtered.length === 0 ? null : (
        <div className="flex flex-col gap-2">
          {filtered.map((scammer) => (
            <div
              key={scammer.id}
              className="py-2.5 px-4 sm:px-5 rounded-full bg-[#121214] border border-white/[0.06] hover:border-yellow-500/30 hover:bg-[#161619] transition-all flex items-center justify-between gap-4 select-none group"
            >
              {/* User Identity */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full border border-yellow-500/30 overflow-hidden bg-neutral-900 shrink-0">
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

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white truncate">
                      {scammer.userName}
                    </h4>
                    <span className="text-[9px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.2 rounded-full shrink-0">
                      DEFAULTED
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-neutral-400">
                      {scammer.userId}
                    </span>
                    <button
                      onClick={() => handleCopy(scammer.userId)}
                      className="p-0.5 hover:bg-white/10 rounded text-neutral-500 hover:text-white transition-colors cursor-pointer"
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

              {/* Scammed For & Overdue Columns */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Scammed For Column */}
                <div className="bg-yellow-500/[0.06] border border-yellow-500/20 px-3 py-1 rounded-full text-center">
                  <span className="text-[9px] text-yellow-400/80 block uppercase font-medium">Scammed For</span>
                  <span className="text-xs font-bold text-yellow-400 font-mono">
                    ${scammer.totalDue.toFixed(2)}
                  </span>
                </div>

                {/* Overdue Column */}
                <div className="bg-white/[0.03] border border-white/[0.05] px-3 py-1 rounded-full text-center">
                  <span className="text-[9px] text-neutral-500 block uppercase font-medium">Overdue</span>
                  <span className="text-xs font-bold text-white">
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
