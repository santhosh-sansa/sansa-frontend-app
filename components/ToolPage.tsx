'use client';

import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, isApiError, pollJob } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  title: string;
  titleTa?: string;
  tool: string;
  endpoint?: string;
  placeholder?: string;
  locale?: 'en' | 'ta';
};

export function ToolPage({
  title,
  titleTa,
  tool,
  endpoint,
  placeholder = 'Describe what you want to create…',
  locale = 'en',
}: Props) {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('');
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

      return pollJob(res.jobId, (s) =>
        setStatus(locale === 'ta' ? `நிலை: ${s}` : `Status: ${s}`),
      );
    },
    onMutate: () => {
      setResultUrl(null);
      setStatus(locale === 'ta' ? 'தொடங்குகிறது…' : 'Starting…');
    },
    onSuccess: (job) => {
      const url = job.result?.url;
      if (url) {
        setResultUrl(url);
        setStatus(locale === 'ta' ? 'முடிந்தது!' : 'Done!');
        toast.success(locale === 'ta' ? 'உருவாக்கம் முடிந்தது' : 'Generation complete');
      } else {
        toast.warning(locale === 'ta' ? 'வேலை முடிந்தது — URL இல்லை' : 'Job finished without a URL');
      }
    },
    onError: (err: Error) => {
      setStatus('');
      toast.error(err.message);
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    generate.mutate(prompt);
  }

  const heading = locale === 'ta' && titleTa ? titleTa : title;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  const displayUrl = resultUrl
    ? resultUrl.startsWith('http')
      ? resultUrl
      : `${apiBase}${resultUrl}`
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {locale === 'ta'
            ? 'உண்மையான வேலை — கிரெடிட்கள் கழிக்கப்படும், முடிவு R2-ல் சேமிக்கப்படும்.'
            : 'Real generation — credits are charged and results are stored in R2.'}
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{locale === 'ta' ? 'உள்ளீடு' : 'Prompt'}</CardTitle>
          <CardDescription>
            {locale === 'ta' ? 'நீங்கள் என்ன உருவாக்க வேண்டும் என்று விவரிக்கவும்.' : 'Describe your creative brief.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tool-prompt">{locale === 'ta' ? 'விளக்கம்' : 'Description'}</Label>
              <Textarea
                id="tool-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={placeholder}
                required
                disabled={generate.isPending}
              />
            </div>
            <Button type="submit" disabled={generate.isPending || !prompt.trim()}>
              {generate.isPending
                ? locale === 'ta'
                  ? 'உருவாக்குகிறது…'
                  : 'Generating…'
                : locale === 'ta'
                  ? 'உருவாக்கு'
                  : 'Generate'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {status && <p className="text-sm text-muted-foreground">{status}</p>}

      {displayUrl && (
        <Card>
          <CardHeader>
            <CardTitle>{locale === 'ta' ? 'முடிவு' : 'Result'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <img
              src={displayUrl}
              alt="Result"
              className="max-w-full rounded-lg border border-border"
            />
            <a
              href={displayUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              {locale === 'ta' ? 'பதிவிறக்கம்' : 'Download'}
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
