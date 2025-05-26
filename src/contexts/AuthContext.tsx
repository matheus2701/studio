
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
  // setTemporaryPassword: (recoveryCode: string, newPasswordInput: string) => boolean; // Removido
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Lê as credenciais das variáveis de ambiente
const ADMIN_USERNAME_ENV = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
const ADMIN_PASSWORD_ENV = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
// const RECOVERY_CODE_INTERNAL = "2504"; // Removido

// const TEMP_PASSWORD_STORAGE_KEY = 'agendeTempPassword'; // Removido

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ADMIN_USERNAME_ENV || !ADMIN_PASSWORD_ENV) {
      console.error("Variáveis de ambiente NEXT_PUBLIC_ADMIN_USERNAME ou NEXT_PUBLIC_ADMIN_PASSWORD não configuradas!");
    }
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

  // Removida a função setTemporaryPassword

  const login = useCallback(async (usernameInput: string, passwordInput: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simula chamada de API

    if (!ADMIN_USERNAME_ENV || !ADMIN_PASSWORD_ENV) {
      console.error("Login attempt failed: Admin credentials not set in environment variables.");
      setIsLoading(false);
      return false;
    }

    // Removida lógica de senha temporária
    const effectivePassword = ADMIN_PASSWORD_ENV;
    
    if (usernameInput === ADMIN_USERNAME_ENV && passwordInput === effectivePassword) {
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
    // if (typeof window !== 'undefined') { // Removida limpeza de senha temporária
    //   sessionStorage.removeItem(TEMP_PASSWORD_STORAGE_KEY);
    // }
    router.push('/login');
  }, [router]);

  useEffect(() => {
    if (!isLoading) {
      const isLoginPage = pathname === '/login';
      if (!user && !isLoginPage) {
        router.push('/login');
      } else if (user && isLoginPage) {
         router.push('/'); // Redireciona para home se já logado e na página de login
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
