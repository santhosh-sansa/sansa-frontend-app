'use client';

import { cn } from '@/lib/utils';

interface PulseDotProps {
  status: 'online' | 'processing' | 'error' | 'idle';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusColors = {
  online: 'bg-emerald-500',
  processing: 'bg-amber-500',
  error: 'bg-red-500',
  idle: 'bg-muted-foreground/50',
};

const sizeMap = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

export function PulseDot({ status, className, size = 'md' }: PulseDotProps) {
  return (
    <span className={cn('relative inline-flex', className)}>
      {status !== 'idle' && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
            statusColors[status],
          )}
        />
      )}
      <span className={cn('relative inline-flex rounded-full', sizeMap[size], statusColors[status])} />
    </span>
  );
}
