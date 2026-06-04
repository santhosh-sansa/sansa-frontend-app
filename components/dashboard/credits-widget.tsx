'use client';

import { CreditCard, TrendingUp } from 'lucide-react';
import { useCreditsBalance } from '@/hooks/use-credits-balance';
import { ProgressRing } from '@/components/ui/progress-ring';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CreditsWidget() {
  const { data: balance, isLoading } = useCreditsBalance();

  if (isLoading) {
    return (
      <AnimatedCard className="flex flex-col gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </AnimatedCard>
    );
  }

  const maxCredits = 10000;
  const usedPercent = balance ? Math.min((balance / maxCredits) * 100, 100) : 0;

  return (
    <AnimatedCard className="flex flex-col items-center gap-4 text-center">
      <div className="flex w-full items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Credits Balance</p>
        <CreditCard className="h-4 w-4 text-primary" />
      </div>

      <ProgressRing progress={usedPercent} size={80} strokeWidth={6} label="available" />

      <div>
        <p className="text-2xl font-bold">{balance?.toLocaleString() ?? 0}</p>
        <p className="text-xs text-muted-foreground">credits remaining</p>
      </div>

      <Link href="/billing" className="w-full">
        <Button variant="outline" size="sm" className="w-full gap-2">
          <TrendingUp className="h-3.5 w-3.5" />
          Top Up
        </Button>
      </Link>
    </AnimatedCard>
  );
}
