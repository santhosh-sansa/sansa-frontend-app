'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GradientText } from '@/components/ui/gradient-text';
import { AnimatedCard } from '@/components/ui/animated-card';
import {
  Upload,
  Download,
  Eraser,
  ImageIcon,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  Wand2,
  Copy,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────

type BgColor = 'transparent' | 'white' | 'black' | 'custom';

// ─── Before/After comparison slider ──────────────────────────

function CompareSlider({
  before,
  after,
}: {
  before: string;
  after: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // percent
  const dragging = useRef(false);

  const onMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => { if (dragging.current) onMove(e.clientX); };
    const onTouchMove = (e: TouchEvent) => { if (dragging.current) onMove(e.touches[0].clientX); };
    const stop = () => { dragging.current = false; };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', stop);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stop);
    };
  }, [onMove]);

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded-xl cursor-col-resize"
      style={{ aspectRatio: '4/3' }}
      onMouseDown={() => { dragging.current = true; }}
      onTouchStart={() => { dragging.current = true; }}
    >
      {/* After (result) — full width base */}
      <img
        src={after}
        alt="Background removed"
        className="absolute inset-0 h-full w-full object-contain"
        style={{ background: 'repeating-conic-gradient(#cbd5e1 0% 25%, #f1f5f9 0% 50%) 0 0/20px 20px' }}
      />

      {/* Before (original) — clipped to left of slider */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <img
          src={before}
          alt="Original"
          className="absolute inset-0 h-full w-full object-contain bg-card"
          style={{ width: `${10000 / pos}%`, maxWidth: 'none' }}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] z-10"
        style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg">
          <SlidersHorizontal className="h-4 w-4 text-gray-600" />
        </div>
      </div>

      {/* Labels */}
      <span className="absolute bottom-2 left-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
        Before
      </span>
      <span className="absolute bottom-2 right-3 rounded-md bg-primary/80 px-2 py-0.5 text-[10px] font-medium text-white">
        After
      </span>
    </div>
  );
}

// ─── Main BgRemoveTool ────────────────────────────────────────

export function BgRemoveTool() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl,  setOriginalUrl]  = useState<string | null>(null);
  const [resultUrl,    setResultUrl]    = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [provider,     setProvider]     = useState<string | null>(null);
  const [bgColor,      setBgColor]      = useState<BgColor>('transparent');
  const [customColor,  setCustomColor]  = useState('#ffffff');
  const [dragOver,     setDragOver]     = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  // ── Load image ──────────────────────────────────────────────
  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP)');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File too large. Maximum 25 MB.');
      return;
    }
    setOriginalFile(file);
    setOriginalUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setProvider(null);
  };

  // ── Drag & drop ─────────────────────────────────────────────
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  };

  // ── Remove background ────────────────────────────────────────
  const remove = async () => {
    if (!originalFile) return;
    setLoading(true);
    setResultUrl(null);

    try {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('sansa_access_token')
        : null;

      const fd = new FormData();
      fd.append('file', originalFile);

      const res = await fetch(`${apiBase}/api/tools/bg-remove`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      const data = await res.json() as {
        ok?: boolean;
        url?: string;
        provider?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Background removal failed');
      }

      const fullUrl = data.url?.startsWith('http') ? data.url : `${apiBase}${data.url}`;
      setResultUrl(fullUrl ?? null);
      setProvider(data.provider ?? null);
      toast.success('Background removed!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Download with chosen background color ───────────────────
  const download = useCallback(async () => {
    if (!resultUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (bgColor !== 'transparent') {
        ctx.fillStyle = bgColor === 'custom' ? customColor : bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const ext    = bgColor === 'transparent' ? 'png' : 'png';
      const mime   = 'image/png';
      const link   = document.createElement('a');
      link.download = `sansa-bg-removed-${Date.now()}.${ext}`;
      link.href     = canvas.toDataURL(mime, 1);
      link.click();
    };
    img.src = resultUrl;
  }, [resultUrl, bgColor, customColor]);

  // ── Reset ────────────────────────────────────────────────────
  const reset = () => {
    setOriginalFile(null);
    setOriginalUrl(null);
    setResultUrl(null);
    setProvider(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const BG_OPTIONS: { value: BgColor; label: string; preview: string }[] = [
    { value: 'transparent', label: 'Transparent', preview: 'repeating-conic-gradient(#cbd5e1 0% 25%,#f1f5f9 0% 50%) 0 0/12px 12px' },
    { value: 'white',       label: 'White',       preview: '#ffffff' },
    { value: 'black',       label: 'Black',       preview: '#000000' },
    { value: 'custom',      label: 'Custom',      preview: customColor },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Eraser className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-none">
              <GradientText>Background Remover</GradientText>
            </h1>
            <p className="mt-0.5 text-[10px] text-muted-foreground">பின்னணி நீக்கி · 2 credits</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {provider && (
            <span className="text-[10px] rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-500 font-medium">
              {provider}
            </span>
          )}
          {(originalFile || resultUrl) && (
            <Button size="sm" variant="ghost" onClick={reset} className="gap-1.5 h-7 text-xs">
              <RotateCcw className="h-3 w-3" />New Image
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Upload + Controls ───────────────────────────── */}
        <div className="flex w-72 shrink-0 flex-col gap-4 border-r border-border overflow-y-auto p-4">

          {/* Upload zone */}
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer',
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40 hover:bg-muted/30',
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
              dragOver ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
            )}>
              <Upload className="h-5 w-5" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {originalFile ? originalFile.name : 'Upload image'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {originalFile
                  ? `${(originalFile.size / 1024).toFixed(0)} KB · ${originalFile.type}`
                  : 'PNG, JPG, WebP · max 25 MB'}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
            />
          </div>

          {/* Remove button */}
          <Button
            onClick={remove}
            disabled={!originalFile || loading}
            className="w-full gap-2"
            size="lg"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Removing…</>
            ) : (
              <><Wand2 className="h-4 w-4" />Remove Background</>
            )}
          </Button>

          {/* Background color selector (shown after result) */}
          {resultUrl && (
            <div className="space-y-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Download Background
              </p>
              <div className="grid grid-cols-2 gap-2">
                {BG_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBgColor(opt.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition-all',
                      bgColor === opt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    <div
                      className="h-8 w-full rounded-md border border-border"
                      style={{ background: opt.preview }}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Custom color picker */}
              {bgColor === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer border border-border"
                  />
                  <span className="text-xs text-muted-foreground font-mono">{customColor}</span>
                </div>
              )}

              <Button onClick={download} className="w-full gap-2" variant="outline">
                <Download className="h-4 w-4" />
                Download {bgColor === 'transparent' ? 'PNG (transparent)' : `with ${bgColor} bg`}
              </Button>
            </div>
          )}

          {/* Tips */}
          <AnimatedCard hover={false} className="space-y-2 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Best results
            </p>
            {[
              'Clear subject with good contrast',
              'Subject fills most of frame',
              'Good lighting, no harsh shadows',
              'Works best: people, products, logos',
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-1.5">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                <span className="text-[11px] text-muted-foreground">{tip}</span>
              </div>
            ))}
          </AnimatedCard>
        </div>

        {/* ── Right: Preview ────────────────────────────────────── */}
        <div className="flex flex-1 flex-col items-center justify-center p-6 bg-muted/20 overflow-y-auto gap-6">

          {/* Empty state */}
          {!originalUrl && !loading && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
                <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <div>
                <p className="font-semibold text-muted-foreground">No image uploaded</p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  Upload a photo to remove the background instantly
                </p>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="w-full max-w-xl space-y-3">
              <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-muted" />
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Removing background with AI…
              </div>
            </div>
          )}

          {/* Before/After comparison slider */}
          {originalUrl && resultUrl && !loading && (
            <div className="w-full max-w-2xl space-y-3">
              <p className="text-xs text-center text-muted-foreground">
                ← Drag to compare before / after →
              </p>
              <CompareSlider before={originalUrl} after={resultUrl} />
            </div>
          )}

          {/* Original only preview (before removal) */}
          {originalUrl && !resultUrl && !loading && (
            <div className="w-full max-w-xl">
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img
                  src={originalUrl}
                  alt="Original"
                  className="w-full object-contain max-h-[500px] bg-card"
                />
                <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                  Original
                </div>
              </div>
            </div>
          )}

          {/* Result standalone (with chosen bg color) */}
          {resultUrl && !loading && (
            <div className="w-full max-w-xl">
              <AnimatedCard hover={false} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Preview with background</p>
                  <Button
                    size="sm" variant="ghost" className="h-7 gap-1.5 text-xs"
                    onClick={() => { navigator.clipboard.writeText(resultUrl); toast.success('URL copied!'); }}
                  >
                    <Copy className="h-3 w-3" />Copy URL
                  </Button>
                </div>
                <div
                  className="w-full rounded-lg overflow-hidden"
                  style={{
                    background: bgColor === 'transparent'
                      ? 'repeating-conic-gradient(#cbd5e1 0% 25%,#f1f5f9 0% 50%) 0 0/20px 20px'
                      : bgColor === 'custom'
                      ? customColor
                      : bgColor,
                  }}
                >
                  <img
                    src={resultUrl}
                    alt="Background removed"
                    className="w-full max-h-[400px] object-contain"
                  />
                </div>
              </AnimatedCard>
            </div>
          )}
        </div>
      </div>

      {/* Hidden canvas for compositing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
