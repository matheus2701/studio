
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (usernameInput: string, passwordInput: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Credenciais fixas (NÃO FAÇA ISSO EM PRODUÇÃO)
const ADMIN_USERNAME = "matheus2701";
const ADMIN_PASSWORD = "valeria2504";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('agendeUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('agendeUser');
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (usernameInput: string, passwordInput: string): Promise<boolean> => {
    setIsLoading(true);
    // Simula uma chamada de API
    await new Promise(resolve => setTimeout(resolve, 500));
    if (usernameInput === ADMIN_USERNAME && passwordInput === ADMIN_PASSWORD) {
      const userData = { username: usernameInput };
      setUser(userData);
      localStorage.setItem('agendeUser', JSON.stringify(userData));
      setIsLoading(false);
      router.push('/');
      return true;
    }
    setUser(null);
    localStorage.removeItem('agendeUser');
    setIsLoading(false);
    return false;
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('agendeUser');
    router.push('/login');
  }, [router]);

  useEffect(() => {
    if (!isLoading) {
      const isLoginPage = pathname === '/login';
      if (!user && !isLoginPage) {
        router.push('/login');
      } else if (user && isLoginPage) {
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);


  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
