'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const { login } = useAuth();
  const [status, setStatus] = useState('Verifying Discord session...');

  useEffect(() => {
    async function handleAuth() {
      // 1. Check for Discord Implicit OAuth access_token in the URL hash
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const tokenType = hashParams.get('token_type') || 'Bearer';

        if (accessToken) {
          try {
            setStatus('Fetching your Discord profile...');
            const response = await fetch('https://discord.com/api/v10/users/@me', {
              headers: {
                Authorization: `${tokenType} ${accessToken}`,
              },
            });

            if (response.ok) {
              const discordData = await response.json();
              const avatarUrl = discordData.avatar
                ? `https://cdn.discordapp.com/avatars/${discordData.id}/${discordData.avatar}.png`
                : 'https://cdn.discordapp.com/embed/avatars/0.png';

              await login({
                id: discordData.id,
                username: discordData.global_name || discordData.username,
                avatar: avatarUrl,
                accessToken,
                tokenType,
              });
              return;
            }
          } catch (err) {
            console.error('Failed to fetch Discord user:', err);
          }
        }
      }

      // 2. Check for Supabase session as fallback
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && session.access_token) {
          const discordUser = session.user.user_metadata;
          await login({
            id: discordUser.provider_id || session.user.id,
            username: discordUser.custom_claims?.global_name || discordUser.full_name || discordUser.user_name || 'Discord User',
            avatar: discordUser.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png',
            supabaseAccessToken: session.access_token,
          });
          return;
        }
      } catch (err) {
        console.error('Supabase session check error:', err);
      }

      // 3. If no tokens or failed, redirect back to login
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }

    handleAuth();
  }, [router, login]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white text-sm">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <span>{status}</span>
      </div>
    </div>
  );
}
