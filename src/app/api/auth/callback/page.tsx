'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export default function AuthCallback() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const discordUser = session.user.user_metadata;
        login({
          id: discordUser.provider_id || session.user.id,
          username: discordUser.custom_claims?.global_name || discordUser.full_name || discordUser.user_name || 'Discord User',
          avatar: discordUser.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'
        });
      } else {
        router.push('/');
      }
    });
  }, [router, login]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white text-sm">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <span>Authenticating with Discord...</span>
      </div>
    </div>
  );
}
