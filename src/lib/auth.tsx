'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface DiscordUser {
  id: string;
  username: string;
  avatar: string;
}

// User's Discord ID
export const ADMIN_DISCORD_ID = "1079074717799030824";

interface AuthContextType {
  user: DiscordUser | null;
  isAdmin: boolean;
  loginAsAdmin: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loginAsAdmin: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DiscordUser | null>(null);

  useEffect(() => {
    // Default logged in as Discord user 1079074717799030824
    const stored = localStorage.getItem('soteria_discord_user');
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      const defaultUser = {
        id: ADMIN_DISCORD_ID,
        username: "Admin",
        avatar: "https://cdn.discordapp.com/embed/avatars/0.png"
      };
      setUser(defaultUser);
      localStorage.setItem('soteria_discord_user', JSON.stringify(defaultUser));
    }
  }, []);

  const loginAsAdmin = () => {
    const defaultUser = {
      id: ADMIN_DISCORD_ID,
      username: "Admin",
      avatar: "https://cdn.discordapp.com/embed/avatars/0.png"
    };
    setUser(defaultUser);
    localStorage.setItem('soteria_discord_user', JSON.stringify(defaultUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('soteria_discord_user');
  };

  const isAdmin = user?.id === ADMIN_DISCORD_ID;

  return (
    <AuthContext.Provider value={{ user, isAdmin, loginAsAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
