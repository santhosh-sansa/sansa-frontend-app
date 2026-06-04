'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, isApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GradientText } from '@/components/ui/gradient-text';
import { AnimatedCard } from '@/components/ui/animated-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Store, Download, Sparkles } from 'lucide-react';

type AppItem = { id: string; slug: string; name: string; description: string; category: string; creditsCost: number; iconUrl: string };

export default function MarketplacePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['marketplace', 'apps'],
    queryFn: async () => {
      const res = await apiFetch<{ apps: AppItem[] }>('/api/marketplace/apps');
      if (isApiError(res)) throw new Error(res.error);
      return res.apps || [];
    },
  });

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold"><GradientText>Marketplace</GradientText></h1>
        <p className="text-sm text-muted-foreground">சந்தை — Discover AI apps & integrations</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : !data?.length ? (
        <EmptyState icon={<Store className="h-6 w-6" />} title="Marketplace coming soon" description="AI apps and integrations will appear here" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((app) => (
            <AnimatedCard key={app.id} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  {app.iconUrl ? <img src={app.iconUrl} alt={app.name} className="h-8 w-8 rounded" /> : <Sparkles className="h-6 w-6 text-primary" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">{app.name}</h3>
                  <p className="text-[10px] text-muted-foreground capitalize">{app.category}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{app.description}</p>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{app.creditsCost > 0 ? `${app.creditsCost} credits` : 'Free'}</span>
                <Button size="sm" variant="outline" className="gap-1.5"><Download className="h-3 w-3" />Install</Button>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}
