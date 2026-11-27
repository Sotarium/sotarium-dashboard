'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';

function CautionSign({ className = "w-3.5 h-3.5" }: { className?: string }) {
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

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, isAdmin, isOwner, isLoaded, logout } = useAuth();

  const navLinkClass = (href: string, activeVariant: 'default' | 'warning' = 'default') => {
    const isActive = pathname === href;
    if (activeVariant === 'warning') {
      return `w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all ${
        isActive
          ? 'bg-yellow-400 text-black font-semibold'
          : 'text-neutral-400 hover:text-yellow-400 hover:bg-white/[0.04]'
      }`;
    }
    return `w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all ${
      isActive
        ? 'bg-white text-black font-semibold'
        : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
    }`;
  };

  return (
    <aside className={`
      w-[260px] h-screen fixed left-0 top-0 flex flex-col justify-between px-4 py-5
      bg-black select-none z-40 border-r border-white/[0.05]
      transition-transform duration-300 ease-in-out font-sans
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0
    `}>
      {/* Top & Nav Scrollable Container */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Brand Watermark / Logo */}
        <div className="px-2 pb-5 flex items-center justify-between shrink-0">
          <Link href="/" className="inline-block transition-opacity hover:opacity-80" onClick={onClose}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sotarium-watermark.png"
              alt="Sotarium"
              className="h-9 w-auto object-contain select-none"
            />
          </Link>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-xl text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto space-y-5 pr-0.5">
          {/* Overview — Admin & Owner only */}
          {isAdmin && (
            <div className="space-y-1">
              <Link href="/" onClick={onClose} className={navLinkClass('/')}>
                <span>Home</span>
              </Link>
            </div>
          )}

          {/* Important */}
          <div className="space-y-1">
            <div className="px-3.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
              Important
            </div>
            <Link href="/scammers" onClick={onClose} className={navLinkClass('/scammers', 'warning')}>
              <CautionSign className="w-3.5 h-3.5 shrink-0" />
              <span>Scammers</span>
            </Link>
            <Link href="/trusted" onClick={onClose} className={navLinkClass('/trusted')}>
              <span>Trusted</span>
            </Link>
          </div>

          {/* Loan */}
          <div className="space-y-1">
            <div className="px-3.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
              Loan
            </div>
            <Link href="/ask-loan" onClick={onClose} className={navLinkClass('/ask-loan')}>
              <span>Ask Loan</span>
            </Link>
            <Link href="/payback" onClick={onClose} className={navLinkClass('/payback')}>
              <span>Payback</span>
            </Link>
            <Link href="/loans" onClick={onClose} className={navLinkClass('/loans')}>
              <span>Loans</span>
            </Link>
            <Link href="/paidback" onClick={onClose} className={navLinkClass('/paidback')}>
              <span>Paid Back</span>
            </Link>
          </div>

          {/* Manage — Admin & Owner only */}
          {isAdmin && (
            <div className="space-y-1">
              <div className="px-3.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                Manage
              </div>
              <Link href="/requests" onClick={onClose} className={navLinkClass('/requests')}>
                <span>Requests</span>
              </Link>
              {isOwner && (
                <>
                  <Link href="/search" onClick={onClose} className={navLinkClass('/search')}>
                    <span>Search</span>
                  </Link>
                  <Link href="/bypass" onClick={onClose} className={navLinkClass('/bypass')}>
                    <span>Bypass</span>
                  </Link>
                </>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Profile Card */}
      <div className="pt-4 border-t border-white/[0.05] shrink-0">
        {user ? (
          <div
            onClick={logout}
            title="Click to log out"
            className="p-2.5 rounded-2xl bg-[#121212] hover:bg-[#181818] border border-white/[0.05] flex items-center justify-between cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatar || 'https://cdn.discordapp.com/avatars/1079074717799030824/eff29387fdcf2ccdb9308cdd404bbed9.png?size=256'}
                alt={user.username}
                className="w-8 h-8 rounded-full border border-white/[0.08] object-cover shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                }}
              />
              <div className="min-w-0 leading-tight">
                <div className="text-[13px] font-semibold text-white truncate">
                  {user.username}
                </div>
                <div className="text-[11px] text-neutral-500">
                  {isOwner ? 'Owner' : isAdmin ? 'Admin' : 'Member'}
                </div>
              </div>
            </div>
            <LogOut className="w-3.5 h-3.5 text-neutral-500 group-hover:text-red-400 transition-colors shrink-0 ml-2" />
          </div>
        ) : !isLoaded ? (
          <div className="h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
        ) : (
          <Link
            href="/login"
            className="w-full py-2.5 px-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            Sign in with Discord
          </Link>
        )}
      </div>
    </aside>
  );
}
