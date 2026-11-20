'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  // Real Discord OAuth Flow (Direct Discord Authorization)
  const handleDiscordOAuth = () => {
    setIsLoading(true);
    const clientId = '1572819583318884484';
    const redirectUri = typeof window !== 'undefined'
      ? `${window.location.origin}/api/auth/callback`
      : 'https://sotarium.vercel.app/api/auth/callback';

    // Direct Discord OAuth2 Authorization (Implicit Grant)
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=identify`;

    window.location.href = discordAuthUrl;
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
        <div className="w-full max-w-[420px] bg-[#141414] rounded-3xl p-8 border border-white/[0.06] shadow-2xl space-y-6 text-center">
          {/* Logo */}
          <div className="flex justify-center pb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/sotarium-watermark.png" 
              alt="Sotarium" 
              className="h-12 w-auto object-contain select-none"
            />
          </div>

          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Welcome to Sotarium</h1>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Sign in with your Discord account to access loans.
            </p>
          </div>

          {/* Real Discord OAuth Button */}
          <div className="pt-2">
            <button
              onClick={handleDiscordOAuth}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-black font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-[#5865F2]" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.86,53,48.81,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91,65.69,84.69,65.69Z" />
              </svg>
              <span>{isLoading ? 'Connecting to Discord...' : 'Continue with Discord'}</span>
            </button>
          </div>

        </div>
      </main>

      <div className="h-6" />
    </div>
  );
}
