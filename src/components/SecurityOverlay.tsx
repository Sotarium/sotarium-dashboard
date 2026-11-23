'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-[360px] bg-[#0c0c0c] border border-white/[0.06] rounded-[28px] p-8 text-center shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
        
        {/* Clean Circular Red Alert Badge without square box */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute w-24 h-24 bg-red-600/15 blur-2xl rounded-full pointer-events-none" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/alert-circle.png"
            alt="Security Alert"
            className="w-20 h-20 object-contain rounded-full select-none"
          />
        </div>

        {/* Minimal High-End Typography */}
        <div className="space-y-1.5 mb-7">
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
            {isScammer ? 'You Scammed!' : 'You Alted!'}
          </h2>
          <p className="text-xs text-neutral-400 font-sans tracking-wide">
            Please use your real acc
          </p>
        </div>

        {/* Clean pill button */}
        <div className="w-full space-y-2">
          <button
            onClick={() => {
              if (logout) logout();
              else window.location.href = '/login';
            }}
            className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] font-sans"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch to Real Account</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-2 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors font-sans"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
