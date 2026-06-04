'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiFetch, isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { GradientText } from '@/components/ui/gradient-text';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Sparkles, Layout, Star, Zap, Clock,
  ChevronRight, ExternalLink, ArrowRight, Filter,
  LayoutGrid, LayoutList,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────

interface TemplateItem {
  id: string;
  slug: string;
  title: string;
  titleTa: string;
  category: string;
  subcategory: string;
  tags: string[];
  previewUrl: string;
  previewGradient: string;
  canvasWidth: number;
  canvasHeight: number;
  creditsCost: number;
  isPremium: boolean;
  usageCount: number;
}

interface Category {
  category: string;
  count: number;
  label: string;
  labelTa: string;
  emoji: string;
}

// ─── TemplateCard ─────────────────────────────────────────────

function TemplateCard({
  tpl,
  onUse,
  compact = false,
}: {
  tpl: TemplateItem;
  onUse: (tpl: TemplateItem) => void;
  compact?: boolean;
}) {
  const aspect = tpl.canvasHeight / tpl.canvasWidth;
  const isSquare   = Math.abs(aspect - 1) < 0.1;
  const isPortrait = aspect > 1.3;

  return (
    <div className={cn(
      'group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden',
      'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200',
      compact && 'cursor-pointer',
    )}>
      {/* Preview */}
      <div
        className={cn(
          'relative overflow-hidden flex items-center justify-center',
          isPortrait ? 'aspect-[9/16]' : isSquare ? 'aspect-square' : 'aspect-video',
          compact && (isPortrait ? 'aspect-[9/16]' : 'aspect-video'),
        )}
        style={{ background: tpl.previewGradient || 'linear-gradient(135deg, #1e1b4b, #6366f1)' }}
      >
        {tpl.previewUrl ? (
          <img src={tpl.previewUrl} alt={tpl.title} className="h-full w-full object-cover" />
        ) : (
          // CSS gradient preview with canvas size badge
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <Layout className="h-8 w-8 text-white/30" />
            <p className="text-center text-[10px] text-white/50 font-medium">
              {tpl.canvasWidth}×{tpl.canvasHeight}
            </p>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm" className="gap-1.5 shadow-lg"
            onClick={(e) => { e.stopPropagation(); onUse(tpl); }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Use Template
          </Button>
        </div>

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {tpl.isPremium && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white">
              <Star className="h-2.5 w-2.5" />PRO
            </span>
          )}
          {tpl.creditsCost === 0 && !tpl.isPremium && (
            <span className="rounded-full bg-emerald-500/80 px-2 py-0.5 text-[9px] font-bold text-white">
              FREE
            </span>
          )}
          {tpl.creditsCost > 0 && !tpl.isPremium && (
            <span className="rounded-full bg-primary/80 px-2 py-0.5 text-[9px] font-bold text-white">
              {tpl.creditsCost} cr
            </span>
          )}
        </div>

        {/* Usage count */}
        {tpl.usageCount > 0 && (
          <div className="absolute bottom-2 right-2">
            <span className="rounded-full bg-black/50 px-1.5 py-0.5 text-[9px] text-white/70">
              {tpl.usageCount > 999 ? `${Math.round(tpl.usageCount / 1000)}k` : tpl.usageCount} uses
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium truncate text-foreground">{tpl.title}</p>
          {tpl.titleTa && (
            <p className="text-[10px] text-muted-foreground truncate">{tpl.titleTa}</p>
          )}
          <p className="mt-0.5 text-[9px] text-muted-foreground/60 capitalize">{tpl.subcategory || tpl.category}</p>
        </div>
        <button
          onClick={() => onUse(tpl)}
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          title="Use template"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Templates Page ──────────────────────────────────────

export default function TemplatesPage() {
  const router = useRouter();

  const [category,    setCategory]    = useState('');
  const [search,      setSearch]      = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [sort,        setSort]        = useState<'popular' | 'newest' | 'free'>('popular');
  const [page,        setPage]        = useState(1);
  const [viewGrid,    setViewGrid]    = useState<'grid' | 'list'>('grid');

  // Debounce search
  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    clearTimeout((handleSearch as {_t?: ReturnType<typeof setTimeout>})._t);
    (handleSearch as {_t?: ReturnType<typeof setTimeout>})._t = setTimeout(() => {
      setDebounced(val);
      setPage(1);
    }, 350);
  }, []);

  // ── Fetch categories ─────────────────────────────────────────
  const { data: catsData } = useQuery({
    queryKey: ['template-categories'],
    queryFn: async () => {
      const res = await apiFetch<{ ok: boolean; categories: Category[] }>('/api/templates/categories');
      if (isApiError(res)) return { categories: [] as Category[] };
      return res;
    },
    staleTime: 1000 * 60 * 10,
  });
  const categories = catsData?.categories ?? [];

  // ── Fetch templates ──────────────────────────────────────────
  const qKey = ['templates', category, debouncedSearch, sort, page];
  const { data, isLoading, isFetching } = useQuery({
    queryKey: qKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        sort, page: String(page), limit: '48',
        ...(category && { category }),
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const res = await apiFetch<{
        ok: boolean;
        templates: TemplateItem[];
        total: number;
        pages: number;
      }>(`/api/templates?${params}`);
      if (isApiError(res)) throw new Error(res.error);
      return res;
    },
    staleTime: 1000 * 60 * 2,
  });

  const templates = data?.templates ?? [];
  const totalPages = data?.pages ?? 1;
  const total = data?.total ?? 0;

  // ── Use template ─────────────────────────────────────────────
  const useTemplate = useCallback(async (tpl: TemplateItem) => {
    try {
      // Fetch full payload
      const res = await apiFetch<{ ok: boolean; template: TemplateItem & { payloadJson: object } }>(
        `/api/templates/${tpl.slug}`,
      );
      if (isApiError(res)) throw new Error(res.error);

      // Store in sessionStorage for editor to pick up
      sessionStorage.setItem('sansa_template_load', JSON.stringify({
        slug: tpl.slug,
        title: tpl.title,
        canvasWidth: tpl.canvasWidth,
        canvasHeight: tpl.canvasHeight,
        payload: res.template.payloadJson,
      }));

      toast.success(`Loading "${tpl.title}" in editor…`);
      router.push('/studio/editor');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load template');
    }
  }, [router]);

  const SORT_OPTIONS = [
    { value: 'popular', label: 'Popular',  icon: Zap    },
    { value: 'newest',  label: 'Newest',   icon: Clock  },
    { value: 'free',    label: 'Free Only', icon: Sparkles },
  ] as const;

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Category Sidebar ─────────────────────────────────── */}
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border bg-card/30 p-3 overflow-y-auto lg:flex">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Categories
        </p>

        <button
          onClick={() => { setCategory(''); setPage(1); }}
          className={cn(
            'flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors',
            !category ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Layout className="h-4 w-4 shrink-0" />
          <span className="flex-1">All Templates</span>
          {total > 0 && <span className="text-[9px] text-muted-foreground">{total}</span>}
        </button>

        {categories.map((cat) => (
          <button
            key={cat.category}
            onClick={() => { setCategory(cat.category); setPage(1); }}
            className={cn(
              'flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors',
              category === cat.category
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span className="shrink-0 text-base">{cat.emoji}</span>
            <div className="flex-1 min-w-0 text-left">
              <p className="truncate">{cat.label}</p>
              <p className="text-[9px] opacity-70">{cat.labelTa}</p>
            </div>
            <span className="shrink-0 text-[9px] text-muted-foreground">{cat.count}</span>
          </button>
        ))}
      </aside>

      {/* ── Main Content ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header bar */}
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-card/50 px-4 py-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold">
              <GradientText>
                {category
                  ? (categories.find((c) => c.category === category)?.label ?? category)
                  : 'All Templates'}
              </GradientText>
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                வார்ப்புருக்கள்
              </span>
            </h1>
            <p className="text-[10px] text-muted-foreground">
              {total} templates · {category || 'all categories'}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Sort */}
          <div className="flex rounded-lg border border-border bg-background overflow-hidden">
            {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => { setSort(value); setPage(1); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors',
                  sort === value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3 w-3" />{label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setViewGrid('grid')} className={cn('p-1.5', viewGrid === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setViewGrid('list')} className={cn('p-1.5', viewGrid === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}><LayoutList className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 16 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                <Layout className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <div>
                <p className="font-semibold text-muted-foreground">No templates found</p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Try a different category'}
                </p>
              </div>
              {debouncedSearch && (
                <Button variant="outline" size="sm" onClick={() => { setSearch(''); setDebounced(''); }}>
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className={cn(
                'gap-3',
                viewGrid === 'grid'
                  ? 'grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  : 'grid grid-cols-1 sm:grid-cols-2',
              )}>
                {templates.map((tpl) => (
                  <TemplateCard
                    key={tpl.id}
                    tpl={tpl}
                    onUse={useTemplate}
                    compact={viewGrid === 'list'}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isFetching}
                  >
                    ← Prev
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isFetching}
                  >
                    Next →
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
