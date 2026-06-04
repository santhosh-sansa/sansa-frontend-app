'use client';

import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  hover?: boolean;
}

export function AnimatedCard({
  children,
  className,
  glowColor = 'var(--primary)',
  hover = true,
}: AnimatedCardProps) {
  return (
    <div
      className={cn(
        'group relative rounded-xl border border-border bg-card p-6 transition-all duration-300 overflow-hidden',
        hover && 'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1',
        className,
      )}
    >
      {/* Glow effect on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          boxShadow: `0 0 30px hsl(${glowColor} / 0.15)`,
          filter: 'blur(10px)',
        }}
      />
      {/* Shine sweep on hover */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  return (
    <AnimatedCard className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {trend && (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium',
              trend.value >= 0
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400',
            )}
          >
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </AnimatedCard>
  );
}
