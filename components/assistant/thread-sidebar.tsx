'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, isApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Plus, MessageSquare, Pin, Trash2, Search } from 'lucide-react';

type Thread = {
  id: string;
  title: string;
  language: string;
  pinned: boolean;
  lastMessage: { content: string; role: string } | null;
  updatedAt: string;
};

interface ThreadSidebarProps {
  activeThreadId: string | null;
  onSelectThread: (id: string | null) => void;
}

export function ThreadSidebar({ activeThreadId, onSelectThread }: ThreadSidebarProps) {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['assistant', 'threads'],
    queryFn: async () => {
      const res = await apiFetch<{ threads: Thread[] }>('/api/assistant/threads');
      if (isApiError(res)) throw new Error(res.error);
      return res.threads;
    },
  });

  const createThread = useMutation({
    mutationFn: async () => {
      const res = await apiFetch<{ thread: { id: string } }>('/api/assistant/threads', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Chat' }),
      });
      if (isApiError(res)) throw new Error(res.error);
      return res.thread;
    },
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: ['assistant', 'threads'] });
      onSelectThread(thread.id);
    },
  });

  const deleteThread = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/assistant/threads/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistant', 'threads'] });
      onSelectThread(null);
    },
  });

  const threads = (data || []).filter((t) =>
    search ? t.title.toLowerCase().includes(search.toLowerCase()) : true,
  );

  const pinnedThreads = threads.filter((t) => t.pinned);
  const recentThreads = threads.filter((t) => !t.pinned);

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-medium">Threads</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => createThread.mutate()}
          disabled={createThread.isPending}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search threads..."
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Thread list */}
      <ScrollArea className="flex-1 px-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {/* New chat option */}
            <button
              onClick={() => onSelectThread(null)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors',
                !activeThreadId
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Quick Chat (no thread)
            </button>

            {/* Pinned */}
            {pinnedThreads.length > 0 && (
              <>
                <p className="mt-3 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Pinned
                </p>
                {pinnedThreads.map((thread) => (
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={thread.id === activeThreadId}
                    onSelect={() => onSelectThread(thread.id)}
                    onDelete={() => deleteThread.mutate(thread.id)}
                  />
                ))}
              </>
            )}

            {/* Recent */}
            {recentThreads.length > 0 && (
              <>
                <p className="mt-3 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Recent
                </p>
                {recentThreads.map((thread) => (
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={thread.id === activeThreadId}
                    onSelect={() => onSelectThread(thread.id)}
                    onDelete={() => deleteThread.mutate(thread.id)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function ThreadItem({
  thread,
  isActive,
  onSelect,
  onDelete,
}: {
  thread: Thread;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors cursor-pointer',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
      )}
      onClick={onSelect}
    >
      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{thread.title}</p>
        {thread.lastMessage && (
          <p className="truncate text-[10px] text-muted-foreground">
            {thread.lastMessage.content.slice(0, 40)}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {thread.pinned && <Pin className="h-3 w-3 text-primary" />}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded p-0.5 hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
