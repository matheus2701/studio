
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
  const [user, setUser] = useState<User | null>(null); // Inicializa como null
  const [isLoading, setIsLoading] = useState(true); // Mantém o isLoading para a lógica interna
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Para a versão sem login obrigatório, podemos simular um usuário logado ou manter como null
    // Se mantivermos como null, o AppHeader precisará lidar com isso (ex: não mostrar botão de Sair)
    // Por enquanto, vamos manter a lógica de carregar do localStorage para o botão Sair funcionar se houver sessão prévia
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
    // Não redireciona para /login automaticamente nesta versão comentada
    // router.push('/login'); 
    // Pode-se apenas recarregar a página ou deixar o usuário navegar
    router.refresh(); // Para limpar qualquer estado que dependa do usuário
  }, [router]);

  // Comentando o useEffect que redireciona da página de login
  // useEffect(() => {
  //   if (!isLoading) {
  //     const isLoginPage = pathname === '/login';
  //     // Se o login não é obrigatório, esta lógica de redirecionamento não é necessária
  //     // if (!user && !isLoginPage) {
  //     //   router.push('/login');
  //     // } else 
  //     if (user && isLoginPage) {
  //        router.push('/'); 
  //     }
  //   }
  // }, [user, isLoading, pathname, router]);


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
