'use client';

import { useApiList } from '@/hooks/use-api-list';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PulseDot } from '@/components/ui/pulse-dot';
import { Activity, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  status: string;
  createdAt: string;
};

function getStatusDot(status: string) {
  switch (status) {
    case 'completed':
      return 'online' as const;
    case 'processing':
    case 'in_progress':
      return 'processing' as const;
    case 'failed':
      return 'error' as const;
    default:
      return 'idle' as const;
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ActivityFeed() {
  const { data, isLoading } = useApiList('/api/jobs?limit=8');

  if (isLoading) {
    return (
      <AnimatedCard className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Recent Activity</span>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </div>
        ))}
      </AnimatedCard>
    );
  }

  const items = (data as ActivityItem[]) || [];

  return (
    <AnimatedCard className="flex flex-col gap-3" hover={false}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Recent Activity</span>
        </div>
        <span className="text-xs text-muted-foreground">{items.length} jobs</span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-6 w-6" />}
          title="No activity yet"
          description="Your AI jobs and tasks will appear here"
          className="py-8"
        />
      ) : (
        <div className="space-y-2">
          {items.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                'hover:bg-muted/50',
              )}
            >
              <PulseDot status={getStatusDot(item.status)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title || item.type}</p>
                <p className="text-xs text-muted-foreground capitalize">{item.status}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {item.createdAt ? timeAgo(item.createdAt) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </AnimatedCard>
  );
}
