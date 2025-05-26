
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
      router.replace('/login');
    }
    // No need to redirect if user is logged in and on login page, AuthProvider handles this
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
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
  
  if (!user && pathname !== '/login') {
    // This ensures nothing is rendered by ProtectedLayout before redirection takes effect,
    // especially if there's a brief moment where isLoading is false but user is not yet set.
    return null; 
  }

  return (
    <>
      {user && <AppHeader />} {/* Only show header if logged in */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Toaster />
    </>
  );
}
