'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CheckSquare, Zap, Shield, ChevronRight } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Active Loans', href: '/loans', icon: Users },
    { name: 'Milestone Roadmap', href: '/roadmap', icon: CheckSquare },
  ];

  return (
    <aside className="w-64 border-r border-white/5 bg-[#0b0d14]/90 backdrop-blur-xl flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base">
              SOTARIUM <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">PRO</span>
            </h1>
            <p className="text-[11px] text-slate-400">Loan & Repayment Matrix</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5">
        <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 to-transparent text-cyan-300 border-l-2 border-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info / Live Sync Status */}
      <div className="p-4 m-3 rounded-2xl glass-panel border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">NOWPayments Active</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          SOL, ETH & LTC deposits auto-synchronize to repayment bars.
        </p>
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
          <span>Interest Rate</span>
          <span className="text-cyan-400 font-semibold">15% FIXED</span>
        </div>
      </div>
    </aside>
  );
}
