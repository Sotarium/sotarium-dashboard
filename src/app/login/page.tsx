'use client';

import { useState, useEffect, useRef } from 'react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  // Real Discord OAuth Flow
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

  // Bespoke Interactive Kinetic Constellation Background (Original procedural math, zero AI template blobs)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes definition
    const nodeCount = Math.min(Math.floor((width * height) / 18000), 75);
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      baseAlpha: number;
      pulseSpeed: number;
      pulseOffset: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < nodeCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: Math.random() * 1.6 + 0.8,
        baseAlpha: Math.random() * 0.35 + 0.15,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    let time = 0;
    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Natural drift
        p.x += p.vx;
        p.y += p.vy;

        // Bounce gently at screen borders
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse reactive repulsion / liquid ripple
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 140;

          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 1.5;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        // Breathing alpha pulse
        const alpha = p.baseAlpha + Math.sin(time * p.pulseSpeed + p.pulseOffset) * 0.1;

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 215, 255, ${Math.max(0.05, alpha)})`;
        ctx.fill();

        // Connect nearby nodes with subtle gossamer filaments
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distx = p.x - p2.x;
          const disty = p.y - p2.y;
          const distance = Math.sqrt(distx * distx + disty * disty);
          const linkDist = 115;

          if (distance < linkDist) {
            const linkAlpha = (1 - distance / linkDist) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(165, 185, 235, ${linkAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#050507] flex flex-col items-center justify-center p-6 select-none font-sans text-white overflow-hidden">
      
      {/* Interactive Procedural Kinetic Web Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 opacity-80"
      />

      {/* Bespoke Fine-Line Vector Orbital Compass & Coordinates (Architectural Luxury Web3 aesthetic) */}
      <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
        {/* Large Outer Orbital Orbit */}
        <div className="w-[780px] h-[780px] rounded-full border border-white/[0.035] border-dashed animate-[spin_180s_linear_infinite]" />
        {/* Secondary Concentric Radar Ring */}
        <div className="absolute w-[540px] h-[540px] rounded-full border border-white/[0.04]" />
        {/* Precision Crosshair Marks */}
        <div className="absolute w-[860px] h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
        <div className="absolute h-[860px] w-px bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />
      </div>

      {/* Corner Technical Watermarks */}
      <div className="absolute top-6 left-8 pointer-events-none hidden sm:flex items-center gap-2.5 text-[10px] tracking-widest text-neutral-600 font-mono uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>SOTARIUM // SYSTEM ONLINE</span>
      </div>
      <div className="absolute top-6 right-8 pointer-events-none hidden sm:flex items-center gap-3 text-[10px] tracking-widest text-neutral-600 font-mono uppercase">
        <span>GATEWAY v2.4</span>
        <span className="text-neutral-700">•</span>
        <span>LATENCY 18ms</span>
      </div>

      <div className="absolute bottom-6 left-8 pointer-events-none hidden sm:block text-[10px] tracking-widest text-neutral-600 font-mono uppercase">
        <span>0x71C...9E // LIQUIDITY ENGINE</span>
      </div>

      {/* Subtle Analog Noise Film Grain Overlay to prevent sterile digital gradients */}
      <svg className="fixed inset-0 pointer-events-none opacity-[0.035] mix-blend-overlay w-full h-full z-[1]">
        <filter id="grainFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grainFilter)" />
      </svg>

      {/* Main Glassmorphic Auth Card */}
      <main className="relative z-10 w-full max-w-[400px] mx-auto animate-in fade-in zoom-in-95 duration-500">
        <div className="relative bg-[#0c0c0e]/85 backdrop-blur-2xl rounded-3xl p-8 sm:p-9 border border-white/[0.09] shadow-[0_24px_70px_-15px_rgba(0,0,0,0.9),0_0_50px_rgba(255,255,255,0.02)] space-y-6 text-center overflow-hidden">
          
          {/* Razor-thin Top Specular Light Bar */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Sotarium Watermark Brand Character */}
          <div className="flex justify-center pt-1">
            <div className="relative inline-block group">
              <div className="absolute inset-0 bg-white/[0.06] blur-xl rounded-full scale-125 pointer-events-none transition-all duration-500 group-hover:scale-150 group-hover:bg-white/[0.12]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/sotarium-watermark.png" 
                alt="Sotarium" 
                className="relative h-13 w-auto object-contain select-none drop-shadow-[0_4px_16px_rgba(255,255,255,0.1)] transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Headings */}
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Welcome to Sotarium
            </h1>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
              Sign in with your Discord account to access loans.
            </p>
          </div>

          {/* Discord OAuth Action */}
          <div className="pt-2">
            <button
              onClick={handleDiscordOAuth}
              disabled={isLoading}
              className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-neutral-100 text-black font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-[0_4px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_6px_28px_rgba(255,255,255,0.2)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-[#5865F2] shrink-0" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.86,53,48.81,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91,65.69,84.69,65.69Z" />
              </svg>
              <span>{isLoading ? 'Connecting to Discord...' : 'Continue with Discord'}</span>
            </button>
          </div>

          {/* Secure Handshake Notice */}
          <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
            <span>Encrypted OAuth2 Session Handshake</span>
          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 mt-8 text-center text-xs text-neutral-600 font-mono">
        <span>© 2026 Sotarium • All rights reserved</span>
      </footer>

    </div>
  );
}
