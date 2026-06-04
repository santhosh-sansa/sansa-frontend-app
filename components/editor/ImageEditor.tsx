'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GradientText } from '@/components/ui/gradient-text';
import {
  Crop,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Contrast,
  Droplets,
  Palette,
  Type,
  Eraser,
  Download,
  Upload,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Paintbrush,
  Square,
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Loader2,
  ChevronDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────

type Tool = 'select' | 'crop' | 'brush' | 'eraser' | 'text' | 'shape' | 'filter';

interface EditorState {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

const DEFAULT_STATE: EditorState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  blur: 0,
  rotation: 0,
  flipH: false,
  flipV: false,
};

// ─── Filter Presets ───────────────────────────────────────────

const PRESETS = [
  { name: 'Original', state: DEFAULT_STATE },
  { name: 'Vintage',  state: { ...DEFAULT_STATE, saturation: 60,  contrast: 120, hue: 20  } },
  { name: 'Sepia',    state: { ...DEFAULT_STATE, saturation: 30,  hue: 40, brightness: 110 } },
  { name: 'B&W',      state: { ...DEFAULT_STATE, saturation: 0 } },
  { name: 'Vivid',    state: { ...DEFAULT_STATE, saturation: 150, contrast: 120 } },
  { name: 'Cool',     state: { ...DEFAULT_STATE, hue: -20, brightness: 105 } },
  { name: 'Warm',     state: { ...DEFAULT_STATE, hue: 15,  saturation: 120 } },
  { name: 'Dramatic', state: { ...DEFAULT_STATE, contrast: 150, brightness: 90, saturation: 80 } },
];

// ─── AI tool state ────────────────────────────────────────────

type AiTool = 'bg-remove' | 'enhance' | 'upscale' | null;

// ─── Helper: canvas → File (blob) ────────────────────────────

function canvasToFile(canvas: HTMLCanvasElement, name = 'edit.png'): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Canvas export failed'));
      resolve(new File([blob], name, { type: 'image/png' }));
    }, 'image/png');
  });
}

// ─── Helper: URL → HTMLImageElement ──────────────────────────

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
}

// ─── Main Component ───────────────────────────────────────────

export function ImageEditor() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image,        setImage]        = useState<HTMLImageElement | null>(null);
  const [tool,         setTool]         = useState<Tool>('select');
  const [state,        setState]        = useState<EditorState>(DEFAULT_STATE);
  const [history,      setHistory]      = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom,         setZoom]         = useState(1);
  const [brushSize,    setBrushSize]    = useState(5);
  const [brushColor,   setBrushColor]   = useState('#ffffff');
  const [isDrawing,    setIsDrawing]    = useState(false);
  const [textInput,    setTextInput]    = useState('');

  // AI tool state
  const [aiLoading, setAiLoading] = useState<AiTool>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  // ── Load image file ──────────────────────────────────────

  const loadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        setImage(img);
        setState(DEFAULT_STATE);
        setHistory([]);
        setHistoryIndex(-1);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  // ── Render canvas ────────────────────────────────────────

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = image.width;
    canvas.height = image.height;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((state.rotation * Math.PI) / 180);
    ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    ctx.filter = `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%) hue-rotate(${state.hue}deg) blur(${state.blur}px)`;
    ctx.drawImage(image, 0, 0);
    ctx.restore();
  }, [image, state]);

  // ── History ──────────────────────────────────────────────

  const saveHistory = useCallback(() => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL();
    setHistory((h) => {
      const next = [...h.slice(0, historyIndex + 1), dataUrl].slice(-50);
      setHistoryIndex(next.length - 1);
      return next;
    });
  }, [historyIndex]);

  const restoreFromHistory = useCallback((index: number, hist: string[]) => {
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.src = hist[index];
  }, []);

  const undo = () => {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    setHistoryIndex(newIdx);
    restoreFromHistory(newIdx, history);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    setHistoryIndex(newIdx);
    restoreFromHistory(newIdx, history);
  };

  // ── Drawing tools ────────────────────────────────────────

  const startDraw = (e: React.MouseEvent) => {
    if (tool !== 'brush' && tool !== 'eraser') return;
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top)  / zoom;
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? '#ffffff' : brushColor;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.fill();
  };

  const stopDraw = () => {
    if (isDrawing) { setIsDrawing(false); saveHistory(); }
  };

  const addText = (e: React.MouseEvent) => {
    if (tool !== 'text' || !textInput || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.font      = `${brushSize * 4}px Inter, sans-serif`;
    ctx.fillStyle = brushColor;
    ctx.fillText(textInput, (e.clientX - rect.left) / zoom, (e.clientY - rect.top) / zoom);
    saveHistory();
  };

  // ── Export ───────────────────────────────────────────────

  const exportImage = (format: 'png' | 'jpeg' | 'webp') => {
    if (!canvasRef.current) return;
    const link    = document.createElement('a');
    link.download = `sansa-edit-${Date.now()}.${format}`;
    link.href     = canvasRef.current.toDataURL(`image/${format}`, 0.92);
    link.click();
    setExportOpen(false);
  };

  // ── Rotate ───────────────────────────────────────────────

  const rotate = (deg: number) => {
    setState((s) => ({ ...s, rotation: (s.rotation + deg) % 360 }));
    saveHistory();
  };

  // ── AI helper: canvas → FormData → endpoint → new image ─

  const runAiTool = useCallback(async (
    endpoint: string,
    toolName: AiTool,
    label: string,
    queryParams?: string,
  ) => {
    if (!canvasRef.current || !image) {
      toast.error('Upload an image first');
      return;
    }

    setAiLoading(toolName);

    try {
      const file  = await canvasToFile(canvasRef.current);
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('sansa_access_token')
        : null;

      const fd = new FormData();
      fd.append('file', file);

      const url = `${apiBase}${endpoint}${queryParams ? `?${queryParams}` : ''}`;
      const res = await fetch(url, {
        method:  'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body:    fd,
      });

      const data = await res.json() as {
        ok?: boolean;
        url?: string;
        provider?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) throw new Error(data.error || `${label} failed`);

      // Load result back into canvas
      const fullUrl   = data.url?.startsWith('http') ? data.url! : `${apiBase}${data.url}`;
      const resultImg = await loadImg(fullUrl);
      setImage(resultImg);
      setState(DEFAULT_STATE);
      saveHistory();

      const providerBadge = data.provider ? ` (${data.provider})` : '';
      toast.success(`${label} done!${providerBadge}`);

    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${label} failed`);
    } finally {
      setAiLoading(null);
    }
  }, [image, apiBase, saveHistory]);

  // ── Convenience wrappers ─────────────────────────────────

  const removeBg  = () => runAiTool('/api/tools/bg-remove', 'bg-remove', 'Background Removal');
  const enhance   = () => runAiTool('/api/tools/enhance',   'enhance',   'AI Enhance');
  const upscale2x = () => runAiTool('/api/tools/upscale',   'upscale',   'Upscale 2×', 'scale=2');

  const anyAiRunning = aiLoading !== null;

  // ─────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">

      {/* ── Top Toolbar ───────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold"><GradientText>Image Editor</GradientText></h1>
          <span className="text-[10px] text-muted-foreground">பட திருத்தி</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Undo / Redo */}
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={undo} disabled={historyIndex <= 0 || anyAiRunning}
            title="Undo (history)">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={redo} disabled={historyIndex >= history.length - 1 || anyAiRunning}
            title="Redo">
            <Redo2 className="h-4 w-4" />
          </Button>

          <div className="mx-1.5 h-4 w-px bg-border" />

          {/* Zoom */}
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}><ZoomIn  className="h-4 w-4" /></Button>
          <span className="w-10 text-center text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.1))}><ZoomOut className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(1)}
            title="Reset zoom"><Maximize className="h-4 w-4" /></Button>

          <div className="mx-1.5 h-4 w-px bg-border" />

          {/* Export dropdown */}
          <div className="relative">
            <Button size="sm" variant="outline" className="gap-1.5"
              onClick={() => setExportOpen((o) => !o)} disabled={!image}>
              <Download className="h-3.5 w-3.5" />Export
              <ChevronDown className={cn('h-3 w-3 transition-transform', exportOpen && 'rotate-180')} />
            </Button>
            {exportOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 rounded-lg border border-border bg-card shadow-xl p-1 min-w-[120px]">
                {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                  <button key={fmt} onClick={() => exportImage(fmt)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-muted transition-colors uppercase font-medium text-muted-foreground hover:text-foreground">
                    {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Tool Panel ───────────────────────────────────── */}
        <div className="flex w-12 flex-col items-center gap-1 border-r border-border bg-card/30 py-2">
          {([
            { id: 'select', icon: ImageIcon,  label: 'Select'  },
            { id: 'crop',   icon: Crop,        label: 'Crop'    },
            { id: 'brush',  icon: Paintbrush,  label: 'Brush'   },
            { id: 'eraser', icon: Eraser,      label: 'Eraser'  },
            { id: 'text',   icon: Type,        label: 'Text'    },
            { id: 'shape',  icon: Square,      label: 'Shape'   },
            { id: 'filter', icon: Sparkles,    label: 'Filter'  },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                tool === t.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}>
              <t.icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        {/* ── Canvas Area ──────────────────────────────────────── */}
        <div className="relative flex flex-1 items-center justify-center overflow-auto bg-[#1a1a2e] p-4">
          {/* AI loading overlay */}
          {anyAiRunning && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-white">
                {aiLoading === 'bg-remove' && 'Removing background…'}
                {aiLoading === 'enhance'   && 'Enhancing image with AI…'}
                {aiLoading === 'upscale'   && 'Upscaling 2× with Real-ESRGAN…'}
              </p>
              <p className="text-xs text-white/60">This may take a few seconds</p>
            </div>
          )}

          {!image ? (
            <div
              className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-white/20 p-16 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-white/40" />
              <p className="text-sm text-white/60">Click to upload an image</p>
              <p className="text-xs text-white/40">PNG, JPG, WebP · max 25 MB</p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="rounded shadow-2xl"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                cursor: tool === 'brush' || tool === 'eraser' ? 'crosshair'
                      : tool === 'text'                       ? 'text'
                      : 'default',
              }}
              onMouseDown={(e) => { startDraw(e); if (tool === 'text') addText(e); }}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
            />
          )}
        </div>

        {/* ── Right Properties Panel ───────────────────────────── */}
        <div className="w-64 overflow-y-auto border-l border-border bg-card/30 p-4 space-y-5">

          {/* Open image */}
          <div>
            <Button variant="outline" size="sm" className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />Open Image
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && loadImage(e.target.files[0])} />
          </div>

          {/* ── AI Tools ──────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />AI Tools
            </p>

            {/* Remove Background */}
            <button
              onClick={removeBg}
              disabled={!image || anyAiRunning}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all text-left',
                'border-border hover:border-primary/50 hover:bg-primary/5',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                aiLoading === 'bg-remove' && 'border-primary/50 bg-primary/5',
              )}
            >
              {aiLoading === 'bg-remove'
                ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                : <Wand2    className="h-4 w-4 shrink-0 text-primary" />}
              <div>
                <p className="leading-none">Remove Background</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">2 credits · PNG transparent</p>
              </div>
            </button>

            {/* AI Enhance */}
            <button
              onClick={enhance}
              disabled={!image || anyAiRunning}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all text-left',
                'border-border hover:border-primary/50 hover:bg-primary/5',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                aiLoading === 'enhance' && 'border-primary/50 bg-primary/5',
              )}
            >
              {aiLoading === 'enhance'
                ? <Loader2  className="h-4 w-4 shrink-0 animate-spin text-primary" />
                : <Sparkles className="h-4 w-4 shrink-0 text-primary" />}
              <div>
                <p className="leading-none">AI Enhance</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">2 credits · sharpen + vivid</p>
              </div>
            </button>

            {/* Upscale 2× */}
            <button
              onClick={upscale2x}
              disabled={!image || anyAiRunning}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all text-left',
                'border-border hover:border-primary/50 hover:bg-primary/5',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                aiLoading === 'upscale' && 'border-primary/50 bg-primary/5',
              )}
            >
              {aiLoading === 'upscale'
                ? <Loader2   className="h-4 w-4 shrink-0 animate-spin text-primary" />
                : <ImageIcon className="h-4 w-4 shrink-0 text-primary" />}
              <div>
                <p className="leading-none">Upscale 2×</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">3 credits · Real-ESRGAN</p>
              </div>
            </button>
          </div>

          {/* ── Transform ─────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Transform</p>
            <div className="grid grid-cols-4 gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => rotate(-90)}  title="Rotate left" ><RotateCcw      className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => rotate(90)}   title="Rotate right"><RotateCw       className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setState((s) => ({ ...s, flipH: !s.flipH }))} title="Flip H"><FlipHorizontal className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setState((s) => ({ ...s, flipV: !s.flipV }))} title="Flip V"><FlipVertical   className="h-3.5 w-3.5" /></Button>
            </div>
          </div>

          {/* ── Adjustments ───────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Adjustments</p>
            {([
              { key: 'brightness', icon: Sun,      label: 'Brightness', min: 0,    max: 200  },
              { key: 'contrast',   icon: Contrast, label: 'Contrast',   min: 0,    max: 200  },
              { key: 'saturation', icon: Droplets, label: 'Saturation', min: 0,    max: 200  },
              { key: 'hue',        icon: Palette,  label: 'Hue',        min: -180, max: 180  },
              { key: 'blur',       icon: Sparkles, label: 'Blur',       min: 0,    max: 10   },
            ] as const).map((adj) => (
              <div key={adj.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <adj.icon className="h-3 w-3" />{adj.label}
                  </span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{state[adj.key]}</span>
                </div>
                <input type="range" min={adj.min} max={adj.max} value={state[adj.key]}
                  onChange={(e) => setState((s) => ({ ...s, [adj.key]: Number(e.target.value) }))}
                  className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary" />
              </div>
            ))}
          </div>

          {/* ── Brush / Text Settings ─────────────────────────── */}
          {(tool === 'brush' || tool === 'eraser' || tool === 'text') && (
            <div className="space-y-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {tool === 'text' ? 'Text Settings' : 'Brush Settings'}
              </p>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Size: {brushSize}px</span>
                <input type="range" min={1} max={50} value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Color</span>
                <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)}
                  className="h-7 w-7 rounded cursor-pointer border border-input" />
                <span className="text-[10px] font-mono text-muted-foreground">{brushColor}</span>
              </div>
              {tool === 'text' && (
                <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Click canvas to place…"
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
              )}
            </div>
          )}

          {/* ── Filter Presets ────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Presets</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((preset) => (
                <button key={preset.name} onClick={() => setState(preset.state)}
                  className={cn(
                    'rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-colors',
                    'hover:border-primary/50 hover:bg-primary/5',
                    JSON.stringify(state) === JSON.stringify(preset.state)
                      ? 'border-primary/60 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground',
                  )}>
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
