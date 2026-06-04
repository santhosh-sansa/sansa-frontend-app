'use client';

import {
  useEffect, useRef, useState, useCallback, KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GradientText } from '@/components/ui/gradient-text';
import {
  MousePointer2, Square, Circle, Triangle, Minus, Type, Pen, ImageIcon,
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Download, ChevronDown,
  Trash2, Copy, Layers, Settings2, Eye, EyeOff, Lock, Unlock,
  AlignLeft, AlignCenter, AlignRight, Sparkles, Wand2, Upload,
  LayoutTemplate, ArrowUp, ArrowDown, ChevronRight, Bold, Italic,
  Loader2, Palette, Star, Hexagon, Globe, Search,
} from 'lucide-react';
import {
  FONT_REGISTRY,
  TAMIL_SAMPLES,
  getFontInfo,
  loadFont,
  preloadTamilFonts,
  type FontScript,
} from '@/lib/tamil-fonts';
import { BrandKitPanel, type BrandKit } from '@/components/studio/BrandKitPanel';
import { useCollab } from '@/hooks/use-collab';
import { presenceColor, stateFromFabricObjects } from '@/lib/collab-crdt';
import { CollabCursors } from './CollabCursors';
import { CollabPresenceBar } from './CollabPresenceBar';
import { useSearchParams } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────

type DrawTool =
  | 'select' | 'rect' | 'circle' | 'triangle' | 'line' | 'star'
  | 'text' | 'pen' | 'image';

type RightTab = 'properties' | 'layers' | 'templates' | 'brand';

type AiTool = 'bg-remove' | 'enhance' | 'upscale' | null;

interface LayerItem {
  id: string;
  type: string;
  label: string;
  visible: boolean;
  locked: boolean;
}

interface CanvasPreset {
  label: string;
  labelTa?: string;
  width: number;
  height: number;
}

// ─── Canvas size presets ──────────────────────────────────────

const CANVAS_PRESETS: CanvasPreset[] = [
  { label: 'Instagram Square',   labelTa: 'இன்ஸ்டா சதுரம்',    width: 1080, height: 1080 },
  { label: 'Instagram Story',    labelTa: 'இன்ஸ்டா ஸ்டோரி',    width: 1080, height: 1920 },
  { label: 'Facebook Banner',    labelTa: 'ஃபேஸ்புக் பேனர்',    width: 1200, height: 630  },
  { label: 'YouTube Thumbnail',  labelTa: 'யூடியூப் தம்ப்நெயில்', width: 1280, height: 720  },
  { label: 'Twitter/X Post',     width: 1600, height: 900  },
  { label: 'WhatsApp Status',    labelTa: 'வாட்ஸ்அப் ஸ்டேட்டஸ்', width: 1080, height: 1920 },
  { label: 'A4 Print',           labelTa: 'A4 அச்சு',            width: 794,  height: 1123 },
  { label: 'Business Card',      labelTa: 'விசிட்டிங் கார்டு',   width: 1050, height: 600  },
  { label: 'Custom',             width: 800,  height: 600  },
];

// Font families derived from registry (used as fallback in simple selects)
const FONT_FAMILIES = FONT_REGISTRY.map((f) => f.family);

const COLORS = [
  '#000000','#ffffff','#ef4444','#f97316','#eab308',
  '#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899',
  '#6366f1','#14b8a6','#64748b','#d4a017','#7c3aed',
];

// ─── Helper: canvas obj → LayerItem ──────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
function objToLayer(obj: any): LayerItem {
  const typeMap: Record<string, string> = {
    rect: '▭ Rectangle', circle: '○ Circle', triangle: '△ Triangle',
    line: '— Line', 'i-text': 'T Text', textbox: 'T Text',
    path: '✏ Path', image: '🖼 Image', polygon: '⬡ Polygon',
    group: '⊞ Group',
  };
  return {
    id: obj.__id ?? String(Math.random()),
    type: obj.type ?? 'object',
    label: obj.__label ?? typeMap[obj.type as string] ?? obj.type ?? 'Object',
    visible: obj.visible !== false,
    locked: obj.selectable === false,
  };
}

// ─── FabricEditor ─────────────────────────────────────────────

export function FabricEditor() {
  const canvasElRef   = useRef<HTMLCanvasElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const fabricRef     = useRef<any>(null);   // fabric module
  const canvasRef     = useRef<any>(null);   // fabric.Canvas instance
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const bgFileRef     = useRef<HTMLInputElement>(null);

  // UI state
  const [tool,       setTool]       = useState<DrawTool>('select');
  const [rightTab,   setRightTab]   = useState<RightTab>('properties');
  const [zoom,       setZoom]       = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [aiLoading,  setAiLoading]  = useState<AiTool>(null);

  // Object properties (synced with selected obj)
  const [fillColor,    setFillColor]    = useState('#6366f1');
  const [strokeColor,  setStrokeColor]  = useState('#000000');
  const [strokeWidth,  setStrokeWidth]  = useState(0);
  const [opacity,      setOpacity]      = useState(100);
  const [fontSize,     setFontSize]     = useState(32);
  const [fontFamily,   setFontFamily]   = useState('Inter');
  const [fontBold,     setFontBold]     = useState(false);
  const [fontItalic,   setFontItalic]   = useState(false);
  const [textAlign,    setTextAlign]    = useState<'left'|'center'|'right'>('left');
  const [objX,         setObjX]         = useState(0);
  const [objY,         setObjY]         = useState(0);
  const [objW,         setObjW]         = useState(0);
  const [objH,         setObjH]         = useState(0);
  const [shadowBlur,   setShadowBlur]   = useState(0);
  const [shadowColor,  setShadowColor]  = useState('#000000');

  // Font picker UI state
  const [fontPickerOpen,  setFontPickerOpen]  = useState(false);
  const [fontScriptFilter, setFontScriptFilter] = useState<FontScript | 'all'>('all');
  const [fontSearch,       setFontSearch]       = useState('');
  const [tamilSampleOpen,  setTamilSampleOpen]  = useState(false);

  // History / layers
  const [history,      setHistory]      = useState<string[]>([]);
  const [histIdx,      setHistIdx]      = useState(-1);
  const [layers,       setLayers]       = useState<LayerItem[]>([]);
  const [hasSelected,  setHasSelected]  = useState(false);
  const [isText,       setIsText]       = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  // ── Collab ───────────────────────────────────────────────
  const searchParams = useSearchParams();
  const roomId    = searchParams?.get('room') ?? null;
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);
  const [panOffset, setPanOffset]   = useState({ x: 0, y: 0 });

  // Current user — pulled from localStorage (set at login)
  const currentUserId   = typeof window !== 'undefined' ? (localStorage.getItem('sansa_user_id')   ?? 'anon') : 'anon';
  const currentUserName = typeof window !== 'undefined' ? (localStorage.getItem('sansa_user_name') ?? 'You')  : 'You';
  const currentUserColor = presenceColor(currentUserId);

  // ── Init Fabric on mount ─────────────────────────────────

  useEffect(() => {
    if (!canvasElRef.current) return;

    import('fabric').then((mod) => {
      // @types/fabric exports as { fabric: namespace }
      const fab = (mod as any).fabric ?? mod;
      fabricRef.current = fab;
      const fabric = fab;

      const canvas = new fabric.Canvas(canvasElRef.current!, {
        width:               canvasSize.width,
        height:              canvasSize.height,
        backgroundColor:     '#ffffff',
        preserveObjectStacking: true,
        selection:           true,
      });
      canvasRef.current = canvas;

      // Assign unique IDs to new objects
      canvas.on('object:added', (e: any) => {
        if (!e.target.__id) e.target.__id = `obj-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
        refreshLayers();
        pushHistory();
        // Broadcast add op to collab peers
        if (roomId) {
          const obj = e.target;
          const props = obj.toJSON(['__id', '__label']);
          broadcastOp({ kind: 'upsert', objectId: obj.__id, props });
        }
      });
      canvas.on('object:modified', (e: any) => {
        refreshLayers(); pushHistory();
        // Broadcast update op (only changed transform properties)
        if (roomId && e.target) {
          const obj = e.target;
          broadcastOp({
            kind: 'upsert', objectId: obj.__id,
            props: {
              left: obj.left, top: obj.top,
              scaleX: obj.scaleX, scaleY: obj.scaleY,
              angle: obj.angle, width: obj.width, height: obj.height,
            },
          });
          broadcastSelection(obj.__id, false);
        }
      });
      canvas.on('object:removed', (e: any) => {
        refreshLayers(); pushHistory();
        if (roomId && e.target?.__id) {
          broadcastOp({ kind: 'remove', objectId: e.target.__id });
        }
      });

      // Broadcast cursor position
      canvas.on('mouse:move', (e: any) => {
        if (!roomId) return;
        const pt = canvas.getPointer(e.e);
        broadcastCursor(pt.x, pt.y);
      });

      // Broadcast selection state
      canvas.on('selection:created', (e: any) => {
        syncProps(e);
        if (roomId) broadcastSelection(e.selected?.[0]?.__id ?? null, false);
      });
      canvas.on('selection:updated', (e: any) => {
        syncProps(e);
        if (roomId) broadcastSelection(e.selected?.[0]?.__id ?? null, false);
      });
      canvas.on('object:scaling',  (e: any) => { if (roomId && e.target) broadcastSelection(e.target.__id, true);  });
      canvas.on('object:rotating', (e: any) => { if (roomId && e.target) broadcastSelection(e.target.__id, true);  });
      canvas.on('object:moving',   (e: any) => { if (roomId && e.target) broadcastSelection(e.target.__id, true);  });

      canvas.on('selection:cleared',  () => {
        setHasSelected(false); setIsText(false);
        if (roomId) broadcastSelection(null, false);
      });

      // Push initial blank state
      const blank = JSON.stringify(canvas.toJSON(['__id', '__label']));
      setHistory([blank]);
      setHistIdx(0);

      // Preload Tamil fonts in background
      preloadTamilFonts();

      // Load template from sessionStorage (navigated from /platform/templates)
      const stored = sessionStorage.getItem('sansa_template_load');
      if (stored) {
        try {
          const { payload, canvasWidth: w, canvasHeight: h } = JSON.parse(stored) as {
            payload: object; canvasWidth: number; canvasHeight: number;
          };
          sessionStorage.removeItem('sansa_template_load');
          setCanvasSize({ width: w, height: h });
          canvas.setWidth(w); canvas.setHeight(h);
          canvas.loadFromJSON(payload, () => {
            canvas.renderAll();
            refreshLayers();
            const snap2 = JSON.stringify(canvas.toJSON(['__id', '__label']));
            setHistory([snap2]); setHistIdx(0);
          });
        } catch { /* ignore parse errors */ }
      }
    });

    return () => { canvasRef.current?.dispose(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fit canvas to container ──────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const cw = containerRef.current.clientWidth  - 64;
    const ch = containerRef.current.clientHeight - 64;
    const scaleX = cw / canvasSize.width;
    const scaleY = ch / canvasSize.height;
    const fit    = Math.min(scaleX, scaleY, 1);
    setZoom(parseFloat(fit.toFixed(2)));
    canvas.setZoom(fit);
    canvas.setWidth(canvasSize.width  * fit);
    canvas.setHeight(canvasSize.height * fit);
    canvas.renderAll();
  }, [canvasSize]);

  // ── Zoom ─────────────────────────────────────────────────

  const applyZoom = useCallback((z: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const clamped = Math.max(0.1, Math.min(4, z));
    setZoom(clamped);
    canvas.setZoom(clamped);
    canvas.setWidth(canvasSize.width   * clamped);
    canvas.setHeight(canvasSize.height * clamped);
    canvas.renderAll();
  }, [canvasSize]);

  // ── Sync properties from selected object ─────────────────

  const syncProps = useCallback((e?: any) => {
    const obj = e?.selected?.[0] ?? canvasRef.current?.getActiveObject?.();
    if (!obj) return;
    setHasSelected(true);
    setFillColor((obj.fill   as string) || '#6366f1');
    setStrokeColor((obj.stroke as string) || '#000000');
    setStrokeWidth(obj.strokeWidth ?? 0);
    setOpacity(Math.round((obj.opacity ?? 1) * 100));
    setObjX(Math.round(obj.left ?? 0));
    setObjY(Math.round(obj.top  ?? 0));
    setObjW(Math.round((obj.width  ?? 0) * (obj.scaleX ?? 1)));
    setObjH(Math.round((obj.height ?? 0) * (obj.scaleY ?? 1)));
    const shadow = obj.shadow;
    setShadowBlur( shadow?.blur  ?? 0);
    setShadowColor(shadow?.color ?? '#000000');

    const isTextObj = ['i-text','textbox','text'].includes(obj.type);
    setIsText(isTextObj);
    if (isTextObj) {
      setFontSize(obj.fontSize   ?? 32);
      setFontFamily(obj.fontFamily ?? 'Inter');
      setFontBold(obj.fontWeight === 'bold');
      setFontItalic(obj.fontStyle === 'italic');
      setTextAlign((obj.textAlign as 'left'|'center'|'right') ?? 'left');
    }
  }, []);

  // ── Refresh layer list ───────────────────────────────────

  const refreshLayers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objs = [...canvas.getObjects()].reverse();
    setLayers(objs.map(objToLayer));
  }, []);

  // ── Collab hook ──────────────────────────────────────────

  const {
    peers,
    connected:   collabConnected,
    isHost:      collabIsHost,
    memberCount,
    broadcastOp,
    broadcastCursor,
    broadcastSelection,
  } = useCollab({
    roomId,
    userId:    currentUserId,
    userName:  currentUserName,
    canvasRef,
    fabricRef,
    onRemoteApply: () => refreshLayers(),
  });

  // Update canvas bounding rect when canvas resizes (for cursor overlay)
  useEffect(() => {
    const el = containerRef.current?.querySelector('canvas');
    if (!el) return;
    const obs = new ResizeObserver(() => setCanvasRect(el.getBoundingClientRect()));
    obs.observe(el);
    setCanvasRect(el.getBoundingClientRect());
    return () => obs.disconnect();
  }, []);

  // ── History ──────────────────────────────────────────────

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snap = JSON.stringify(canvas.toJSON(['__id', '__label']));
    setHistory((h) => {
      const next = [...h.slice(0, histIdx + 1), snap].slice(-80);
      setHistIdx(next.length - 1);
      return next;
    });
  }, [histIdx]);

  const undo = useCallback(() => {
    if (histIdx <= 0) return;
    const newIdx = histIdx - 1;
    const canvas = canvasRef.current;
    if (!canvas || !history[newIdx]) return;
    canvas.loadFromJSON(JSON.parse(history[newIdx]), () => {
      canvas.renderAll();
      setHistIdx(newIdx);
      refreshLayers();
    });
  }, [history, histIdx, refreshLayers]);

  const redo = useCallback(() => {
    if (histIdx >= history.length - 1) return;
    const newIdx = histIdx + 1;
    const canvas = canvasRef.current;
    if (!canvas || !history[newIdx]) return;
    canvas.loadFromJSON(JSON.parse(history[newIdx]), () => {
      canvas.renderAll();
      setHistIdx(newIdx);
      refreshLayers();
    });
  }, [history, histIdx, refreshLayers]);

  // ── Keyboard shortcuts ───────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); canvas.discardActiveObject(); canvas.setActiveObject(new (fabricRef.current!.ActiveSelection)(canvas.getObjects(), { canvas })); canvas.renderAll(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); duplicateSelected(); }
      if (e.key === 'Delete' || e.key === 'Backspace') { deleteSelected(); }
      if (e.key === 'v') setTool('select');
      if (e.key === 'r') setTool('rect');
      if (e.key === 'o') setTool('circle');
      if (e.key === 't') setTool('text');
      if (e.key === 'p') setTool('pen');

      // Arrow nudge
      const obj = canvas.getActiveObject();
      if (obj && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const d = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft')  obj.set('left', (obj.left ?? 0) - d);
        if (e.key === 'ArrowRight') obj.set('left', (obj.left ?? 0) + d);
        if (e.key === 'ArrowUp')    obj.set('top',  (obj.top  ?? 0) - d);
        if (e.key === 'ArrowDown')  obj.set('top',  (obj.top  ?? 0) + d);
        obj.setCoords();
        canvas.renderAll();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tool activation ──────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.isDrawingMode = tool === 'pen';
    canvas.selection     = tool === 'select';
    canvas.defaultCursor = tool === 'select' ? 'default' : 'crosshair';
    if (tool === 'pen' && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = fillColor;
      canvas.freeDrawingBrush.width = strokeWidth || 3;
    }
  }, [tool, fillColor, strokeWidth]);

  // ── Add shape on canvas click ────────────────────────────

  const onCanvasClick = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;
    if (tool === 'select' || tool === 'pen') return;

    const rect   = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x      = (e.clientX - rect.left)  / zoom;
    const y      = (e.clientY - rect.top)   / zoom;
    const common = {
      left: x - 60, top: y - 60,
      fill: fillColor, stroke: strokeColor,
      strokeWidth: strokeWidth || 0,
      opacity: opacity / 100,
    };

    let obj: any;
    switch (tool) {
      case 'rect':
        obj = new fabric.Rect({ ...common, width: 120, height: 80, rx: 4, ry: 4 });
        break;
      case 'circle':
        obj = new fabric.Circle({ ...common, radius: 60 });
        break;
      case 'triangle':
        obj = new fabric.Triangle({ ...common, width: 120, height: 100 });
        break;
      case 'line':
        obj = new fabric.Line([x, y, x + 120, y], {
          stroke: fillColor, strokeWidth: strokeWidth || 2,
          opacity: opacity / 100,
        });
        break;
      case 'star':
        obj = new fabric.Polygon(starPoints(60, 30, 5), {
          ...common, left: x - 60, top: y - 60,
        });
        break;
      case 'text': {
        // Ensure font is loaded before Fabric draws Tamil glyphs
        await loadFont(fontFamily);
        const fontInfo = getFontInfo(fontFamily);
        const defaultText = fontInfo?.script === 'tamil'
          ? 'உங்கள் உரை'
          : fontInfo?.script === 'both'
          ? 'உரை / Text'
          : 'Your Text';
        obj = new fabric.IText(defaultText, {
          ...common,
          fill: fillColor,
          fontFamily,
          fontSize,
          fontWeight: fontBold ? 'bold' : 'normal',
          fontStyle:  fontItalic ? 'italic' : 'normal',
          textAlign,
        });
        break;
      }
      case 'image':
        fileInputRef.current?.click();
        return;
      default:
        return;
    }

    if (obj) {
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.renderAll();
    }
    setTool('select');
  }, [tool, fillColor, strokeColor, strokeWidth, opacity, fontFamily, fontSize, fontBold, fontItalic, textAlign, zoom]);

  // ── Apply property changes to selected object ────────────

  const applyProp = useCallback((patch: Record<string, unknown>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;

    // If changing fontFamily, preload the font first
    if (patch.fontFamily && typeof patch.fontFamily === 'string') {
      loadFont(patch.fontFamily).then(() => {
        obj.set(patch);
        obj.setCoords();
        canvas.renderAll();
      });
      return;
    }

    obj.set(patch);
    obj.setCoords();
    canvas.renderAll();
  }, []);

  // ── Object operations ────────────────────────────────────

  const deleteSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    active.forEach((o: any) => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.renderAll();
  }, []);

  const duplicateSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    obj.clone((clone: any) => {
      clone.set({ left: (clone.left ?? 0) + 20, top: (clone.top ?? 0) + 20 });
      canvas.add(clone);
      canvas.setActiveObject(clone);
      canvas.renderAll();
    });
  }, []);

  const bringForward  = () => { canvasRef.current?.bringForward(canvasRef.current.getActiveObject()); canvasRef.current?.renderAll(); };
  const sendBackward  = () => { canvasRef.current?.sendBackwards(canvasRef.current.getActiveObject()); canvasRef.current?.renderAll(); };
  const bringToFront  = () => { canvasRef.current?.bringToFront(canvasRef.current.getActiveObject()); canvasRef.current?.renderAll(); };
  const sendToBack    = () => { canvasRef.current?.sendToBack(canvasRef.current.getActiveObject()); canvasRef.current?.renderAll(); };

  // ── Canvas background color ──────────────────────────────

  const setCanvasBg = (color: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setBackgroundColor(color, () => canvas.renderAll());
  };

  // ── Canvas preset resize ─────────────────────────────────

  const applyPreset = (preset: CanvasPreset) => {
    setCanvasSize({ width: preset.width, height: preset.height });
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.setWidth(preset.width   * zoom);
      canvas.setHeight(preset.height * zoom);
      canvas.renderAll();
    }
    setPresetOpen(false);
    toast.success(`Canvas: ${preset.label} (${preset.width}×${preset.height})`);
  };

  // ── Image upload to canvas ───────────────────────────────

  const addImageToCanvas = (file: File) => {
    const fabric = fabricRef.current;
    const canvas = canvasRef.current;
    if (!fabric || !canvas) return;
    const url = URL.createObjectURL(file);
    fabric.Image.fromURL(url, (img: any) => {
      const scale = Math.min(canvasSize.width / 2 / img.width!, canvasSize.height / 2 / img.height!);
      img.scale(scale);
      img.set({ left: 50, top: 50, __label: `🖼 ${file.name.slice(0, 20)}` });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });
  };

  // ── Set canvas background image ──────────────────────────

  const setBgImage = (file: File) => {
    const fabric = fabricRef.current;
    const canvas = canvasRef.current;
    if (!fabric || !canvas) return;
    const url = URL.createObjectURL(file);
    fabric.Image.fromURL(url, (img: any) => {
      canvas.setBackgroundImage(img, () => {
        img.scaleToWidth(canvasSize.width);
        img.scaleToHeight(canvasSize.height);
        canvas.renderAll();
        pushHistory();
      });
    });
  };

  // ── Export ───────────────────────────────────────────────

  const exportCanvas = (format: 'png' | 'jpeg' | 'svg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (format === 'svg') {
      const svg  = canvas.toSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const link = document.createElement('a');
      link.download = `sansa-design-${Date.now()}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
    } else {
      // Export at full resolution (zoom=1)
      const prevZoom = zoom;
      canvas.setZoom(1);
      canvas.setWidth(canvasSize.width);
      canvas.setHeight(canvasSize.height);
      const dataUrl = canvas.toDataURL({ format, multiplier: 1, quality: 0.95 });
      canvas.setZoom(prevZoom);
      canvas.setWidth(canvasSize.width   * prevZoom);
      canvas.setHeight(canvasSize.height * prevZoom);
      canvas.renderAll();
      const link = document.createElement('a');
      link.download = `sansa-design-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
    }
    setExportOpen(false);
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  // ── AI Tools (canvas → file → API → image back) ──────────

  const runAiOnCanvas = useCallback(async (
    endpoint: string,
    toolName: AiTool,
    label: string,
    query?: string,
  ) => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) { toast.error('Canvas not ready'); return; }

    setAiLoading(toolName);
    try {
      // Export canvas at 1:1 scale
      const prevZoom = zoom;
      canvas.setZoom(1);
      canvas.setWidth(canvasSize.width);
      canvas.setHeight(canvasSize.height);
      const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 1 });
      canvas.setZoom(prevZoom);
      canvas.setWidth(canvasSize.width   * prevZoom);
      canvas.setHeight(canvasSize.height * prevZoom);
      canvas.renderAll();

      // dataURL → Blob → File
      const resp  = await fetch(dataUrl);
      const blob  = await resp.blob();
      const file  = new File([blob], 'canvas.png', { type: 'image/png' });
      const token = localStorage.getItem('sansa_access_token');
      const fd    = new FormData();
      fd.append('file', file);

      const res  = await fetch(`${apiBase}${endpoint}${query ? `?${query}` : ''}`, {
        method:  'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body:    fd,
      });
      const data = await res.json() as { ok?: boolean; url?: string; provider?: string; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || `${label} failed`);

      const fullUrl = (data.url ?? '').startsWith('http') ? data.url! : `${apiBase}${data.url}`;

      // Load result as background image
      fabric.Image.fromURL(fullUrl, (img: any) => {
        img.scaleToWidth(canvasSize.width);
        img.scaleToHeight(canvasSize.height);
        canvas.setBackgroundImage(img, () => {
          canvas.renderAll();
          pushHistory();
        });
      }, { crossOrigin: 'anonymous' });

      toast.success(`${label} done! (${data.provider ?? ''})`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${label} failed`);
    } finally {
      setAiLoading(null);
    }
  }, [zoom, canvasSize, apiBase, pushHistory]);

  // ── Layer visibility / lock ──────────────────────────────

  const toggleLayerVisibility = (id: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects().find((o: any) => o.__id === id);
    if (!obj) return;
    obj.set('visible', !obj.visible);
    canvas.renderAll();
    refreshLayers();
  };

  const toggleLayerLock = (id: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects().find((o: any) => o.__id === id);
    if (!obj) return;
    const locked = obj.selectable !== false;
    obj.set({ selectable: !locked, evented: !locked });
    canvas.renderAll();
    refreshLayers();
  };

  const selectLayerObj = (id: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects().find((o: any) => o.__id === id);
    if (!obj) return;
    canvas.setActiveObject(obj);
    canvas.renderAll();
    syncProps({ selected: [obj] });
  };

  // ── Apply Brand Kit to canvas ────────────────────────────
  // Sets canvas background color, updates all text objects to brand fonts

  const applyBrandToCanvas = useCallback(async (kit: BrandKit) => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;

    // 1. Set canvas background to first brand color
    if (kit.colors?.[0]) {
      canvas.setBackgroundColor(kit.colors[0], () => canvas.renderAll());
    }

    // 2. Preload brand fonts
    await Promise.all([
      loadFont(kit.primaryFont),
      loadFont(kit.secondaryFont),
    ]);

    // 3. Apply primary font to first text object (headline), secondary to rest
    const textObjects = canvas.getObjects().filter((o: any) =>
      ['i-text', 'textbox', 'text'].includes(o.type),
    );

    textObjects.forEach((obj: any, idx: number) => {
      obj.set({
        fontFamily: idx === 0 ? kit.primaryFont : kit.secondaryFont,
        fill: kit.colors?.[3] ?? '#ffffff', // 4th color typically light/dark
      });
    });

    canvas.renderAll();
    pushHistory();
    toast.success(`Brand applied! Colors + fonts from "${kit.brandName || 'Brand Kit'}"`);
  }, [pushHistory]);

  // ── Templates ────────────────────────────────────────────

  const applyTemplate = (tpl: object) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.loadFromJSON(tpl, () => {
      canvas.renderAll();
      refreshLayers();
      pushHistory();
    });
    toast.success('Template applied!');
  };

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  const tools_list: { id: DrawTool; icon: React.ElementType; label: string; shortcut?: string }[] = [
    { id: 'select',   icon: MousePointer2, label: 'Select',    shortcut: 'V' },
    { id: 'rect',     icon: Square,        label: 'Rectangle', shortcut: 'R' },
    { id: 'circle',   icon: Circle,        label: 'Circle',    shortcut: 'O' },
    { id: 'triangle', icon: Triangle,      label: 'Triangle'  },
    { id: 'line',     icon: Minus,         label: 'Line'      },
    { id: 'star',     icon: Star,          label: 'Star'      },
    { id: 'text',     icon: Type,          label: 'Text',      shortcut: 'T' },
    { id: 'pen',      icon: Pen,           label: 'Pen',       shortcut: 'P' },
    { id: 'image',    icon: ImageIcon,     label: 'Image',     shortcut: 'I' },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card/80 px-3 gap-2">

        {/* Left: title + canvas size preset */}
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold whitespace-nowrap">
            <GradientText>Design Editor</GradientText>
          </h1>
          <span className="hidden text-[10px] text-muted-foreground sm:block">வடிவமைப்பு திருத்தி</span>
          <div className="relative">
            <button
              onClick={() => setPresetOpen((o) => !o)}
              className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:border-primary/40 transition-colors"
            >
              <Hexagon className="h-3 w-3" />
              {canvasSize.width}×{canvasSize.height}
              <ChevronDown className={cn('h-3 w-3 transition-transform', presetOpen && 'rotate-180')} />
            </button>
            {presetOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
                {CANVAS_PRESETS.map((p) => (
                  <button key={p.label} onClick={() => applyPreset(p)}
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-muted transition-colors',
                      canvasSize.width === p.width && canvasSize.height === p.height && 'bg-primary/10 text-primary',
                    )}>
                    <span className="font-medium">{p.label}</span>
                    <span className="text-muted-foreground">{p.width}×{p.height}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: undo/redo + zoom */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={histIdx <= 0} title="Undo (Ctrl+Z)"><Undo2 className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={histIdx >= history.length - 1} title="Redo (Ctrl+Y)"><Redo2 className="h-3.5 w-3.5" /></Button>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyZoom(zoom - 0.1)}><ZoomOut className="h-3.5 w-3.5" /></Button>
          <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyZoom(zoom + 0.1)}><ZoomIn className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            const container = containerRef.current;
            if (!container) return;
            const fit = Math.min((container.clientWidth - 64) / canvasSize.width, (container.clientHeight - 64) / canvasSize.height, 1);
            applyZoom(parseFloat(fit.toFixed(2)));
          }} title="Fit to screen"><Maximize2 className="h-3.5 w-3.5" /></Button>
        </div>

        {/* Right: AI + Export */}
        <div className="flex items-center gap-1.5">
          {/* AI Enhance quick buttons */}
          <button
            onClick={() => runAiOnCanvas('/api/tools/bg-remove', 'bg-remove', 'Background Remove')}
            disabled={!!aiLoading}
            title="Remove Background (2 credits)"
            className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-40"
          >
            {aiLoading === 'bg-remove' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
            BG Remove
          </button>
          <button
            onClick={() => runAiOnCanvas('/api/tools/enhance', 'enhance', 'AI Enhance')}
            disabled={!!aiLoading}
            title="AI Enhance (2 credits)"
            className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-40"
          >
            {aiLoading === 'enhance' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Enhance
          </button>
          <button
            onClick={() => runAiOnCanvas('/api/tools/upscale', 'upscale', 'Upscale 2×', 'scale=2')}
            disabled={!!aiLoading}
            title="Upscale 2× (3 credits)"
            className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-40"
          >
            {aiLoading === 'upscale' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
            Upscale
          </button>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Collab presence bar — shown when room param present */}
          {roomId && (
            <CollabPresenceBar
              peers={peers}
              connected={collabConnected}
              memberCount={memberCount}
              isHost={collabIsHost}
              roomId={roomId}
              currentUserName={currentUserName}
              currentUserColor={currentUserColor}
            />
          )}

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Export */}
          <div className="relative">
            <Button size="sm" className="gap-1.5 h-8" onClick={() => setExportOpen((o) => !o)}>
              <Download className="h-3.5 w-3.5" />Export
              <ChevronDown className={cn('h-3 w-3 transition-transform', exportOpen && 'rotate-180')} />
            </Button>
            {exportOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-card shadow-xl overflow-hidden p-1">
                {(['png','jpeg','svg'] as const).map((f) => (
                  <button key={f} onClick={() => exportCanvas(f)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium uppercase text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body: left toolbar + canvas + right panel ─────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Toolbar ──────────────────────────────────────── */}
        <div className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-card/50 py-3 overflow-y-auto">
          {tools_list.map((t) => (
            <button key={t.id} onClick={() => { setTool(t.id); if (t.id === 'image') fileInputRef.current?.click(); }}
              title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ''}`}
              className={cn(
                'group relative flex h-10 w-10 flex-col items-center justify-center rounded-xl transition-all',
                tool === t.id
                  ? 'bg-primary/15 text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}>
              <t.icon className="h-4 w-4" />
              {t.shortcut && (
                <span className="absolute -bottom-0.5 right-0.5 text-[7px] font-bold opacity-40">{t.shortcut}</span>
              )}
            </button>
          ))}

          <div className="my-1 h-px w-8 bg-border" />

          {/* Background image */}
          <button onClick={() => bgFileRef.current?.click()}
            title="Set Background Image"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <LayoutTemplate className="h-4 w-4" />
          </button>

          {/* Active color swatches */}
          <div className="mt-2 flex flex-col items-center gap-1.5">
            <div className="relative">
              <div className="h-7 w-7 rounded-lg border-2 border-white shadow-sm cursor-pointer"
                style={{ background: fillColor }}
                title="Fill color"
                onClick={() => document.getElementById('fill-picker')?.click()} />
              <input id="fill-picker" type="color" value={fillColor}
                onChange={(e) => { setFillColor(e.target.value); applyProp({ fill: e.target.value }); }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </div>
            <div className="relative -mt-2 -mr-2 self-end">
              <div className="h-5 w-5 rounded border-2 border-white shadow-sm cursor-pointer"
                style={{ background: strokeColor }}
                title="Stroke color"
                onClick={() => document.getElementById('stroke-picker')?.click()} />
              <input id="stroke-picker" type="color" value={strokeColor}
                onChange={(e) => { setStrokeColor(e.target.value); applyProp({ stroke: e.target.value }); }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </div>
          </div>
        </div>

        {/* ── Canvas area ───────────────────────────────────────── */}
        <div
          ref={containerRef}
          className="relative flex flex-1 items-center justify-center overflow-auto bg-[#111827]"
          style={{ backgroundImage: 'radial-gradient(#1f2937 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          onClick={onCanvasClick}
        >
          {/* AI loading overlay */}
          {aiLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-base font-semibold text-white">
                {aiLoading === 'bg-remove' && 'Removing background…'}
                {aiLoading === 'enhance'   && 'Enhancing with AI…'}
                {aiLoading === 'upscale'   && 'Upscaling 2× with Real-ESRGAN…'}
              </p>
              <p className="text-sm text-white/60">Processing your design…</p>
            </div>
          )}

          {/* Shadow wrapper */}
          <div className="relative shadow-2xl shadow-black/50">
            <canvas ref={canvasElRef} />

            {/* Collab cursors overlay */}
            {roomId && (
              <CollabCursors
                peers={peers}
                canvasRect={canvasRect}
                zoom={zoom}
                panX={panOffset.x}
                panY={panOffset.y}
              />
            )}
          </div>
        </div>

        {/* ── Right Panel ───────────────────────────────────────── */}
        <div className="flex w-72 shrink-0 flex-col border-l border-border bg-card/50">

          {/* Tab switcher */}
          <div className="flex border-b border-border">
            {([
              { id: 'properties', icon: Settings2,    label: 'Props'     },
              { id: 'layers',     icon: Layers,        label: 'Layers'    },
              { id: 'brand',      icon: Palette,       label: 'Brand'     },
              { id: 'templates',  icon: LayoutTemplate, label: 'Templates' },
            ] as const).map((tab) => (
              <button key={tab.id} onClick={() => setRightTab(tab.id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
                  rightTab === tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}>
                <tab.icon className="h-3.5 w-3.5" />{tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">

            {/* ── Properties Tab ──────────────────────────────── */}
            {rightTab === 'properties' && (
              <>
                {/* Canvas Background */}
                <div className="space-y-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Canvas Background</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['#ffffff','#000000','#f8fafc','#1e293b','#fef3c7','#ecfdf5'].map((c) => (
                      <button key={c} onClick={() => setCanvasBg(c)}
                        className="h-7 w-7 rounded-lg border-2 border-transparent hover:border-primary/50 transition-all"
                        style={{ background: c }} />
                    ))}
                    <div className="relative">
                      <div className="h-7 w-7 rounded-lg border-2 border-dashed border-border cursor-pointer flex items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors"
                        title="Custom color"
                        onClick={() => document.getElementById('canvas-bg-picker')?.click()}>
                        <Palette className="h-3.5 w-3.5" />
                      </div>
                      <input id="canvas-bg-picker" type="color" className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => setCanvasBg(e.target.value)} />
                    </div>
                  </div>
                </div>

                {hasSelected && (
                  <>
                    {/* Fill & Stroke */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Fill & Stroke</p>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Fill</label>
                          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
                            <div className="h-4 w-4 rounded border border-border cursor-pointer"
                              style={{ background: fillColor }}
                              onClick={() => document.getElementById('fill-picker2')?.click()} />
                            <input id="fill-picker2" type="color" value={fillColor}
                              onChange={(e) => { setFillColor(e.target.value); applyProp({ fill: e.target.value }); }}
                              className="hidden" />
                            <span className="text-[10px] font-mono text-muted-foreground">{fillColor}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Stroke</label>
                          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
                            <div className="h-4 w-4 rounded border border-border cursor-pointer"
                              style={{ background: strokeColor }}
                              onClick={() => document.getElementById('stroke-picker2')?.click()} />
                            <input id="stroke-picker2" type="color" value={strokeColor}
                              onChange={(e) => { setStrokeColor(e.target.value); applyProp({ stroke: e.target.value }); }}
                              className="hidden" />
                            <span className="text-[10px] font-mono text-muted-foreground">{strokeColor}</span>
                          </div>
                        </div>
                      </div>

                      {/* Color swatches */}
                      <div className="flex flex-wrap gap-1">
                        {COLORS.map((c) => (
                          <button key={c} onClick={() => { setFillColor(c); applyProp({ fill: c }); }}
                            className="h-5 w-5 rounded border border-transparent hover:border-primary/50 transition-all"
                            style={{ background: c }} />
                        ))}
                      </div>

                      {/* Stroke width */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[10px] text-muted-foreground">Stroke Width</span>
                          <span className="text-[10px] tabular-nums text-muted-foreground">{strokeWidth}px</span>
                        </div>
                        <input type="range" min={0} max={20} value={strokeWidth}
                          onChange={(e) => { setStrokeWidth(+e.target.value); applyProp({ strokeWidth: +e.target.value }); }}
                          className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary" />
                      </div>
                    </div>

                    {/* Opacity & Position */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Position & Size</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'X', val: objX, set: (v: number) => { setObjX(v); applyProp({ left: v }); } },
                          { label: 'Y', val: objY, set: (v: number) => { setObjY(v); applyProp({ top:  v }); } },
                          { label: 'W', val: objW, set: (v: number) => { setObjW(v); } },
                          { label: 'H', val: objH, set: (v: number) => { setObjH(v); } },
                        ].map((f) => (
                          <div key={f.label} className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1">
                            <span className="text-[10px] font-medium text-muted-foreground w-3">{f.label}</span>
                            <input type="number" value={f.val}
                              onChange={(e) => f.set(+e.target.value)}
                              className="w-full bg-transparent text-xs tabular-nums focus:outline-none" />
                          </div>
                        ))}
                      </div>

                      {/* Opacity */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[10px] text-muted-foreground">Opacity</span>
                          <span className="text-[10px] tabular-nums text-muted-foreground">{opacity}%</span>
                        </div>
                        <input type="range" min={0} max={100} value={opacity}
                          onChange={(e) => { setOpacity(+e.target.value); applyProp({ opacity: +e.target.value / 100 }); }}
                          className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary" />
                      </div>
                    </div>

                    {/* Shadow */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Shadow</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[10px] text-muted-foreground">Blur</span>
                          <span className="text-[10px] tabular-nums text-muted-foreground">{shadowBlur}</span>
                        </div>
                        <input type="range" min={0} max={60} value={shadowBlur}
                          onChange={(e) => {
                            setShadowBlur(+e.target.value);
                            applyProp({ shadow: +e.target.value > 0
                              ? new (fabricRef.current!.Shadow)({ blur: +e.target.value, color: shadowColor, offsetX: 4, offsetY: 4 })
                              : null });
                          }}
                          className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary" />
                      </div>
                    </div>

                    {/* Text / Typography */}
                    {isText && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Type className="h-3 w-3" />Typography
                        </p>

                        {/* ── Font Picker ───────────────────────────────── */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-muted-foreground">Font Family</label>

                          {/* Trigger button — shows current font preview */}
                          <button
                            onClick={() => setFontPickerOpen((o) => !o)}
                            className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 hover:border-primary/40 transition-colors"
                          >
                            <span
                              className="text-sm truncate"
                              style={{ fontFamily: fontFamily }}
                            >
                              {getFontInfo(fontFamily)?.script === 'tamil' || getFontInfo(fontFamily)?.script === 'both'
                                ? `${fontFamily} — தமிழ்`
                                : fontFamily}
                            </span>
                            <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform', fontPickerOpen && 'rotate-180')} />
                          </button>

                          {/* Picker dropdown */}
                          {fontPickerOpen && (
                            <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                              {/* Script filter tabs */}
                              <div className="flex border-b border-border">
                                {([
                                  { id: 'all',   label: 'All',    labelTa: 'அனைத்தும்' },
                                  { id: 'tamil', label: 'தமிழ்', labelTa: 'தமிழ்'     },
                                  { id: 'latin', label: 'Latin',  labelTa: 'லத்தீன்'   },
                                  { id: 'both',  label: 'Both',   labelTa: 'இரண்டும்'  },
                                ] as const).map((tab) => (
                                  <button
                                    key={tab.id}
                                    onClick={() => setFontScriptFilter(tab.id)}
                                    className={cn(
                                      'flex-1 py-2 text-[10px] font-medium transition-colors',
                                      fontScriptFilter === tab.id
                                        ? 'bg-primary/10 text-primary border-b-2 border-primary'
                                        : 'text-muted-foreground hover:text-foreground',
                                    )}
                                  >
                                    {tab.label}
                                  </button>
                                ))}
                              </div>

                              {/* Search */}
                              <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
                                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <input
                                  type="text"
                                  placeholder="Search fonts…"
                                  value={fontSearch}
                                  onChange={(e) => setFontSearch(e.target.value)}
                                  className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground/60"
                                />
                              </div>

                              {/* Font list */}
                              <div className="max-h-56 overflow-y-auto">
                                {FONT_REGISTRY
                                  .filter((f) => {
                                    if (fontScriptFilter !== 'all' && f.script !== fontScriptFilter) return false;
                                    if (fontSearch && !f.family.toLowerCase().includes(fontSearch.toLowerCase())) return false;
                                    return true;
                                  })
                                  .map((f) => (
                                    <button
                                      key={f.family}
                                      onClick={async () => {
                                        await loadFont(f.family);
                                        setFontFamily(f.family);
                                        applyProp({ fontFamily: f.family });
                                        setFontPickerOpen(false);
                                        setFontSearch('');
                                      }}
                                      className={cn(
                                        'flex w-full items-center justify-between px-3 py-2.5 hover:bg-muted transition-colors',
                                        fontFamily === f.family && 'bg-primary/10',
                                      )}
                                    >
                                      {/* Font name + script badge */}
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="flex flex-col items-start min-w-0">
                                          <span className="text-[11px] font-medium truncate text-foreground">
                                            {f.label}
                                          </span>
                                          {f.labelTa && (
                                            <span
                                              className="text-[10px] text-muted-foreground leading-tight"
                                              style={{ fontFamily: f.family }}
                                            >
                                              {f.labelTa}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {/* Live preview */}
                                      <span
                                        className="shrink-0 text-sm text-muted-foreground pl-2"
                                        style={{ fontFamily: f.family }}
                                      >
                                        {f.sampleTa ?? f.sample}
                                      </span>
                                    </button>
                                  ))}
                              </div>

                              {/* Tamil samples quick-insert */}
                              <div className="border-t border-border px-3 py-2 space-y-1.5">
                                <button
                                  onClick={() => setTamilSampleOpen((o) => !o)}
                                  className="flex w-full items-center justify-between text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <Globe className="h-3 w-3" />Tamil text samples
                                  </span>
                                  <ChevronDown className={cn('h-3 w-3 transition-transform', tamilSampleOpen && 'rotate-180')} />
                                </button>
                                {tamilSampleOpen && (
                                  <div className="grid grid-cols-2 gap-1">
                                    {TAMIL_SAMPLES.map((s) => (
                                      <button
                                        key={s.label}
                                        onClick={() => {
                                          const canvas = canvasRef.current;
                                          if (!canvas) return;
                                          const obj = canvas.getActiveObject() as any;
                                          if (obj && ['i-text','textbox','text'].includes(obj.type)) {
                                            obj.set('text', s.text);
                                            canvas.renderAll();
                                          }
                                          setTamilSampleOpen(false);
                                          setFontPickerOpen(false);
                                        }}
                                        className="rounded-md border border-border px-1.5 py-1 text-[9px] text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
                                        style={{ fontFamily: fontFamily }}
                                      >
                                        <p className="font-medium text-muted-foreground leading-none">{s.label}</p>
                                        <p className="mt-0.5 text-foreground truncate">{s.text}</p>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Size + Bold/Italic */}
                        <div className="flex items-center gap-2">
                          <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1">
                            <span className="text-[10px] text-muted-foreground">Size</span>
                            <input
                              type="number" value={fontSize} min={8} max={400}
                              onChange={(e) => { setFontSize(+e.target.value); applyProp({ fontSize: +e.target.value }); }}
                              className="w-full bg-transparent text-xs tabular-nums focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => { setFontBold(!fontBold); applyProp({ fontWeight: !fontBold ? 'bold' : 'normal' }); }}
                            className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors',
                              fontBold ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40')}
                            title="Bold"
                          >
                            <Bold className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => { setFontItalic(!fontItalic); applyProp({ fontStyle: !fontItalic ? 'italic' : 'normal' }); }}
                            className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors',
                              fontItalic ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40')}
                            title="Italic"
                          >
                            <Italic className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Script badge for selected font */}
                        {(() => {
                          const info = getFontInfo(fontFamily);
                          if (!info) return null;
                          return (
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium',
                                info.script === 'tamil' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : info.script === 'both' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                : 'bg-muted text-muted-foreground',
                              )}>
                                <Globe className="h-2.5 w-2.5" />
                                {info.script === 'tamil' ? 'Tamil only'
                                  : info.script === 'both' ? 'Tamil + Latin'
                                  : 'Latin only'}
                              </span>
                              <span className="text-[9px] text-muted-foreground">{info.category}</span>
                            </div>
                          );
                        })()}

                        {/* Text alignment */}
                        <div className="flex gap-1">
                          {([
                            { val: 'left',   icon: AlignLeft   },
                            { val: 'center', icon: AlignCenter },
                            { val: 'right',  icon: AlignRight  },
                          ] as const).map(({ val, icon: Icon }) => (
                            <button
                              key={val}
                              onClick={() => { setTextAlign(val); applyProp({ textAlign: val }); }}
                              className={cn('flex flex-1 items-center justify-center rounded-lg border py-1.5 transition-colors',
                                textAlign === val ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40')}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Object actions */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Object</p>
                      <div className="grid grid-cols-4 gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={bringToFront}  title="Bring to Front"><ArrowUp   className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={bringForward}  title="Bring Forward"><ChevronRight className="h-3.5 w-3.5 -rotate-90" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={sendBackward}  title="Send Backward"><ChevronRight className="h-3.5 w-3.5 rotate-90" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={sendToBack}    title="Send to Back"><ArrowDown  className="h-3.5 w-3.5" /></Button>
                      </div>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={duplicateSelected}><Copy className="h-3 w-3" />Duplicate</Button>
                        <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs text-destructive hover:text-destructive" onClick={deleteSelected}><Trash2 className="h-3 w-3" />Delete</Button>
                      </div>
                    </div>
                  </>
                )}

                {!hasSelected && (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-2 text-muted-foreground">
                    <MousePointer2 className="h-8 w-8 opacity-30" />
                    <p className="text-xs">Select an object to edit its properties</p>
                  </div>
                )}
              </>
            )}

            {/* ── Layers Tab ──────────────────────────────────── */}
            {rightTab === 'layers' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Layers ({layers.length})
                  </p>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refreshLayers} title="Refresh">
                    <Upload className="h-3 w-3" />
                  </Button>
                </div>
                {layers.length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No objects yet. Add shapes or text.
                  </div>
                )}
                {layers.map((layer) => (
                  <div key={layer.id}
                    onClick={() => selectLayerObj(layer.id)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/50 transition-colors group">
                    <span className="flex-1 truncate font-medium text-foreground">{layer.label}</span>
                    <button onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all">
                      {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer.id); }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all">
                      {layer.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ── Brand Tab ───────────────────────────────────── */}
            {rightTab === 'brand' && (
              <BrandKitPanel
                compact
                onApplyToCanvas={applyBrandToCanvas}
              />
            )}

            {/* ── Templates Tab ───────────────────────────────── */}
            {rightTab === 'templates' && (
              <div className="space-y-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Starter Templates</p>
                <div className="grid grid-cols-2 gap-2">
                  {STARTER_TEMPLATES.map((tpl) => (
                    <button key={tpl.name} onClick={() => applyTemplate(tpl.json)}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-border p-3 text-xs font-medium hover:border-primary/50 hover:bg-primary/5 transition-colors">
                      <div className="flex h-12 w-full items-center justify-center rounded-lg text-xl"
                        style={{ background: tpl.bg }}>
                        {tpl.emoji}
                      </div>
                      <span>{tpl.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  More templates coming soon — 500+ designs planned
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) addImageToCanvas(f); e.target.value = ''; }} />
      <input ref={bgFileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setBgImage(f); e.target.value = ''; }} />
    </div>
  );
}

// ─── Star polygon helper ──────────────────────────────────────

function starPoints(outerR: number, innerR: number, points: number) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r   = i % 2 === 0 ? outerR : innerR;
    const ang = (i * Math.PI) / points - Math.PI / 2;
    pts.push({ x: r * Math.cos(ang), y: r * Math.sin(ang) });
  }
  return pts;
}

// ─── Starter templates ────────────────────────────────────────

const STARTER_TEMPLATES = [
  {
    name: 'Blank',
    emoji: '📄',
    bg: '#f8fafc',
    json: { version: '5.3.0', objects: [], background: '#ffffff' },
  },
  {
    name: 'Dark Card',
    emoji: '🌙',
    bg: '#1e293b',
    json: {
      version: '5.3.0',
      background: '#0f172a',
      objects: [
        {
          type: 'rect', version: '5.3.0', originX: 'left', originY: 'top',
          left: 40, top: 40, width: 720, height: 520, fill: '#1e293b',
          rx: 20, ry: 20, strokeWidth: 1, stroke: '#334155',
          __id: 'bg-rect', __label: '▭ Card Background',
        },
        {
          type: 'i-text', version: '5.3.0', originX: 'left', originY: 'top',
          left: 80, top: 160, text: 'Your Brand', fontSize: 56,
          fontFamily: 'Inter', fontWeight: 'bold', fill: '#f8fafc',
          __id: 'heading', __label: 'T Heading',
        },
        {
          type: 'i-text', version: '5.3.0', originX: 'left', originY: 'top',
          left: 80, top: 240, text: 'Tagline இங்கே', fontSize: 24,
          fontFamily: 'Inter', fill: '#94a3b8',
          __id: 'sub', __label: 'T Subheading',
        },
      ],
    },
  },
  {
    name: 'Gradient',
    emoji: '🌈',
    bg: 'linear-gradient(135deg,#6366f1,#ec4899)',
    json: {
      version: '5.3.0',
      background: '#6366f1',
      objects: [
        {
          type: 'i-text', version: '5.3.0', originX: 'center', originY: 'center',
          left: 400, top: 280, text: 'SANSA AI', fontSize: 72,
          fontFamily: 'Impact', fill: '#ffffff', textAlign: 'center',
          __id: 'logo', __label: 'T Logo',
        },
        {
          type: 'i-text', version: '5.3.0', originX: 'center', originY: 'center',
          left: 400, top: 370, text: 'AI Workspace · Tamil + English',
          fontSize: 20, fontFamily: 'Inter', fill: 'rgba(255,255,255,0.8)',
          textAlign: 'center', __id: 'sub', __label: 'T Subtitle',
        },
      ],
    },
  },
  {
    name: 'Sale Banner',
    emoji: '🏷️',
    bg: '#fef3c7',
    json: {
      version: '5.3.0',
      background: '#fef9c3',
      objects: [
        {
          type: 'rect', version: '5.3.0', left: 20, top: 20,
          width: 760, height: 560, rx: 16, ry: 16,
          fill: '#ef4444', strokeWidth: 0, __id: 'sale-bg', __label: '▭ Sale BG',
        },
        {
          type: 'i-text', version: '5.3.0', originX: 'center', originY: 'center',
          left: 400, top: 200, text: '50% OFF', fontSize: 96,
          fontFamily: 'Impact', fill: '#ffffff', textAlign: 'center',
          __id: 'sale-text', __label: 'T Sale',
        },
        {
          type: 'i-text', version: '5.3.0', originX: 'center', originY: 'center',
          left: 400, top: 310, text: 'Limited Time Offer', fontSize: 28,
          fontFamily: 'Inter', fill: 'rgba(255,255,255,0.9)', textAlign: 'center',
          __id: 'sub', __label: 'T Subtitle',
        },
      ],
    },
  },
];
