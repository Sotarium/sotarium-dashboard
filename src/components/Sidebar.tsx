'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Coins,
  Wallet,
  Inbox,
  LogOut,
  Search
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, isOwner, isLoaded, logout } = useAuth();

  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 flex flex-col justify-between p-4 bg-black select-none z-40 border-r border-white/[0.04]">
      {/* Top Section */}
      <div className="space-y-4">
        {/* Brand Watermark / Logo */}
        <div className="px-3 pt-1 pb-1">
          <Link href="/" className="inline-block transition-opacity hover:opacity-85">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/sotarium-watermark.png" 
              alt="Sotarium" 
              className="h-10 w-auto object-contain select-none"
            />
          </Link>
        </div>

        {/* General Nav */}
        <div className="space-y-1">
          {/* Home Tab: Visible for Admins & Owners ONLY */}
          {isAdmin && (
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
          )}

          {/* House Bal Tab: Publicly Visible to Everyone */}
          <Link
            href="/house-balance"
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
              pathname === '/house-balance' 
                ? 'bg-white text-black font-semibold shadow-sm' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>House Bal</span>
          </Link>

          {/* Ask loan Tab: Visible to Everyone */}
          <Link
            href="/ask-loan"
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
              pathname === '/ask-loan' 
                ? 'bg-white text-black font-semibold shadow-sm' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Ask loan</span>
          </Link>
        </div>

        {/* Manage Section: Requests, Loans & Roadmap - Visible for Admin & Owner ONLY */}
        {isAdmin && (
          <div className="space-y-1">
            <div className="px-4 text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
              <span>Manage</span>
            </div>

            {/* Requests Tab */}
            <Link
              href="/requests"
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                pathname === '/requests' 
                  ? 'bg-white text-black font-semibold shadow-sm' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Requests</span>
            </Link>

            {/* Loans Tab */}
            <Link
              href="/loans"
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                pathname === '/loans' 
                  ? 'bg-white text-black font-semibold shadow-sm' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
              }`}
            >
              <span
                className="w-4 h-4 inline-block bg-current shrink-0 transition-colors"
                style={{
                  maskImage: 'url(/icons/loan.png)',
                  WebkitMaskImage: 'url(/icons/loan.png)',
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                }}
              />
              <span>Loans</span>
            </Link>

            {/* Search Tab - Owner ONLY */}
            {isOwner && (
              <Link
                href="/search"
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                  pathname === '/search' 
                    ? 'bg-white text-black font-semibold shadow-sm' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Section */}
      <div className="space-y-2 pt-4 border-t border-white/[0.04]">
        {/* User Profile Pill */}
        {user ? (
          <div 
            onClick={logout}
            title="Click to log out"
            className="mt-3 p-2 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900 border border-white/[0.04] flex items-center justify-between cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatar || 'https://cdn.discordapp.com/avatars/1079074717799030824/64db63e7b0bcbe6b841ba40535473949.png?size=128'}
                alt={user.username}
                className="w-7 h-7 rounded-full border border-white/[0.08] object-cover"
              />
              <div className="leading-tight">
                <div className="text-xs font-medium text-white truncate max-w-[120px]">
                  {user.username}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono capitalize">
                  {user.role || (isOwner ? 'Owner' : isAdmin ? 'Admin' : 'Member')}
                </div>
              </div>
            </div>
            <LogOut className="w-3.5 h-3.5 text-neutral-500 group-hover:text-red-400 transition-colors" />
          </div>
        ) : !isLoaded ? (
          <div className="mt-3 h-11 rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />
        ) : (
          <Link
            href="/login"
            className="mt-3 w-full py-2 px-3 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            Sign in with Discord
          </Link>
        )}
      </div>
    </aside>
  );
}
