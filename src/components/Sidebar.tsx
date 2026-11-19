'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  ShieldCheck, 
  UploadCloud, 
  Settings, 
  HelpCircle,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, isOwner, logout } = useAuth();

  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 flex flex-col justify-between p-4 bg-black select-none z-40 border-r border-white/[0.04]">
      {/* Top Section */}
      <div className="space-y-6">
        <div className="pt-2" />

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

          {/* Ask loan Tab: Visible to Everyone (Members, Admins, Owner) */}
          <Link
            href="/ask-loan"
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
              pathname === '/ask-loan' 
                ? 'bg-white text-black font-semibold shadow-sm' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Ask loan</span>
          </Link>
        </div>

        {/* Build Section: Loans & Roadmap - Visible for Admin & Owner ONLY */}
        {isAdmin && (
          <div className="space-y-1">
            <div className="px-4 text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
              <span>Manage</span>
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
            </Link>
          </div>
        )}
      </div>

      {/* Bottom Footer Section */}
      <div className="space-y-2 pt-4 border-t border-white/[0.04]">
        {/* Settings Tab: Visible for Admin & Owner ONLY */}
        {isAdmin && (
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
        )}

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
                src={user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
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
