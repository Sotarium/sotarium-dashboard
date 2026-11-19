'use client';

import { useState } from 'react';
import { useAuth, ADMIN_DISCORD_ID } from '@/lib/auth';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleDiscordSignIn = () => {
    login({
      id: ADMIN_DISCORD_ID,
      username: 'sotarium',
      avatar: 'https://cdn.discordapp.com/embed/avatars/0.png'
    });
  };

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      id: ADMIN_DISCORD_ID,
      username: email ? email.split('@')[0] : 'sotarium',
      avatar: 'https://cdn.discordapp.com/embed/avatars/0.png'
    });
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col justify-between p-6 select-none font-sans text-white">
      {/* Top Navbar matching Soteria.rip exactly */}
      <header className="w-full flex items-center justify-between max-w-6xl mx-auto py-2">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 relative flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M3.6 9h16.8" />
              <path d="M3.6 15h16.8" />
              <ellipse cx="12" cy="12" rx="4" ry="9" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight text-white font-sans">soteria</span>
        </Link>

        {/* Right CTA */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-neutral-400">Log in</span>
          <button 
            onClick={handleDiscordSignIn}
            className="px-4 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors"
          >
            Get started
          </button>
        </div>
      </header>

      {/* Center Auth Card (Exact Soteria Style) */}
      <main className="w-full flex items-center justify-center my-auto py-8">
        <div className="w-full max-w-[420px] bg-[#141414] rounded-3xl p-8 border border-white/[0.04] shadow-2xl space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="text-xs text-neutral-400">Sign in to your Soteria account to continue.</p>
          </div>

          {/* Form */}
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
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-neutral-300">Password</label>
              </div>
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

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/[0.06] w-full" />
            <span className="bg-[#141414] px-3 text-xs text-neutral-500 absolute">or</span>
          </div>

          {/* Social Sign-in Buttons */}
          <div className="space-y-3">
            {/* Continue with Google */}
            <button
              onClick={handleDiscordSignIn}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-black font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Continue with Discord */}
            <button
              onClick={handleDiscordSignIn}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-black font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 fill-[#5865F2]" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.86,53,48.81,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91,65.69,84.69,65.69Z" />
              </svg>
              <span>Continue with Discord</span>
            </button>
          </div>

          {/* Footer note */}
          <div className="text-center text-xs text-neutral-400 pt-2 space-y-1">
            <div>
              Don&apos;t have an account? <span className="text-white font-semibold cursor-pointer">Sign up</span>
            </div>
            <div className="text-[11px] text-neutral-500">
              By continuing, you agree to our <span className="underline cursor-pointer">legal terms</span>.
            </div>
          </div>
        </div>
      </main>

      <div className="h-6" />
    </div>
  );
}
