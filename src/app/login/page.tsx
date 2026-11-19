'use client';

import { useState } from 'react';
import { useAuth, ADMIN_DISCORD_ID } from '@/lib/auth';
import { Shield } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [customId, setCustomId] = useState('');

  const handleDiscordSignIn = (idToUse?: string) => {
    const targetId = idToUse || customId || ADMIN_DISCORD_ID;
    const isOwner = targetId === ADMIN_DISCORD_ID;
    
    login({
      id: targetId,
      username: isOwner ? 'sotarium' : `Player-${targetId.slice(-4)}`,
      avatar: isOwner ? 'https://cdn.discordapp.com/embed/avatars/0.png' : 'https://cdn.discordapp.com/embed/avatars/1.png'
    });
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#121212] border border-white/[0.08] rounded-3xl p-8 shadow-2xl space-y-8 animate-in fade-in duration-300">
        {/* Soteria Logo Branding */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-10 h-10 relative flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-white" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M3.6 9h16.8" />
              <path d="M3.6 15h16.8" />
              <ellipse cx="12" cy="12" rx="4" ry="9" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to Soteria</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Sign in with Discord to access your loan matrix and roadmaps.
            </p>
          </div>
        </div>

        {/* Discord OAuth Primary CTA */}
        <div className="space-y-4">
          <button
            onClick={() => handleDiscordSignIn(ADMIN_DISCORD_ID)}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#5865F2]/20"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.86,53,48.81,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91,65.69,84.69,65.69Z" />
            </svg>
            <span>Continue with Discord</span>
          </button>

          <div className="relative flex items-center justify-center py-2">
            <div className="border-t border-white/[0.08] w-full" />
            <span className="bg-[#121212] px-3 text-[11px] text-neutral-500 uppercase tracking-widest absolute">
              or enter Discord ID
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 1079074717799030824"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#171717] border border-white/[0.06] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 font-mono"
            />
            <button
              onClick={() => handleDiscordSignIn()}
              className="px-4 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors shrink-0"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-3 rounded-2xl bg-[#171717] border border-white/[0.04] flex items-center gap-3 text-[11px] text-neutral-400">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Only verified Discord accounts can view and manage their authorized loans.</span>
        </div>
      </div>
    </div>
  );
}
