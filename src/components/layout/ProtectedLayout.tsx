
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react'; 
import { usePathname, useRouter } from 'next/navigation'; 
import { useAuth } from '@/contexts/AuthContext'; 
import { AppHeader } from '@/components/layout/AppHeader';
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from '@/components/ui/skeleton';

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth(); 
  const pathname = usePathname(); 
  const router = useRouter(); 

  useEffect(() => { 
    if (isLoading) return;

    const isLoginPage = pathname === '/login';

    if (!user && !isLoginPage) {
      console.log("[ProtectedLayout] Usuário não autenticado, redirecionando para /login");
      router.replace('/login');
    }
  }, [user, isLoading, pathname, router]); 

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="container flex h-16 items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-24" />
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="flex justify-between">
               <Skeleton className="h-10 w-64" />
               <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Skeleton className="h-32 w-full" />
               <Skeleton className="h-32 w-full" />
               <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (!user && pathname !== '/login') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground animate-pulse">Redirecionando para o login...</p>
      </div>
    ); 
  }

  if (pathname === '/login') {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Toaster />
    </>
  );
}
