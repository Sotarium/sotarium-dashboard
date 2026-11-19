'use client';

import { Bell, Gift } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="h-14 w-full flex items-center justify-end px-8 gap-3 select-none">
      {/* Balance Pill */}
      <Link 
        href="/billing"
        className="px-3.5 py-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-xs font-semibold text-white tracking-tight border border-white/[0.06] transition-colors"
      >
        $0.00
      </Link>

      {/* Gift Icon Button */}
      <button className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
        <Gift className="w-4 h-4" />
      </button>

      {/* Notification Bell with Red Dot */}
      <button className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white relative transition-colors">
        <Bell className="w-4 h-4" />
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute top-2 right-2" />
      </button>
    </header>
  );
}
