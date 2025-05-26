
"use client";

import type { ReactNode } from 'react';
// import { useEffect } from 'react'; // Comentado
// import { usePathname, useRouter } from 'next/navigation'; // Comentado
// import { useAuth } from '@/contexts/AuthContext'; // Comentado, mas AppHeader pode precisar dele internamente
import { AppHeader } from '@/components/layout/AppHeader';
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext'; // Mantido para AppHeader

export function ProtectedLayout({ children }: { children: ReactNode }) {
  // const { user, isLoading } = useAuth(); // Comentado
  // const pathname = usePathname(); // Comentado
  // const router = useRouter(); // Comentado

  // useEffect(() => {
  //   if (isLoading) return;

  //   const isLoginPage = pathname === '/login';

  //   if (!user && !isLoginPage) {
  //     router.replace('/login');
  //   }
  //   // No need to redirect if user is logged in and on login page, AuthProvider handles this
  // }, [user, isLoading, pathname, router]);

  // Simplificando o estado de carregamento, pois não estamos mais bloqueando o acesso
  // if (isLoading) {
  //   return (
  //     <div className="flex flex-col min-h-screen">
  //       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  //         <div className="container flex h-16 items-center justify-between">
  //           <Skeleton className="h-8 w-48" />
  //           <Skeleton className="h-8 w-24" />
  //         </div>
  //       </header>
  //       <main className="flex-grow container mx-auto px-4 py-8">
  //         <div className="space-y-4">
  //           <Skeleton className="h-12 w-full" />
  //           <Skeleton className="h-64 w-full" />
  //           <Skeleton className="h-32 w-full" />
  //         </div>
  //       </main>
  //     </div>
  //   );
  // }
  
  // Removida a verificação que retornava null, permitindo acesso direto
  // if (!user && pathname !== '/login') {
  //   return null; 
  // }

  // Para AppHeader ainda funcionar corretamente com o botão de logout, precisamos do AuthContext
  const { user } = useAuth();


  return (
    <>
      {/* Renderiza o AppHeader independentemente do estado de login para esta versão comentada */}
      {/* O AppHeader internamente ainda pode usar o 'user' para o botão de logout, se existir */}
      <AppHeader /> 
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Toaster />
    </>
  );
}
