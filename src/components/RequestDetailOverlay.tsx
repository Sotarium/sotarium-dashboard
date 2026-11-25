'use client';
import { getTotalDue } from '@/lib/interest';
import React, { useState } from 'react';
import { X, Wallet, Copy, Check } from 'lucide-react';

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

const CRYPTO_METADATA: Record<string, { name: string; icon: string; color: string; badgeBg: string }> = {
  SOL: {
    name: 'Solana',
    icon: '/assets/sol.svg',
    color: '#14F195',
    badgeBg: 'rgba(20, 241, 149, 0.1)',
  },
  BTC: {
    name: 'Bitcoin',
    icon: '/assets/btc.svg',
    color: '#F7931A',
    badgeBg: 'rgba(247, 147, 26, 0.1)',
  },
  ETH: {
    name: 'Ethereum',
    icon: '/assets/eth.svg',
    color: '#627EEA',
    badgeBg: 'rgba(98, 126, 234, 0.1)',
  },
  LTC: {
    name: 'Litecoin',
    icon: '/assets/ltc.svg',
    color: '#345D9D',
    badgeBg: 'rgba(52, 93, 157, 0.1)',
  },
};

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

  const coinKey = (req.crypto_currency || 'SOL').toUpperCase();
  const coinMeta = CRYPTO_METADATA[coinKey] || {
    name: coinKey,
    icon: `/assets/${coinKey.toLowerCase()}.svg`,
    color: '#FFFFFF',
    badgeBg: 'rgba(255, 255, 255, 0.08)',
  };

  const totalRepayment = getTotalDue(req.amount);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[400px] bg-[#0c0c0e] border border-white/[0.08] rounded-[32px] p-7 shadow-2xl animate-in zoom-in-95 duration-200 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-neutral-400 hover:text-white transition-all cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: User Profile Info */}
        <div className="flex flex-col items-center pt-2">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full border-2 border-white/10 overflow-hidden bg-neutral-900 shadow-xl">
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
            {/* Currency badge pinned to avatar */}
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#121214] border border-white/15 p-1 shadow-lg flex items-center justify-center"
              title={coinMeta.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coinMeta.icon}
                alt={coinMeta.name}
                className="w-4 h-4 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight">{req.user_name}</h3>
        </div>

        {/* Two-Column Clean Spec Cards: Principal vs Total Repayment */}
        <div className="grid grid-cols-2 gap-3">
          {/* Principal Card with Coin Icon */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-neutral-400">Principal</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coinMeta.icon} alt={coinMeta.name} className="w-3 h-3 object-contain" />
                <span className="text-[10px] font-bold text-white tracking-wider">{coinKey}</span>
              </div>
            </div>
            <div>
              <div className="text-xl font-extrabold text-white tracking-tight">
                ${req.amount.toFixed(2)}
              </div>
              <div className="text-[10px] text-neutral-500 font-medium mt-0.5">
                Requested in {coinMeta.name}
              </div>
            </div>
          </div>

          {/* Total Repayment Card */}
          <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-emerald-400/90">Total Repayment</span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                +25%
              </span>
            </div>
            <div>
              <div className="text-xl font-extrabold text-emerald-400 tracking-tight">
                ${totalRepayment.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Receiving Wallet Address Card */}
        {displayAddress ? (
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center text-neutral-400">
                  <Wallet className="w-3 h-3" />
                </div>
                <span className="text-xs font-semibold text-white">Receiving {coinMeta.name} Address</span>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white transition-all text-xs font-medium cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px] font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-neutral-400" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-white/[0.04] text-[11px] font-mono text-neutral-300 break-all select-all leading-relaxed">
              {displayAddress}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
