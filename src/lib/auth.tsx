'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getClientHWID } from '@/lib/hwid';

export type UserRole = 'owner' | 'admin' | 'member';

export interface DiscordUser {
  id: string;
  username: string;
  avatar?: string;
  role: UserRole;
  limitTier?: number;
  hwid?: string;
}

export const OWNER_DISCORD_ID = "1079074717799030824";

export interface LoginTokenPayload {
  id: string;
  username: string;
  avatar?: string;
  accessToken?: string;
  tokenType?: string;
  supabaseAccessToken?: string;
}

interface AuthContextType {
  user: DiscordUser | null;
  isOwner: boolean;
  isAdmin: boolean;
  isLoaded: boolean;
  login: (userData: LoginTokenPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isOwner: false,
  isAdmin: false,
  isLoaded: false,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. INSTANT SYNCHRONOUS LOCAL RESTORATION for smooth render
    let sessionUser: DiscordUser | null = null;
    try {
      const stored = localStorage.getItem('sotarium_discord_session') || localStorage.getItem('soteria_discord_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          parsed.role = parsed.id === OWNER_DISCORD_ID ? 'owner' : (parsed.role === 'admin' ? 'admin' : 'member');
          sessionUser = parsed;
          setUser(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse cached session:', e);
    } finally {
      setIsLoaded(true);
    }

    // 2. VERIFY SIGNED SERVER COOKIE & SYNC HWID/ROLE
    (async () => {
      try {
        const hwid = await getClientHWID();
        const res = await fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hwid }),
        });

        if (res.ok) {
          const synced: DiscordUser = await res.json();
          setUser(synced);
          localStorage.setItem('sotarium_discord_session', JSON.stringify(synced));
        } else if (res.status === 401 && sessionUser) {
          // Unsigned or expired session — require clean Discord re-auth
          setUser(null);
          localStorage.removeItem('sotarium_discord_session');
          localStorage.removeItem('soteria_discord_session');
        }
      } catch {
        // Keep cached view if offline
      }
    })();
  }, []);

  // Route protection
  useEffect(() => {
    if (!isLoaded) return;

    if (!user && pathname !== '/login') {
      router.push('/login');
      return;
    }

    if (user && user.role === 'member' && pathname === '/') {
      router.push('/ask-loan');
    }
  }, [isLoaded, user, pathname, router]);

  const login = async (userData: LoginTokenPayload) => {
    try {
      const hwid = await getClientHWID();
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: userData.accessToken,
          tokenType: userData.tokenType,
          supabaseAccessToken: userData.supabaseAccessToken,
          hwid,
        }),
      });

      if (res.ok) {
        const synced: DiscordUser = await res.json();
        setUser(synced);
        localStorage.setItem('sotarium_discord_session', JSON.stringify(synced));

        if (synced.id === OWNER_DISCORD_ID || synced.role === 'owner' || synced.role === 'admin') {
          router.push('/');
        } else {
          router.push('/ask-loan');
        }
        return;
      }
    } catch (err) {
      console.error('Login sync failed:', err);
    }
    router.push('/login');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sotarium_discord_session');
    localStorage.removeItem('soteria_discord_session');
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
  };

  const isOwner = user?.id === OWNER_DISCORD_ID || user?.role === 'owner';
  const isAdmin = isOwner || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isOwner, isAdmin, isLoaded, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
