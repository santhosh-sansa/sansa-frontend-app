'use client';

import { useCreditsBalance } from '@/hooks/use-credits-balance';
import { Coins } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function CreditsDisplay() {
  const { data: balance, isLoading } = useCreditsBalance();

  return (
    <Link
      href="/billing"
      className={cn(
        'flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors',
        'hover:bg-primary/20',
      )}
    >
      <Coins className="h-3.5 w-3.5" />
      {isLoading ? (
        <span className="h-3 w-8 animate-pulse rounded bg-primary/20" />
      ) : (
        <span>{balance?.toLocaleString() ?? 0}</span>
      )}
    </Link>
  );
}
