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
    async function initAuth() {
      const stored = localStorage.getItem('soteria_discord_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const hwid = await getClientHWID();

          // Sync with Supabase users table to ensure verified role & HWID
          try {
            const res = await fetch('/api/users/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: parsed.id,
                username: parsed.username,
                avatar: parsed.avatar,
                hwid,
              }),
            });

            if (res.ok) {
              const synced = await res.json();
              setUser(synced);
              localStorage.setItem('soteria_discord_session', JSON.stringify(synced));
            } else {
              setUser(parsed);
            }
          } catch {
            setUser(parsed);
          }
        } catch (e) {
          console.error('Failed to parse session:', e);
        }
      }
      setIsLoaded(true);
    }

    initAuth();
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

  const isOwner = user?.role === 'owner' || user?.id === OWNER_DISCORD_ID;
  const isAdmin = isOwner || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isOwner, isAdmin, isLoaded, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
