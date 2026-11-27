'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
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

  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{ top: number; height: number; visible: boolean }>({
    top: 0,
    height: 36,
    visible: false,
  });

  const updateIndicator = useCallback(() => {
    const navEl = navRef.current;
    const activeEl = linkRefs.current[pathname];
    if (!navEl || !activeEl) {
      setIndicator((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    const navRect = navEl.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const top = activeRect.top - navRect.top + navEl.scrollTop;
    const height = activeRect.height;

    setIndicator({ top, height, visible: true });
  }, [pathname]);

  useEffect(() => {
    updateIndicator();
    const frame = requestAnimationFrame(updateIndicator);
    window.addEventListener('resize', updateIndicator);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [updateIndicator, isAdmin, isOwner, isLoaded]);

  const setLinkRef = (href: string) => (el: HTMLAnchorElement | null) => {
    linkRefs.current[href] = el;
  };

  const navLinkClass = (href: string, activeVariant: 'default' | 'warning' = 'default') => {
    const isActive = pathname === href;
    if (activeVariant === 'warning') {
      return `relative z-10 w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors duration-200 ${
        isActive
          ? 'text-yellow-300 font-semibold'
          : 'text-neutral-400 hover:text-yellow-300 hover:bg-white/[0.03]'
      }`;
    }
    return `relative z-10 w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors duration-200 ${
      isActive
        ? 'text-white font-semibold'
        : 'text-neutral-400 hover:text-white hover:bg-white/[0.03]'
    }`;
  };

  const isScammersActive = pathname === '/scammers';

  return (
    <aside className={`
      w-[260px] h-screen fixed left-0 top-0 flex flex-col justify-between p-4
      bg-black select-none z-40 border-r border-white/[0.05]
      transition-transform duration-300 ease-in-out font-sans
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0
    `}>
      {/* Top & Nav Scrollable Container */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Brand Watermark / Logo */}
        <div className="px-2 pt-1 pb-5 flex items-center justify-between border-b border-white/[0.05] mb-4 shrink-0">
          <Link href="/" className="inline-block transition-opacity hover:opacity-80" onClick={onClose}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sotarium-watermark.png"
              alt="Sotarium"
              className="h-9 w-auto object-contain select-none"
            />
          </Link>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-xl text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links with Sliding Highlighter */}
        <nav ref={navRef} className="relative flex-1 overflow-y-auto pr-0.5">
          {/* Sliding Active Highlighter Pill */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute top-0 left-0 right-0.5 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isScammersActive
                ? 'bg-yellow-400/15 border border-yellow-400/25'
                : 'bg-[#1a1a1f] border border-white/[0.08]'
            } ${indicator.visible ? 'opacity-100' : 'opacity-0'}`}
            style={{
              transform: `translateY(${indicator.top}px)`,
              height: `${indicator.height}px`,
            }}
          />

          <div className="space-y-5">
            {isAdmin && (
              <div className="space-y-1">
                <Link ref={setLinkRef('/')} href="/" onClick={onClose} className={navLinkClass('/')}>
                  <span>Home</span>
                </Link>
              </div>
            )}

            {/* Important */}
            <div className="space-y-1">
              <div className="relative z-10 px-3.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                Important
              </div>
              <Link ref={setLinkRef('/scammers')} href="/scammers" onClick={onClose} className={navLinkClass('/scammers', 'warning')}>
                <CautionSign className="w-3.5 h-3.5 shrink-0" />
                <span>Scammers</span>
              </Link>
              <Link ref={setLinkRef('/trusted')} href="/trusted" onClick={onClose} className={navLinkClass('/trusted')}>
                <span>Trusted</span>
              </Link>
            </div>

            {/* Loan */}
            <div className="space-y-1">
              <div className="relative z-10 px-3.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                Loan
              </div>
              <Link ref={setLinkRef('/ask-loan')} href="/ask-loan" onClick={onClose} className={navLinkClass('/ask-loan')}>
                <span>Ask Loan</span>
              </Link>
              <Link ref={setLinkRef('/payback')} href="/payback" onClick={onClose} className={navLinkClass('/payback')}>
                <span>Payback</span>
              </Link>
              <Link ref={setLinkRef('/loans')} href="/loans" onClick={onClose} className={navLinkClass('/loans')}>
                <span>Loans</span>
              </Link>
              <Link ref={setLinkRef('/paidback')} href="/paidback" onClick={onClose} className={navLinkClass('/paidback')}>
                <span>Paid Back</span>
              </Link>
            </div>

            {/* Manage */}
            {isAdmin && (
              <div className="space-y-1">
                <div className="relative z-10 px-3.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Manage
                </div>
                <Link ref={setLinkRef('/requests')} href="/requests" onClick={onClose} className={navLinkClass('/requests')}>
                  <span>Requests</span>
                </Link>
                {isOwner && (
                  <>
                    <Link ref={setLinkRef('/search')} href="/search" onClick={onClose} className={navLinkClass('/search')}>
                      <span>Search</span>
                    </Link>
                    <Link ref={setLinkRef('/bypass')} href="/bypass" onClick={onClose} className={navLinkClass('/bypass')}>
                      <span>Bypass</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Bottom Profile Card */}
      <div className="pt-4 border-t border-white/[0.05] shrink-0">
        {user ? (
          <div
            onClick={logout}
            title="Click to log out"
            className="p-2.5 rounded-2xl bg-[#121212] hover:bg-[#181818] border border-white/[0.06] flex items-center justify-between cursor-pointer transition-colors group"
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
                <div className="text-[11px] text-neutral-400">
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
