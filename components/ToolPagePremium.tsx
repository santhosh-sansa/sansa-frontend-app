'use client';

import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, isApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AnimatedCard } from '@/components/ui/animated-card';
import { JobProgressCard } from '@/components/jobs/job-progress-card';
import { GradientText } from '@/components/ui/gradient-text';
import { Sparkles, Download, ExternalLink, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  titleTa?: string;
  tool: string;
  endpoint?: string;
  placeholder?: string;
  description?: string;
  descriptionTa?: string;
  creditCost?: number;
  icon?: React.ReactNode;
};

export function ToolPagePremium({
  title,
  titleTa,
  tool,
  endpoint,
  placeholder = 'Describe what you want to create…',
  description,
  descriptionTa,
  creditCost = 2,
  icon,
}: Props) {
  const [prompt, setPrompt] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const generate = useMutation({
    mutationFn: async (value: string) => {
      const path = endpoint || `/api/tools/generate-${tool}`;
      const res = await apiFetch<{ jobId?: string }>(path, {
        method: 'POST',
        body: JSON.stringify({ prompt: value }),
      });

      if (isApiError(res)) {
        throw new Error(res.error || 'Request failed');
      }
      if (!res.jobId) {
        throw new Error('No job id returned');
      }

      return res.jobId;
    },
    onMutate: () => {
      setResultUrl(null);
      setJobId(null);
    },
    onSuccess: (id) => {
      setJobId(id);
      toast.success('Job started! Tracking in real-time…');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    generate.mutate(prompt);
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  const displayUrl = resultUrl
    ? resultUrl.startsWith('http')
      ? resultUrl
      : `${apiBase}${resultUrl}`
    : null;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <GradientText>{title}</GradientText>
            {titleTa && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                {titleTa}
              </span>
            )}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {description || 'Real generation — credits are charged and results are stored in R2.'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input panel */}
        <AnimatedCard hover={false}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tool-prompt" className="text-sm font-medium">
                Creative Brief
              </Label>
              <Textarea
                id="tool-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={placeholder}
                required
                disabled={generate.isPending}
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Cost: <span className="font-medium text-primary">{creditCost} credits</span>
              </span>
              <Button
                type="submit"
                disabled={generate.isPending || !prompt.trim()}
                className="gap-2"
              >
                {generate.isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </form>
        </AnimatedCard>

        {/* Result panel */}
        <div className="space-y-4">
          {/* Real-time job progress */}
          {jobId && (
            <JobProgressCard
              jobId={jobId}
              title={`${title} — ${prompt.slice(0, 30)}…`}
            />
          )}

          {/* Result display */}
          {displayUrl && (
            <AnimatedCard hover={false} className="overflow-hidden p-0">
              <div className="relative">
                <img
                  src={displayUrl}
                  alt="Generated result"
                  className="w-full rounded-t-xl object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity hover:opacity-100">
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                    <Button size="sm" variant="secondary" className="gap-1.5" asChild>
                      <a href={displayUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </a>
                    </Button>
                    <Button size="sm" className="gap-1.5" asChild>
                      <a href={displayUrl} download>
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          )}

          {/* Empty state */}
          {!jobId && !displayUrl && (
            <AnimatedCard
              hover={false}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                <Sparkles className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Your creation will appear here
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Real-time progress tracking via WebSocket
              </p>
            </AnimatedCard>
          )}
        </div>
      </div>
    </div>
  );
}
