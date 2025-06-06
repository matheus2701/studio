
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

// Lê as credenciais das variáveis de ambiente
const ADMIN_USERNAME_ENV = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
const ADMIN_PASSWORD_ENV = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null); 
  const [isLoading, setIsLoading] = useState(true); 
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let initialUser = null;
    if (typeof window !== 'undefined') {
      if (!ADMIN_USERNAME_ENV || !ADMIN_PASSWORD_ENV) {
        console.error("Variáveis de ambiente NEXT_PUBLIC_ADMIN_USERNAME ou NEXT_PUBLIC_ADMIN_PASSWORD não configuradas!");
      }
      try {
        const storedUser = localStorage.getItem('agendeUser');
        if (storedUser) {
          initialUser = JSON.parse(storedUser);
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('agendeUser');
      }
    }
    setUser(initialUser);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (usernameInput: string, passwordInput: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); 

    if (!ADMIN_USERNAME_ENV || !ADMIN_PASSWORD_ENV) {
      console.error("Login attempt failed: Admin credentials not set in environment variables.");
      setIsLoading(false);
      return false;
    }
    
    if (usernameInput === ADMIN_USERNAME_ENV && passwordInput === ADMIN_PASSWORD_ENV) {
      const userData = { username: usernameInput };
      setUser(userData);
      if (typeof window !== 'undefined') {
        localStorage.setItem('agendeUser', JSON.stringify(userData));
      }
      setIsLoading(false);
      router.push('/');
      return true;
    }

    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agendeUser');
    }
    setIsLoading(false);
    return false;
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agendeUser');
    }
    router.push('/login'); 
  }, [router]);

  // Descomentando o useEffect que redireciona da página de login
  useEffect(() => {
    if (!isLoading) {
      const isLoginPage = pathname === '/login';
      // Se o login não é obrigatório, esta lógica de redirecionamento não é necessária
      // if (!user && !isLoginPage) {
      //   router.push('/login');
      // } else 
      if (user && isLoginPage) {
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
