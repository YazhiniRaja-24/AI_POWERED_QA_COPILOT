'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User, Role } from '@/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (data: {
    name: string;
    email: string;
    password: string;
    company: string;
    role: Role;
  }) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'qacopilot_auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const login = useCallback((email: string, password: string) => {
    if (!email || !password) {
      return { success: false, error: 'Please enter your credentials.' };
    }
    const newUser: User = {
      name: 'Yazhini Raj',
      email,
      role: 'QA Engineer',
      company: 'QA Copilot',
    };
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return { success: true };
  }, []);

  const register = useCallback(
    (data: {
      name: string;
      email: string;
      password: string;
      company: string;
      role: Role;
    }) => {
      if (!data.email || !data.password || !data.name) {
        return { success: false, error: 'Please fill all required fields.' };
      }
      const newUser: User = {
        name: data.name,
        email: data.email,
        role: data.role,
        company: data.company,
      };
      setUser(newUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      return { success: true };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    router.push('/login');
  }, [router]);

  useEffect(() => {
    if (!hydrated) return;
    const isAuthPage =
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/forgot-password';
    if (!user && !isAuthPage) {
      router.push('/login');
    }
    if (user && isAuthPage) {
      router.push('/dashboard');
    }
  }, [user, hydrated, pathname, router]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
