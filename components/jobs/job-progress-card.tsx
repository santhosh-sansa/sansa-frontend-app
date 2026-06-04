'use client';

import { useJobSubscription } from '@/hooks/use-socket';
import { AnimatedCard } from '@/components/ui/animated-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { PulseDot } from '@/components/ui/pulse-dot';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Download, ExternalLink } from 'lucide-react';

interface JobProgressCardProps {
  jobId: string;
  title?: string;
  onComplete?: (result: Record<string, unknown>) => void;
}

export function JobProgressCard({ jobId, title, onComplete }: JobProgressCardProps) {
  const { status, progress, result, error, connected } = useJobSubscription(jobId);

  const isComplete = status === 'completed';
  const isFailed = status === 'failed';
  const isProcessing = status === 'processing';

  return (
    <AnimatedCard
      className={cn(
        'flex items-center gap-4',
        isComplete && 'border-emerald-500/30',
        isFailed && 'border-red-500/30',
      )}
      hover={false}
    >
      {/* Progress indicator */}
      <div className="shrink-0">
        {isComplete ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          </div>
        ) : isFailed ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <XCircle className="h-7 w-7 text-red-500" />
          </div>
        ) : (
          <ProgressRing progress={progress} size={56} strokeWidth={4} />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{title || `Job ${jobId.slice(0, 8)}`}</p>
          <PulseDot
            status={
              isComplete ? 'online' : isFailed ? 'error' : isProcessing ? 'processing' : 'idle'
            }
            size="sm"
          />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground capitalize">
          {isFailed ? error || 'Job failed' : status}
          {isProcessing && progress > 0 && ` — ${Math.round(progress)}%`}
        </p>
        {!connected && (
          <p className="mt-1 text-[10px] text-amber-500">Reconnecting to real-time updates…</p>
        )}
      </div>

      {/* Actions */}
      {isComplete && result?.url && (
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" asChild>
            <a href={result.url as string} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              View
            </a>
          </Button>
          <Button size="sm" className="gap-1.5" asChild>
            <a href={result.url as string} download>
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          </Button>
        </div>
      )}
    </AnimatedCard>
  );
}
