'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, isApiError } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { GradientText } from '@/components/ui/gradient-text';
import { AnimatedCard } from '@/components/ui/animated-card';
import { EmptyState } from '@/components/ui/empty-state';
import { BookOpen, Search } from 'lucide-react';

type KnowledgeResult = { type: string; id: string; title: string; snippet: string };

export default function KnowledgePage() {
  const [query, setQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const res = await apiFetch<{ results: KnowledgeResult[] }>(`/api/assistant/search?q=${encodeURIComponent(query)}`);
      if (isApiError(res)) return [];
      return res.results || [];
    },
    enabled: query.length > 2,
  });

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold"><GradientText>Knowledge Base</GradientText></h1>
        <p className="text-sm text-muted-foreground">அறிவுத்தளம் — Search templates, threads & docs</p>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search knowledge base..." className="pl-10" />
      </div>

      {!query.trim() ? (
        <EmptyState icon={<BookOpen className="h-6 w-6" />} title="Search your knowledge" description="Type to search templates, chat threads, and documents" />
      ) : isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !data?.length ? (
        <EmptyState icon={<Search className="h-6 w-6" />} title="No results" description={`Nothing found for "${query}"`} />
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <AnimatedCard key={item.id} className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.snippet}</p>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize">{item.type}</span>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}
