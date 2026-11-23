'use client';

import React from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export type SecurityOverlayType = 'scammer' | 'alt' | null;

interface SecurityOverlayProps {
  type: SecurityOverlayType;
  matchedAccountName?: string;
  onClose?: () => void;
}

export default function SecurityOverlay({ type, matchedAccountName, onClose }: SecurityOverlayProps) {
  const { logout } = useAuth();

  if (!type) return null;

  const isScammer = type === 'scammer';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#121212] border border-white/[0.08] rounded-3xl p-6 md:p-8 text-center shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Glow behind the badge */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-28 h-28 bg-red-600/20 blur-2xl rounded-full pointer-events-none" />

        {/* Icon from user upload */}
        <div className="flex justify-center relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/alert-circle.png"
            alt="Security Alert"
            className="w-20 h-20 drop-shadow-[0_10px_20px_rgba(239,68,68,0.35)] object-contain select-none"
          />
        </div>

        {/* Text Section */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
            {isScammer ? 'You Scammed!' : 'You Alted!'}
          </h2>
          <p className="text-sm font-medium text-neutral-400 font-sans">
            Please use your real acc
          </p>
        </div>

        {/* Details Card */}
        <div className="p-3.5 rounded-2xl bg-[#171717] border border-white/[0.05] text-xs text-neutral-400 text-left space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-neutral-500">
            <span>DETECTION SHIELD</span>
            <span className="text-red-400 font-semibold">{isScammer ? 'BLACKLISTED' : 'ALT_ACCOUNT'}</span>
          </div>
          <div className="text-neutral-300">
            {isScammer
              ? 'This device or wallet is linked to an account with an unpaid / defaulted loan.'
              : matchedAccountName
              ? `Hardware / device profile is already connected to @${matchedAccountName}.`
              : 'Device profile is associated with another existing account.'}
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => {
              if (logout) logout();
              else window.location.href = '/login';
            }}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm font-sans"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch to Real Account</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors font-sans"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
