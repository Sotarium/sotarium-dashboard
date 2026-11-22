'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import SupportWidget from '@/components/SupportWidget';
import { AuthProvider } from '@/lib/auth';
import { Menu } from 'lucide-react';

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoginPage) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-black">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 md:ml-[260px] min-h-screen flex flex-col bg-ambient">
          {/* Mobile top bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900/60 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Sotarium"
                className="h-7 w-7 object-contain select-none"
              />
              <span className="font-bold text-base text-white tracking-tight font-sans">Sotarium</span>
            </div>
          </div>

          <Header />
          <main className="p-4 md:p-8 max-w-[1240px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
      <SupportWidget />
    </AuthProvider>
  );
}
