
"use client";

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { LinkProps } from 'next/link';
import type { ReactNode, MouseEventHandler } from 'react';


interface NavLinkProps extends LinkProps {
  children: ReactNode;
  active?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export function NavLink({ href, children, active, className, onClick, ...props }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "transition-colors hover:text-primary",
        active ? "text-primary font-semibold" : "text-foreground/70",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
