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
  hwid?: string;
}

export const OWNER_DISCORD_ID = "1079074717799030824";

interface AuthContextType {
  user: DiscordUser | null;
  isOwner: boolean;
  isAdmin: boolean;
  isLoaded: boolean;
  login: (userData: Omit<DiscordUser, 'role'> & { role?: UserRole }) => Promise<void>;
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
    // 1. INSTANT SYNCHRONOUS LOCAL RESTORATION (0ms delay)
    let sessionUser: DiscordUser | null = null;
    try {
      const stored = localStorage.getItem('soteria_discord_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.id || parsed.username)) {
          if (parsed.id === OWNER_DISCORD_ID || parsed.username?.toLowerCase() === 'sotarium') {
            parsed.role = 'owner';
          }
          sessionUser = parsed;
          setUser(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse cached session:', e);
    } finally {
      setIsLoaded(true);
    }

    // 2. BACKGROUND NON-BLOCKING SYNC (verifies HWID and Supabase role without blocking the UI)
    if (sessionUser) {
      const u = sessionUser;
      (async () => {
        try {
          const hwid = await getClientHWID();
          const res = await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: u.id,
              username: u.username,
              avatar: u.avatar,
              hwid,
            }),
          });

          if (res.ok) {
            const synced = await res.json();
            if (u.id === OWNER_DISCORD_ID || u.username?.toLowerCase() === 'sotarium') {
              synced.role = 'owner';
            }
            setUser(synced);
            localStorage.setItem('soteria_discord_session', JSON.stringify(synced));
          }
        } catch {
          // Maintain cached session on failure
        }
      })();
    }
  }, []);

  // Route protection
  useEffect(() => {
    if (!isLoaded) return;

    if (!user && pathname !== '/login') {
      router.push('/login');
      return;
    }

    // If logged in as regular member, redirect away from Home (/) to /ask-loan
    if (user && user.role === 'member' && pathname === '/') {
      router.push('/ask-loan');
    }
  }, [isLoaded, user, pathname, router]);

  const login = async (userData: Omit<DiscordUser, 'role'> & { role?: UserRole }) => {
    try {
      const hwid = await getClientHWID();
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userData.id,
          username: userData.username,
          avatar: userData.avatar,
          hwid,
        }),
      });

      if (res.ok) {
        const synced = await res.json();
        setUser(synced);
        localStorage.setItem('soteria_discord_session', JSON.stringify(synced));
      } else {
        const fallbackUser: DiscordUser = {
          ...userData,
          role: userData.id === OWNER_DISCORD_ID ? 'owner' : (userData.role || 'member'),
          hwid,
        };
        setUser(fallbackUser);
        localStorage.setItem('soteria_discord_session', JSON.stringify(fallbackUser));
      }
    } catch {
      const fallbackUser: DiscordUser = {
        ...userData,
        role: userData.id === OWNER_DISCORD_ID ? 'owner' : (userData.role || 'member'),
      };
      setUser(fallbackUser);
      localStorage.setItem('soteria_discord_session', JSON.stringify(fallbackUser));
    }

    // Redirect based on role
    if (userData.id === OWNER_DISCORD_ID || userData.role === 'owner' || userData.role === 'admin') {
      router.push('/');
    } else {
      router.push('/ask-loan');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('soteria_discord_session');
    router.push('/login');
  };

  const isOwner = user?.role === 'owner' || user?.id === OWNER_DISCORD_ID || user?.username?.toLowerCase() === 'sotarium';
  const isAdmin = isOwner || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isOwner, isAdmin, isLoaded, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
