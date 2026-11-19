'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface DiscordUser {
  id: string;
  username: string;
  avatar?: string;
  discriminator?: string;
}

// Admin Discord ID
export const ADMIN_DISCORD_ID = "1079074717799030824";

interface AuthContextType {
  user: DiscordUser | null;
  isAdmin: boolean;
  login: (userData: DiscordUser) => void;
  loginAsAdmin: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  login: () => {},
  loginAsAdmin: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('soteria_discord_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch (e) {
        console.error('Failed to parse session:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // If user is not signed in and trying to access dashboard routes, redirect to /login
  useEffect(() => {
    if (isLoaded && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [isLoaded, user, pathname, router]);

  const login = (userData: DiscordUser) => {
    setUser(userData);
    localStorage.setItem('soteria_discord_session', JSON.stringify(userData));
    router.push('/');
  };

  const loginAsAdmin = () => {
    const adminUser = {
      id: ADMIN_DISCORD_ID,
      username: 'sotarium',
      avatar: 'https://cdn.discordapp.com/embed/avatars/0.png'
    };
    login(adminUser);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('soteria_discord_session');
    router.push('/login');
  };

  const isAdmin = user?.id === ADMIN_DISCORD_ID;

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, loginAsAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
