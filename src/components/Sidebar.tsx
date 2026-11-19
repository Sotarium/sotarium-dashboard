'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  ShieldCheck, 
  UploadCloud, 
  Wrench, 
  Users, 
  BookOpen, 
  Settings, 
  ExternalLink,
  ChevronsUpDown,
  Lock
} from 'lucide-react';
import { useAuth, ADMIN_DISCORD_ID } from '@/lib/auth';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 flex flex-col justify-between p-4 bg-black select-none z-40 border-r border-white/[0.04]">
      {/* Top Section */}
      <div className="space-y-6">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-3 py-2 mt-1 group">
          <div className="w-6 h-6 relative flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M3.6 9h16.8" />
              <path d="M3.6 15h16.8" />
              <ellipse cx="12" cy="12" rx="4" ry="9" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight text-white font-sans">soteria</span>
        </Link>

        {/* General Nav */}
        <div className="space-y-1">
          <Link
            href="/"
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
              pathname === '/' 
                ? 'bg-white text-black font-semibold shadow-sm' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>

        {/* Section: Build (Protected for Admin Discord ID: 1079074717799030824) */}
        <div className="space-y-1">
          <div className="px-4 flex items-center justify-between text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
            <span>Build</span>
            {!isAdmin && (
              <span className="flex items-center gap-1 text-[10px] text-amber-500/80 font-normal normal-case">
                <Lock className="w-2.5 h-2.5" /> VIP
              </span>
            )}
          </div>
          <Link
            href="/loans"
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
              pathname === '/loans' 
                ? 'bg-white text-black font-semibold shadow-sm' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Loans</span>
            {!isAdmin && <Lock className="w-3 h-3 ml-auto text-neutral-600" />}
          </Link>
          <Link
            href="/roadmap"
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
              pathname === '/roadmap' 
                ? 'bg-white text-black font-semibold shadow-sm' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Roadmap</span>
            {!isAdmin && <Lock className="w-3 h-3 ml-auto text-neutral-600" />}
          </Link>
          <div className="w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/60 cursor-pointer">
            <Wrench className="w-4 h-4" />
            <span>Utilities</span>
          </div>
        </div>

        {/* Section: Account (Products and Billing removed) */}
        <div className="space-y-1">
          <div className="px-4 text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Account
          </div>
          <Link
            href="/referral"
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
              pathname === '/referral' 
                ? 'bg-white text-black font-semibold shadow-sm' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Referral</span>
          </Link>
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="space-y-2 pt-4 border-t border-white/[0.04]">
        <a
          href="https://soteria.rip/documentation"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-between px-4 py-2 rounded-full text-[13px] font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/60"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-4 h-4" />
            <span>Documentation</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
        </a>

        <Link
          href="/settings"
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
            pathname === '/settings' 
              ? 'bg-white text-black font-semibold shadow-sm' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>

        {/* User Profile Pill showing Discord ID */}
        <div className="mt-3 p-2 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900 border border-white/[0.04] flex items-center justify-between cursor-pointer transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center">
              D
            </div>
            <div className="leading-tight">
              <div className="text-xs font-medium text-white truncate max-w-[130px]">
                {user?.id === ADMIN_DISCORD_ID ? 'Admin (107907...)' : 'Guest'}
              </div>
              <div className="text-[10px] text-neutral-400 font-mono">
                {user?.id ? user.id.slice(0, 10) + '...' : 'Not signed in'}
              </div>
            </div>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-500" />
        </div>
      </div>
    </aside>
  );
}
