'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  ShieldCheck, 
  UploadCloud, 
  Wrench, 
  Eye, 
  Cpu, 
  Code, 
  Bot, 
  CreditCard, 
  Users, 
  BookOpen, 
  Settings, 
  ExternalLink,
  ChevronsUpDown,
  Lock
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 flex flex-col justify-between p-4 bg-black select-none z-40 border-r border-white/[0.04]">
      {/* Top Section */}
      <div className="space-y-6">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-3 py-2 mt-1 group">
          {/* Soteria Emblem */}
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

        {/* Section: Build */}
        <div className="space-y-1">
          <div className="px-4 text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Build
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
          <div className="w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/60 cursor-pointer">
            <Wrench className="w-4 h-4" />
            <span>Utilities</span>
          </div>
        </div>

        {/* Section: Products */}
        <div className="space-y-1">
          <div className="px-4 flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
            <span>Products</span>
            <Lock className="w-3 h-3 text-neutral-600" />
          </div>
          <div className="w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/60 cursor-pointer">
            <Eye className="w-4 h-4" />
            <span>Oracle</span>
          </div>
          <div className="w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/60 cursor-pointer">
            <Cpu className="w-4 h-4" />
            <span>Genesis</span>
          </div>
          <div className="w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/60 cursor-pointer">
            <Code className="w-4 h-4" />
            <span>Studio</span>
          </div>
          <div className="w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/60 cursor-pointer">
            <Bot className="w-4 h-4" />
            <span>Discord Bot</span>
          </div>
        </div>

        {/* Section: Account */}
        <div className="space-y-1">
          <div className="px-4 text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Account
          </div>
          <Link
            href="/billing"
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
              pathname === '/billing' 
                ? 'bg-white text-black font-semibold shadow-sm' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Billing</span>
          </Link>
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

        {/* User Profile Pill */}
        <div className="mt-3 p-2 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900 border border-white/[0.04] flex items-center justify-between cursor-pointer transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-neutral-800 text-neutral-300 font-semibold text-xs flex items-center justify-center">
              L
            </div>
            <div className="leading-tight">
              <div className="text-xs font-medium text-white truncate max-w-[130px]">locokwstasloco</div>
              <div className="text-[11px] text-neutral-400">Free plan</div>
            </div>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-500" />
        </div>
      </div>
    </aside>
  );
}
