
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

const ADMIN_USERNAME_ENV = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
const ADMIN_PASSWORD_ENV = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null); 
  const [isLoading, setIsLoading] = useState(true); 
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log("[AuthContext] Iniciando verificação de sessão...");
    let initialUser = null;
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('agendeUser');
        if (storedUser) {
          initialUser = JSON.parse(storedUser);
          console.log("[AuthContext] Sessão restaurada para:", initialUser.username);
        } else {
          console.log("[AuthContext] Nenhuma sessão encontrada no localStorage.");
        }
      } catch (error) {
        console.error("[AuthContext] Erro ao ler sessão do localStorage:", error);
        localStorage.removeItem('agendeUser');
      }
    }
    setUser(initialUser);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (usernameInput: string, passwordInput: string): Promise<boolean> => {
    setIsLoading(true);
    console.log("[AuthContext] Tentando login para:", usernameInput);
    
    // Simula um pequeno atraso de rede
    await new Promise(resolve => setTimeout(resolve, 500)); 

    if (!ADMIN_USERNAME_ENV || !ADMIN_PASSWORD_ENV) {
      console.error("[AuthContext] Erro Crítico: Credenciais administrativas não configuradas no .env");
      setIsLoading(false);
      return false;
    }
    
    if (usernameInput === ADMIN_USERNAME_ENV && passwordInput === ADMIN_PASSWORD_ENV) {
      const userData = { username: usernameInput };
      setUser(userData);
      if (typeof window !== 'undefined') {
        localStorage.setItem('agendeUser', JSON.stringify(userData));
      }
      console.log("[AuthContext] Login bem-sucedido.");
      setIsLoading(false);
      router.push('/');
      return true;
    }

    console.warn("[AuthContext] Falha no login: credenciais incorretas.");
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agendeUser');
    }
    setIsLoading(false);
    return false;
  }, [router]);

  const logout = useCallback(() => {
    console.log("[AuthContext] Executando logout...");
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agendeUser');
    }
    router.push('/login'); 
  }, [router]);

  useEffect(() => {
    if (!isLoading) {
      const isLoginPage = pathname === '/login';
      if (user && isLoginPage) {
         console.log("[AuthContext] Usuário logado tentando acessar login, redirecionando para home.");
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
