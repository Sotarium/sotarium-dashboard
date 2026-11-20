'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import SupportWidget from '@/components/SupportWidget';
import { AuthProvider } from '@/lib/auth';

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-black">
        <Sidebar />
        <div className="flex-1 ml-[260px] min-h-screen flex flex-col bg-ambient">
          <Header />
          <main className="p-8 max-w-[1240px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
      <SupportWidget />
    </AuthProvider>
  );
}
