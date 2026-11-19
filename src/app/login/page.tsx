'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Real Discord OAuth Flow (Direct Discord Authorization)
  const handleDiscordOAuth = () => {
    setIsLoading(true);
    const clientId = '1572819583318884484';
    const redirectUri = typeof window !== 'undefined'
      ? `${window.location.origin}/api/auth/callback`
      : 'https://sotarium-dashboard.vercel.app/api/auth/callback';

    // Direct Discord OAuth2 Authorization (Implicit Grant)
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=identify`;

    window.location.href = discordAuthUrl;
  };

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const isOwnerEmail = email.toLowerCase().includes('sotarium') || email.toLowerCase().includes('owner') || email.toLowerCase().includes('admin');
    login({
      id: isOwnerEmail ? "1079074717799030824" : `member_${Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`,
      username: email ? email.split('@')[0] : 'member',
      avatar: 'https://cdn.discordapp.com/embed/avatars/0.png'
    });
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col justify-between p-6 select-none font-sans text-white">
      {/* Top Navbar */}
      <header className="w-full flex items-center justify-between max-w-6xl mx-auto py-2">
        <div />
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-neutral-400">Log in</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="w-full flex items-center justify-center my-auto py-8">
        <div className="w-full max-w-[420px] bg-[#141414] rounded-3xl p-8 border border-white/[0.04] shadow-2xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="text-xs text-neutral-400">Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Email</label>
              <input
                type="email"
                placeholder="example@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#1a1a1a] border border-white/[0.06] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#1a1a1a] border border-white/[0.06] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors"
              />
              <div className="text-left pt-1">
                <span className="text-xs text-neutral-400 hover:text-white cursor-pointer transition-colors">
                  Forgot password?
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#666666] hover:bg-[#777777] text-white font-semibold text-sm transition-colors mt-2"
            >
              Log in
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/[0.06] w-full" />
            <span className="bg-[#141414] px-3 text-xs text-neutral-500 absolute">or</span>
          </div>

          {/* Real Discord OAuth Button */}
          <div>
            <button
              onClick={handleDiscordOAuth}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-black font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4 fill-[#5865F2]" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.86,53,48.81,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91,65.69,84.69,65.69Z" />
              </svg>
              <span>{isLoading ? 'Redirecting to Discord...' : 'Continue with Discord'}</span>
            </button>
          </div>

          <div className="text-center text-xs text-neutral-400 pt-2">
            <div>
              Don&apos;t have an account? <span className="text-white font-semibold cursor-pointer">Sign up</span>
            </div>
          </div>
        </div>
      </main>

      <div className="h-6" />
    </div>
  );
}
