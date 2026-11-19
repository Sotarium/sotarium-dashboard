'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  ShieldCheck, 
  UploadCloud, 
  Settings, 
  Lock,
  LogOut
} from 'lucide-react';
import { useAuth, ADMIN_DISCORD_ID } from '@/lib/auth';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();

  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 flex flex-col justify-between p-4 bg-black select-none z-40 border-r border-white/[0.04]">
      {/* Top Section */}
      <div className="space-y-6">
        <div className="pt-2" />

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

        {/* Section: Build */}
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
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="space-y-2 pt-4 border-t border-white/[0.04]">
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
                <div className="text-[10px] text-neutral-400 font-mono">
                  {isAdmin ? 'Admin' : 'Member'}
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
