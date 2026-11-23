import React, { useState } from 'react';
import { X, Wallet } from 'lucide-react';
import { getTotalDue } from '@/lib/interest';

interface LoanRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  amount: number;
  crypto_currency: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function RequestDetailOverlay({
  req,
  avatarUrl,
  onClose,
}: {
  req: LoanRequest;
  avatarUrl?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  // Extract address if formatted like "Addy: xyz" or "... | Addy: xyz"
  let displayAddress = '';
  if (req.reason && req.reason.includes('Addy:')) {
    const parts = req.reason.split('Addy:');
    displayAddress = parts[1]?.trim() || '';
  }

  const handleCopy = () => {
    if (!displayAddress) return;
    navigator.clipboard.writeText(displayAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="relative w-full max-w-[340px] bg-[#0c0c0e] border border-white/[0.08] rounded-[28px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/[0.08] text-neutral-500 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* User Avatar + Name */}
        <div className="flex flex-col items-center pt-1">
          <div className="w-16 h-16 rounded-full border border-white/10 overflow-hidden bg-neutral-900 shadow-xl mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl || req.user_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
              alt={req.user_name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
              }}
            />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">{req.user_name}</h3>
          <span className="text-[11px] font-mono text-neutral-500 mt-0.5">ID: {req.user_id}</span>
        </div>

        {/* Clean Minimalist Data Rows */}
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2.5 px-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <span className="text-xs text-neutral-400 font-sans">Principal</span>
            <span className="text-xs font-bold text-white font-sans">${req.amount.toFixed(2)} {req.crypto_currency}</span>
          </div>

          <div className="flex items-center justify-between py-2.5 px-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <span className="text-xs text-neutral-400 font-sans">Total Repayment</span>
            <span className="text-xs font-bold text-emerald-400 font-sans">${getTotalDue(req.amount).toFixed(2)}</span>
          </div>

          {displayAddress ? (
            <div className="py-2.5 px-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-400 font-sans flex items-center gap-1.5">
                  <Wallet className="w-3 h-3 text-neutral-400" />
                  <span>Receiving Address</span>
                </span>
                <button
                  onClick={handleCopy}
                  className="text-[10px] text-neutral-400 hover:text-white transition-colors cursor-pointer font-sans"
                >
                  {copied ? (
                    <span className="text-emerald-400 font-medium">Copied</span>
                  ) : (
                    <span>Copy</span>
                  )}
                </button>
              </div>
              <div className="text-[11px] font-mono text-neutral-300 break-all select-all leading-snug">
                {displayAddress}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
