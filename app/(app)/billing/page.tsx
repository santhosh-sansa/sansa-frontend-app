'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch, isApiError } from '@/lib/api';
import { useCreditsBalance } from '@/hooks/use-credits-balance';
import { Button } from '@/components/ui/button';
import { GradientText } from '@/components/ui/gradient-text';
import { AnimatedCard } from '@/components/ui/animated-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { CreditCard, Sparkles, Check, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PACKS = [
  { id: 'pack_100', credits: 100, price: 49, popular: false },
  { id: 'pack_500', credits: 500, price: 199, popular: true },
  { id: 'pack_1200', credits: 1200, price: 449, popular: false },
  { id: 'pack_3000', credits: 3000, price: 999, popular: false },
];

export default function BillingPage() {
  const { data: balance, isLoading } = useCreditsBalance();

  const buyPack = useMutation({
    mutationFn: async (packageId: string) => {
      const res = await apiFetch<{ paymentUrl?: string }>('/api/billing/create-order', {
        method: 'POST',
        body: JSON.stringify({ packageId }),
      });
      if (isApiError(res)) throw new Error(res.error);
      if (res.paymentUrl) window.location.href = res.paymentUrl;
      return res;
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const maxCredits = 10000;
  const usedPercent = balance ? Math.min((balance / maxCredits) * 100, 100) : 0;

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold"><GradientText>Billing & Credits</GradientText></h1>
        <p className="text-sm text-muted-foreground">கிரெடிட்கள் — Manage your credits & subscription</p>
      </div>

      {/* Current balance */}
      <AnimatedCard hover={false} className="flex items-center gap-6">
        <ProgressRing progress={usedPercent} size={80} strokeWidth={6} />
        <div>
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-3xl font-bold">{isLoading ? '...' : (balance ?? 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">credits available</p>
        </div>
      </AnimatedCard>

      {/* Credit packs */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Buy Credits</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PACKS.map((pack) => (
            <AnimatedCard
              key={pack.id}
              className={cn('flex flex-col items-center gap-4 text-center', pack.popular && 'border-primary/50 ring-1 ring-primary/20')}
            >
              {pack.popular && (
                <span className="rounded-full bg-primary px-3 py-0.5 text-[10px] font-medium text-primary-foreground">Most Popular</span>
              )}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pack.credits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">credits</p>
              </div>
              <p className="flex items-center text-lg font-semibold">
                <IndianRupee className="h-4 w-4" />{pack.price}
              </p>
              <Button
                className="w-full gap-2"
                variant={pack.popular ? 'default' : 'outline'}
                onClick={() => buyPack.mutate(pack.id)}
                disabled={buyPack.isPending}
              >
                <CreditCard className="h-4 w-4" />Buy Now
              </Button>
            </AnimatedCard>
          ))}
        </div>
      </div>

      {/* Features */}
      <AnimatedCard hover={false}>
        <h3 className="text-sm font-medium mb-3">What you get with credits:</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {['AI Image Generation (3 credits)', 'Voice Synthesis (2 credits)', 'AI Chat Messages (1 credit)', 'Banner/Poster Creation (2 credits)', 'Background Removal (1 credit)', 'Document Processing (1 credit)'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-emerald-500" />{item}
            </div>
          ))}
        </div>
      </AnimatedCard>
    </div>
  );
}
