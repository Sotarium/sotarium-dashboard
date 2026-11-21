'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const referralLink = "https://sotarium.vercel.app/signup?ref=pPAScN-q";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Referral</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Earn free balance by inviting other members to Sotarium.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Your referral link */}
        <div className="lg:col-span-2 soteria-card p-6 flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Your referral link</h3>
              <span className="text-xs text-neutral-500 hover:text-neutral-400 cursor-pointer">How credits work</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              Share this link. They get 15% off their first purchase. When they pay for a plan or balance, you earn 20% of what they paid as referral credits, currently worth $0.50 each.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#171717] border border-white/[0.04] flex items-center justify-between gap-3">
            <span className="text-xs font-mono text-neutral-300 truncate">{referralLink}</span>
            <button
              onClick={copyLink}
              className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors shrink-0"
            >
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </div>

        {/* Right Col: Available balance */}
        <div className="soteria-card p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs text-neutral-400 font-medium mb-1">Available balance</div>
            <div className="text-3xl font-bold text-white tracking-tight">0 <span className="text-base font-normal text-neutral-400">credits</span></div>
            <div className="text-xs text-neutral-500 mt-0.5">≈ $0.00</div>
          </div>

          <div className="space-y-2 mt-6">
            <button disabled className="w-full py-2 rounded-full bg-neutral-800 text-neutral-500 font-semibold text-xs cursor-not-allowed">
              Convert to balance
            </button>
            <button disabled className="w-full py-2 rounded-full bg-neutral-900 text-neutral-500 font-semibold text-xs cursor-not-allowed">
              Cash out
            </button>
            <p className="text-[10px] text-neutral-500 text-center leading-tight">
              Cashouts are handled manually via Discord and can take longer than instant token conversion.
            </p>
          </div>
        </div>
      </div>

      {/* Referrals List Card */}
      <div className="soteria-card p-12 text-center space-y-2">
        <h3 className="text-base font-semibold text-white">No referrals yet</h3>
        <p className="text-xs text-neutral-400">Share your link above to start earning credits.</p>
      </div>
    </div>
  );
}
