
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/icons/Logo';
import { NavLink } from './NavLink';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, Settings2, Bell, Brain, LinkIcon, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/', label: 'Agendar', icon: Home },
  { href: '/procedures', label: 'Procedimentos', icon: Settings2 },
  { href: '/notifications', label: 'Notificações', icon: Bell },
  { href: '/ai-scheduler', label: 'Assistente AI', icon: Brain },
  { href: '/settings/integrations', label: 'Integrações', icon: LinkIcon },
];

export function AppHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  if (!user) {
    return null; // Não renderiza o header se não estiver logado
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
          <Logo />
        </Link>
        
        <nav className="hidden md:flex items-center space-x-4 text-sm font-medium">
          {navItems.map((item) => (
            <NavLink 
              key={item.href} 
              href={item.href} 
              active={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </nav>

        <div className="md:hidden flex items-center">
          <Button variant="ghost" size="icon" onClick={logout} className="mr-2">
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sair</span>
          </Button>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <div className="p-6">
                <Link href="/" className="flex items-center gap-2 mb-6" onClick={() => setIsMobileMenuOpen(false)}>
                  <Logo />
                </Link>
              </div>
              <nav className="flex flex-col space-y-1 px-4">
                {navItems.map((item) => (
                  <NavLink 
                    key={item.href} 
                    href={item.href} 
                    active={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')}
                    className="flex items-center px-3 py-2 text-base rounded-md hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
