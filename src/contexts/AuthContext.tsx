
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
  setTemporaryPassword: (recoveryCode: string, newPasswordInput: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Lê as credenciais das variáveis de ambiente
const ADMIN_USERNAME_ENV = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
const ADMIN_PASSWORD_ENV = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
const RECOVERY_CODE_INTERNAL = "2504"; // Mantenha este código consistente

const TEMP_PASSWORD_STORAGE_KEY = 'agendeTempPassword';

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

  const setTemporaryPassword = useCallback((recoveryCode: string, newPasswordInput: string): boolean => {
    if (recoveryCode === RECOVERY_CODE_INTERNAL) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(TEMP_PASSWORD_STORAGE_KEY, newPasswordInput);
      }
      return true;
    }
    return false;
  }, []);

  const login = useCallback(async (usernameInput: string, passwordInput: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simula chamada de API

    if (!ADMIN_USERNAME_ENV || !ADMIN_PASSWORD_ENV) {
      console.error("Login attempt failed: Admin credentials not set in environment variables.");
      setIsLoading(false);
      return false;
    }

    let effectivePassword = ADMIN_PASSWORD_ENV;
    if (typeof window !== 'undefined') {
      const tempPassword = sessionStorage.getItem(TEMP_PASSWORD_STORAGE_KEY);
      if (tempPassword) {
        effectivePassword = tempPassword;
      }
    }
    
    if (usernameInput === ADMIN_USERNAME_ENV && passwordInput === effectivePassword) {
      const userData = { username: usernameInput };
      setUser(userData);
      localStorage.setItem('agendeUser', JSON.stringify(userData));
      if (typeof window !== 'undefined') {
        // Opcional: limpar a senha temporária após um login bem-sucedido com ela.
        // Se o usuário realmente esqueceu e quer que a temporária continue valendo até fechar o navegador, não limpe.
        // Se a intenção é só um bypass para logar e depois arrumar a ENV var, pode limpar.
        // sessionStorage.removeItem(TEMP_PASSWORD_STORAGE_KEY); 
      }
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
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(TEMP_PASSWORD_STORAGE_KEY);
    }
    router.push('/login');
  }, [router]);

  useEffect(() => {
    if (!isLoading) {
      const isLoginPage = pathname === '/login';
      if (!user && !isLoginPage) {
        router.push('/login');
      } else if (user && isLoginPage) {
        // Se já logado e na página de login (pode acontecer se a senha temporária foi definida)
        // não redirecionar automaticamente para '/', permitir que o usuário veja a mensagem de sucesso
        // e tente o login. O login bem-sucedido o redirecionará.
        // router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);


  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setTemporaryPassword }}>
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
