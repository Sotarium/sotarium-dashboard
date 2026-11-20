'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function RoadmileRedirect() {
  const router = useRouter();
  const { isOwner, isAdmin, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (isOwner) {
      router.replace('/search');
    } else if (isAdmin) {
      router.replace('/loans');
    } else {
      router.replace('/ask-loan');
    }
  }, [isLoaded, isOwner, isAdmin, router]);

  return (
    <div className="h-screen bg-black flex items-center justify-center text-neutral-500 text-sm">
      Redirecting...
    </div>
  );
}
