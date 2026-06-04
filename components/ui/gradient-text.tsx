'use client';

import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'sunset' | 'ocean' | 'emerald';
}

const gradients = {
  primary: 'from-primary via-purple-400 to-pink-500',
  sunset: 'from-orange-500 via-red-500 to-pink-500',
  ocean: 'from-blue-500 via-cyan-400 to-teal-400',
  emerald: 'from-emerald-500 via-green-400 to-teal-500',
};

export function GradientText({ children, className, variant = 'primary' }: GradientTextProps) {
  return (
    <span
      className={cn(
        'bg-gradient-to-r bg-clip-text text-transparent',
        gradients[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
