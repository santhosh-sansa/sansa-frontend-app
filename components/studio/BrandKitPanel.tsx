'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, isApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { AnimatedCard } from '@/components/ui/animated-card';
import { GradientText } from '@/components/ui/gradient-text';
import { cn } from '@/lib/utils';
import { FONT_REGISTRY } from '@/lib/tamil-fonts';
import {
  Palette, Upload, Trash2, Save, Plus, X,
  Globe, Building2, Tag, Type, Loader2,
  CheckCircle2, Sparkles,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────

export interface BrandKit {
  id: string;
  brandName: string;
  tagline: string;
  logoUrl: string;
  colors: string[];
  primaryFont: string;
  secondaryFont: string;
  industry: string;
  website: string;
  updatedAt: string;
}

// ─── Default brand colors palette ────────────────────────────

const DEFAULT_PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899',
  '#ffffff', '#000000', '#f8fafc',
];

const INDUSTRY_OPTIONS = [
  { value: '',              label: 'Select industry…'       },
  { value: 'retail',        label: '🛍️ Retail / Shop'        },
  { value: 'food',          label: '🍽️ Food & Restaurant'    },
  { value: 'education',     label: '📚 Education / Coaching'  },
  { value: 'healthcare',    label: '🏥 Healthcare / Clinic'   },
  { value: 'real-estate',   label: '🏠 Real Estate'           },
  { value: 'technology',    label: '💻 Technology'            },
  { value: 'fashion',       label: '👗 Fashion / Clothing'    },
  { value: 'beauty',        label: '💄 Beauty / Salon'        },
  { value: 'manufacturing', label: '🏭 Manufacturing'         },
  { value: 'services',      label: '🔧 Professional Services'  },
  { value: 'agriculture',   label: '🌾 Agriculture'            },
  { value: 'transport',     label: '🚛 Transport / Logistics'  },
  { value: 'other',         label: '📋 Other'                  },
];

// ─── Color swatch ─────────────────────────────────────────────

function ColorSwatch({
  color,
  selected,
  onSelect,
  onRemove,
  size = 'md',
}: {
  color: string;
  selected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="group relative">
      <button
        onClick={onSelect}
        className={cn(
          'rounded-lg border-2 transition-all',
          size === 'sm' ? 'h-7 w-7' : 'h-10 w-10',
          selected ? 'border-primary shadow-md scale-110' : 'border-transparent hover:border-primary/40',
        )}
        style={{ background: color }}
        title={color}
      />
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

// ─── Main BrandKitPanel ────────────────────────────────────────

interface BrandKitPanelProps {
  /** compact mode for FabricEditor sidebar */
  compact?: boolean;
  /** called when user clicks "Apply to canvas" */
  onApplyToCanvas?: (kit: BrandKit) => void;
}

export function BrandKitPanel({ compact = false, onApplyToCanvas }: BrandKitPanelProps) {
  const qc = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  // Form state (mirrors DB)
  const [brandName,     setBrandName]     = useState('');
  const [tagline,       setTagline]       = useState('');
  const [colors,        setColors]        = useState<string[]>(DEFAULT_PALETTE);
  const [primaryFont,   setPrimaryFont]   = useState('Noto Sans Tamil');
  const [secondaryFont, setSecondaryFont] = useState('Inter');
  const [industry,      setIndustry]      = useState('');
  const [website,       setWebsite]       = useState('');
  const [logoUrl,       setLogoUrl]       = useState('');
  const [newColor,      setNewColor]      = useState('#6366f1');
  const [isDirty,       setIsDirty]       = useState(false);

  // ── Load brand kit ───────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['brand-kit'],
    queryFn: async () => {
      const res = await apiFetch<{ ok: boolean; brandKit: BrandKit | null }>('/api/brand-kit');
      if (isApiError(res)) return { brandKit: null as BrandKit | null };
      return res;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Sync form when data loads
  useEffect(() => {
    const kit = data?.brandKit;
    if (!kit) return;
    setBrandName(kit.brandName   || '');
    setTagline(kit.tagline       || '');
    setColors(kit.colors?.length ? kit.colors : DEFAULT_PALETTE);
    setPrimaryFont(kit.primaryFont   || 'Noto Sans Tamil');
    setSecondaryFont(kit.secondaryFont || 'Inter');
    setIndustry(kit.industry     || '');
    setWebsite(kit.website       || '');
    setLogoUrl(kit.logoUrl       || '');
    setIsDirty(false);
  }, [data]);

  // Mark dirty on any change
  const mark = useCallback(() => setIsDirty(true), []);

  // ── Save ─────────────────────────────────────────────────────

  const save = useMutation({
    mutationFn: async () => {
      const res = await apiFetch<{ ok: boolean; brandKit: BrandKit }>(
        '/api/brand-kit',
        {
          method: 'PUT',
          body: JSON.stringify({ brandName, tagline, colors, primaryFont, secondaryFont, industry, website }),
        },
      );
      if (isApiError(res)) throw new Error(res.error);
      return res.brandKit;
    },
    onSuccess: (kit) => {
      void qc.invalidateQueries({ queryKey: ['brand-kit'] });
      setIsDirty(false);
      toast.success('Brand Kit saved! 🎨');
      if (onApplyToCanvas && kit) onApplyToCanvas(kit);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Logo upload ──────────────────────────────────────────────

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const token = localStorage.getItem('sansa_access_token');
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${apiBase}/api/brand-kit/logo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json() as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || 'Upload failed');
      return data.url!;
    },
    onSuccess: (url) => {
      setLogoUrl(url);
      void qc.invalidateQueries({ queryKey: ['brand-kit'] });
      toast.success('Logo uploaded!');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Color management ─────────────────────────────────────────

  const addColor = () => {
    if (colors.length >= 10) { toast.error('Maximum 10 brand colors'); return; }
    if (colors.includes(newColor)) { toast.error('Color already in palette'); return; }
    setColors((c) => [...c, newColor]);
    mark();
  };

  const removeColor = (c: string) => {
    setColors((prev) => prev.filter((x) => x !== c));
    mark();
  };

  const FONT_OPTIONS = FONT_REGISTRY.map((f) => ({
    value: f.family,
    label: f.labelTa ? `${f.family} — ${f.labelTa}` : f.family,
    script: f.script,
  }));

  const logoDisplay = logoUrl?.startsWith('http') ? logoUrl : logoUrl ? `${apiBase}${logoUrl}` : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />Loading brand kit…
      </div>
    );
  }

  // ── Compact mode (FabricEditor sidebar) ─────────────────────

  if (compact) {
    return (
      <div className="space-y-4">
        {/* Logo */}
        {logoDisplay ? (
          <div className="flex items-center gap-3">
            <img src={logoDisplay} alt="Logo" className="h-10 w-10 rounded-lg object-contain border border-border bg-white" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{brandName || 'Brand Name'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{tagline}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
            No brand kit saved yet.<br />
            <a href="/settings" className="text-primary underline">Set up in Settings →</a>
          </div>
        )}

        {/* Color swatches */}
        {colors.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Brand Colors</p>
            <div className="flex flex-wrap gap-1.5">
              {colors.map((c) => (
                <ColorSwatch key={c} color={c} size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* Fonts */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Brand Fonts</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-16 shrink-0 text-muted-foreground">Primary</span>
              <span className="font-medium truncate" style={{ fontFamily: primaryFont }}>{primaryFont}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-16 shrink-0 text-muted-foreground">Secondary</span>
              <span className="font-medium truncate" style={{ fontFamily: secondaryFont }}>{secondaryFont}</span>
            </div>
          </div>
        </div>

        {/* Apply button */}
        {onApplyToCanvas && data?.brandKit && (
          <Button
            size="sm" className="w-full gap-2"
            onClick={() => onApplyToCanvas(data.brandKit!)}
          >
            <Sparkles className="h-3.5 w-3.5" />Apply Brand to Canvas
          </Button>
        )}
      </div>
    );
  }

  // ── Full editor mode (Settings page) ────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Brand Kit</h2>
            <p className="text-[11px] text-muted-foreground">பிராண்ட் கிட் — save your brand identity</p>
          </div>
        </div>
        {isDirty && (
          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
            Unsaved changes
          </span>
        )}
      </div>

      {/* Logo */}
      <AnimatedCard hover={false} className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold">Logo</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Preview */}
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
            onClick={() => logoInputRef.current?.click()}
          >
            {logoDisplay ? (
              <img src={logoDisplay} alt="Logo" className="h-full w-full object-contain p-1" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <Upload className="h-5 w-5" />
                <span className="text-[9px]">Upload</span>
              </div>
            )}
          </div>
          <div className="space-y-2 flex-1">
            <Button
              variant="outline" size="sm" className="gap-1.5"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadLogo.isPending}
            >
              {uploadLogo.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Upload className="h-3.5 w-3.5" />}
              {logoDisplay ? 'Change Logo' : 'Upload Logo'}
            </Button>
            <p className="text-[10px] text-muted-foreground">PNG, SVG, JPG, WebP · max 5 MB</p>
            {logoDisplay && (
              <button
                onClick={() => { setLogoUrl(''); mark(); }}
                className="flex items-center gap-1 text-[10px] text-destructive hover:text-destructive/80 transition-colors"
              >
                <Trash2 className="h-3 w-3" />Remove logo
              </button>
            )}
          </div>
        </div>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadLogo.mutate(f);
            e.target.value = '';
          }}
        />
      </AnimatedCard>

      {/* Brand info */}
      <AnimatedCard hover={false} className="space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold">Brand Identity</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">
              Brand Name <span className="text-muted-foreground/60">· பிராண்ட் பெயர்</span>
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => { setBrandName(e.target.value); mark(); }}
              placeholder="e.g. Sri Murugan Traders / ஸ்ரீ முருகன் டிரேடர்ஸ்"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">
              Tagline <span className="text-muted-foreground/60">· தொடர் வாக்கியம்</span>
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => { setTagline(e.target.value); mark(); }}
              placeholder="e.g. தரமான சேவை, நம்பகமான விலை"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Industry</label>
              <select
                value={industry}
                onChange={(e) => { setIndustry(e.target.value); mark(); }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {INDUSTRY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => { setWebsite(e.target.value); mark(); }}
                placeholder="https://sansaai.in"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                maxLength={300}
              />
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* Brand colors */}
      <AnimatedCard hover={false} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold">
              Brand Colors <span className="text-muted-foreground/60">· நிறங்கள்</span>
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground">{colors.length}/10</span>
        </div>

        {/* Palette display */}
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <ColorSwatch key={c} color={c} onRemove={() => removeColor(c)} />
          ))}
        </div>

        {/* Add color */}
        {colors.length < 10 && (
          <div className="flex items-center gap-2">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border cursor-pointer">
              <div className="absolute inset-0" style={{ background: newColor }} />
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground w-16">{newColor}</span>
            <Button
              variant="outline" size="sm" className="gap-1.5"
              onClick={addColor}
            >
              <Plus className="h-3.5 w-3.5" />Add
            </Button>
          </div>
        )}

        {/* Quick palette presets */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground">Quick palettes</p>
          <div className="flex flex-col gap-1.5">
            {[
              { name: 'Tamil Classic', colors: ['#8B0000','#FFD700','#006400','#FFFFFF','#000000'] },
              { name: 'Modern Purple', colors: ['#6366f1','#8b5cf6','#ec4899','#ffffff','#0f172a'] },
              { name: 'Corporate Blue', colors: ['#1d4ed8','#3b82f6','#93c5fd','#ffffff','#1e293b'] },
              { name: 'Warm Saffron',  colors: ['#f97316','#fb923c','#fcd34d','#ffffff','#7c2d12'] },
              { name: 'Forest Green',  colors: ['#15803d','#22c55e','#bbf7d0','#ffffff','#14532d'] },
            ].map((preset) => (
              <button
                key={preset.name}
                onClick={() => { setColors(preset.colors); mark(); }}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
              >
                <div className="flex gap-0.5">
                  {preset.colors.map((c) => (
                    <div key={c} className="h-5 w-5 rounded border border-white/20" style={{ background: c }} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </AnimatedCard>

      {/* Brand fonts */}
      <AnimatedCard hover={false} className="space-y-4">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold">
            Brand Fonts <span className="text-muted-foreground/60">· எழுத்துரு</span>
          </p>
        </div>

        <div className="space-y-3">
          {/* Primary font */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">
              Primary Font <span className="text-[9px] text-muted-foreground/60">(headings, display)</span>
            </label>
            <div className="rounded-lg border border-border overflow-hidden">
              <select
                value={primaryFont}
                onChange={(e) => { setPrimaryFont(e.target.value); mark(); }}
                className="w-full bg-background px-3 py-2 text-sm focus:outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            {/* Live preview */}
            <div
              className="rounded-lg border border-border bg-muted/20 p-3 text-lg"
              style={{ fontFamily: primaryFont }}
            >
              <span className="text-foreground">உங்கள் பிராண்ட் · Your Brand</span>
            </div>
          </div>

          {/* Secondary font */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">
              Secondary Font <span className="text-[9px] text-muted-foreground/60">(body, subheadings)</span>
            </label>
            <div className="rounded-lg border border-border overflow-hidden">
              <select
                value={secondaryFont}
                onChange={(e) => { setSecondaryFont(e.target.value); mark(); }}
                className="w-full bg-background px-3 py-2 text-sm focus:outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div
              className="rounded-lg border border-border bg-muted/20 p-3 text-sm"
              style={{ fontFamily: secondaryFont }}
            >
              <span className="text-muted-foreground">
                தரமான சேவை, நம்பகமான விலை · Quality service at trusted prices
              </span>
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* Save button */}
      <Button
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="w-full gap-2"
        size="lg"
      >
        {save.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
        ) : (
          <><Save className="h-4 w-4" />Save Brand Kit</>
        )}
      </Button>

      {/* Saved badge */}
      {!isDirty && data?.brandKit && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Saved · {new Date(data.brandKit.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      )}
    </div>
  );
}
