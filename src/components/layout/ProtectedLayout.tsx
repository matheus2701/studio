
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
    if (isLoading) return; // Don't do anything while loading

    const isLoginPage = pathname === '/login';

    if (!user && !isLoginPage) {
      router.replace('/login');
    }
    // No need to redirect if user is logged in and on login page, AuthProvider handles this
  }, [user, isLoading, pathname, router]); 

  if (isLoading) {
    // Skeleton UI while checking auth state
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-24" />
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }
  
  // If not loading and not logged in, and not on login page, effectively render nothing until redirect happens
  // This prevents a flash of an unauthenticated page or AppHeader
  if (!user && pathname !== '/login') {
    return null; 
  }

  // If on login page, render only children (which is the LoginPage content) and Toaster
  if (pathname === '/login') {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  // If logged in (and not on login page), render the full protected layout
  return (
    <>
      <AppHeader /> {/* AppHeader is only rendered for authenticated users on protected pages */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Toaster />
    </>
  );
}
