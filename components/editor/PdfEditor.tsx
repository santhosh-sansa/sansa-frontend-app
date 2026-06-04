'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { GradientText } from '@/components/ui/gradient-text';
import { AnimatedCard } from '@/components/ui/animated-card';
import { apiFetch, isApiError } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Upload, FileText, Download, Merge, Scissors, RotateCw, Lock,
  Stamp, MessageSquare, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Sparkles, Type, Highlighter, PenTool, FileSignature, FileOutput,
  Image as ImageIcon, Minimize2, Send, X, Check, Edit3, Eye,
} from 'lucide-react';

type Annotation = { id: string; page: number; type: string; content: string; position: { x: number; y: number }; color?: string };
type ChatMessage = { role: 'user' | 'ai'; content: string; sources?: string[] };
type SignatureType = 'draw' | 'type' | 'upload';

export function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showRequestSig, setShowRequestSig] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [signatureText, setSignatureText] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestName, setRequestName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sigType, setSigType] = useState<SignatureType>('type');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleUpload = async (f: File) => {
    setFile(f);
    setPdfUrl(URL.createObjectURL(f));
    toast.success(`Loaded: ${f.name}`);
    // Upload to backend
    setIsLoading(true);
    const res = await apiFetch<{ document: { id: string } }>('/api/pdf/upload', {
      method: 'POST', body: JSON.stringify({ filename: f.name, contentType: f.type }),
    });
    if (!isApiError(res)) { setDocId(res.document.id); toast.success('Saved to cloud'); }
    setIsLoading(false);
  };

  const addAnnotation = async (type: string, content: string = '') => {
    if (!docId) { toast.error('Upload a PDF first'); return; }
    const ann: Annotation = { id: `ann-${Date.now()}`, page: currentPage, type, content: content || `${type} annotation`, position: { x: 200, y: 300 }, color: type === 'highlight' ? '#fde047' : type === 'underline' ? '#3b82f6' : '#ef4444' };
    setAnnotations(prev => [...prev, ann]);
    await apiFetch(`/api/pdf/${docId}/annotate`, { method: 'POST', body: JSON.stringify({ type, content: ann.content, page: currentPage, position: ann.position, color: ann.color }) });
    toast.success(`${type} added`);
  };

  const handleSign = async () => {
    if (!docId) { toast.error('Upload a PDF first'); return; }
    let sigData = '';
    if (sigType === 'type') sigData = `data:text/plain;base64,${btoa(signatureText)}`;
    else if (sigType === 'draw' && sigCanvasRef.current) sigData = sigCanvasRef.current.toDataURL();
    const res = await apiFetch(`/api/pdf/${docId}/sign`, { method: 'POST', body: JSON.stringify({ signatureData: sigData, signatureType: sigType, page: currentPage, position: { x: 400, y: 600 } }) });
    if (!isApiError(res)) { toast.success('Signature applied'); setShowSignModal(false); }
  };

  const handleRequestSignature = async () => {
    if (!docId || !requestEmail) return;
    const res = await apiFetch(`/api/pdf/${docId}/request-signature`, { method: 'POST', body: JSON.stringify({ signerEmail: requestEmail, signerName: requestName }) });
    if (!isApiError(res)) { toast.success(`Signature request sent to ${requestEmail}`); setShowRequestSig(false); }
  };

  const handleConvert = async (format: string) => {
    if (!docId) { toast.error('Upload a PDF first'); return; }
    toast.info(`Converting to ${format}...`);
    const res = await apiFetch<{ outputUrl: string }>('/api/pdf/convert', { method: 'POST', body: JSON.stringify({ documentId: docId, targetFormat: format }) });
    if (!isApiError(res) && res.outputUrl) window.open(res.outputUrl, '_blank');
    setShowConvert(false);
  };

  const handleOCR = async () => {
    if (!docId) { toast.error('Upload a PDF first'); return; }
    toast.info('Running OCR...');
    const res = await apiFetch<{ text: string; wordCount: number }>('/api/pdf/ocr', { method: 'POST', body: JSON.stringify({ documentId: docId }) });
    if (!isApiError(res)) { setChatMessages(prev => [...prev, { role: 'ai', content: `OCR Result (${res.wordCount} words):\n${res.text.slice(0, 500)}...` }]); setShowComments(true); }
  };

  const handleCompress = async () => {
    if (!docId) return;
    const res = await apiFetch<{ savedPercent: number }>('/api/pdf/compress', { method: 'POST', body: JSON.stringify({ documentId: docId }) });
    if (!isApiError(res)) toast.success(`Compressed! Saved ${res.savedPercent}%`);
  };

  const chatWithPdf = async () => {
    if (!chatInput.trim() || !docId) return;
    const q = chatInput; setChatInput(''); setIsLoading(true);
    setChatMessages(prev => [...prev, { role: 'user', content: q }]);
    const res = await apiFetch<{ answer: string; sources?: string[] }>(`/api/pdf/${docId}/chat`, { method: 'POST', body: JSON.stringify({ question: q }) });
    const answer = !isApiError(res) ? res.answer : 'Error processing question.';
    const sources = !isApiError(res) ? res.sources : [];
    setChatMessages(prev => [...prev, { role: 'ai', content: answer, sources }]);
    setIsLoading(false);
  };

  // Signature canvas drawing
  const startDraw = (e: React.MouseEvent) => {
    if (!sigCanvasRef.current) return;
    setIsDrawing(true);
    const ctx = sigCanvasRef.current.getContext('2d');
    if (ctx) { const r = sigCanvasRef.current.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top); }
  };
  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !sigCanvasRef.current) return;
    const ctx = sigCanvasRef.current.getContext('2d');
    if (ctx) { const r = sigCanvasRef.current.getBoundingClientRect(); ctx.lineTo(e.clientX - r.left, e.clientY - r.top); ctx.stroke(); }
  };
  const stopDraw = () => setIsDrawing(false);

  const TOOLS = [
    { id: 'select', icon: Eye, label: 'Select' },
    { id: 'highlight', icon: Highlighter, label: 'Highlight' },
    { id: 'underline', icon: Type, label: 'Underline' },
    { id: 'comment', icon: MessageSquare, label: 'Comment' },
    { id: 'draw', icon: PenTool, label: 'Draw' },
    { id: 'text', icon: Edit3, label: 'Add Text' },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* ── Top Toolbar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-3 py-2 gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <FileText className="h-4 w-4 text-primary mr-1" />
          <h1 className="text-sm font-bold hidden sm:block"><GradientText>PDF Studio</GradientText></h1>
        </div>

        {/* Annotation tools */}
        <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => { setActiveTool(t.id); if (t.id !== 'select') addAnnotation(t.id); }}
              className={cn('flex items-center gap-1 rounded-md px-2 py-1.5 text-xs transition-colors', activeTool === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
              title={t.label}>
              <t.icon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setShowSignModal(true)}><FileSignature className="h-3.5 w-3.5" />Sign</Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setShowRequestSig(true)}><Send className="h-3.5 w-3.5" />Request</Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setShowConvert(true)}><FileOutput className="h-3.5 w-3.5" />Convert</Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={handleOCR}><Sparkles className="h-3.5 w-3.5" />OCR</Button>
          <Button size="sm" variant="ghost" className="h-8 w-8" onClick={() => setShowComments(!showComments)}><MessageSquare className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar ─────────────────────────────────────── */}
        <div className="w-48 shrink-0 border-r border-border bg-card/30 p-2 space-y-1 overflow-y-auto hidden md:flex flex-col">
          <Button variant="outline" size="sm" className="w-full gap-2 justify-start text-xs" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" />Open PDF
          </Button>
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />

          <div className="pt-2 border-t border-border space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">Organize</p>
            <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-xs" onClick={() => mergeInputRef.current?.click()}><Merge className="h-3.5 w-3.5" />Merge PDFs</Button>
            <input ref={mergeInputRef} type="file" accept=".pdf" multiple className="hidden" />
            <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-xs"><Scissors className="h-3.5 w-3.5" />Split PDF</Button>
            <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-xs" onClick={handleCompress}><Minimize2 className="h-3.5 w-3.5" />Compress</Button>
            <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-xs"><RotateCw className="h-3.5 w-3.5" />Rotate</Button>
          </div>

          <div className="pt-2 border-t border-border space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">Security</p>
            <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-xs"><Lock className="h-3.5 w-3.5" />Protect</Button>
            <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-xs"><Stamp className="h-3.5 w-3.5" />Watermark</Button>
          </div>

          <div className="pt-2 border-t border-border space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">AI Tools</p>
            <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-xs" onClick={handleOCR}><Sparkles className="h-3.5 w-3.5" />OCR Extract</Button>
            <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-xs" onClick={() => setShowComments(true)}><MessageSquare className="h-3.5 w-3.5" />Chat with PDF</Button>
          </div>
        </div>

        {/* ── PDF Viewer ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Zoom + Page controls */}
          <div className="flex items-center justify-center gap-2 border-b border-border bg-card/50 px-3 py-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(z - 25, 50))}><ZoomOut className="h-3.5 w-3.5" /></Button>
            <span className="text-xs text-muted-foreground w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(z + 25, 200))}><ZoomIn className="h-3.5 w-3.5" /></Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <span className="text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}><ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>

          {/* PDF render area */}
          <div className="flex-1 overflow-auto bg-[#404040] flex items-start justify-center p-6">
            {!pdfUrl ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-white/20 p-16 cursor-pointer hover:border-primary/50 transition-colors mt-8" onClick={() => fileInputRef.current?.click()}>
                <FileText className="h-12 w-12 text-white/40" />
                <p className="text-sm text-white/60">Click to upload a PDF</p>
                <p className="text-xs text-white/40">Supports PDF, DOC, DOCX</p>
              </div>
            ) : (
              <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
                <iframe src={`${pdfUrl}#page=${currentPage}`} className="bg-white rounded shadow-2xl" style={{ width: '794px', height: '1123px' }} title="PDF" onLoad={e => { const el = e.target as HTMLIFrameElement; setTotalPages(10); }} />
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel: Chat ────────────────────────────────── */}
        {showComments && (
          <div className="w-72 shrink-0 border-l border-border bg-card/30 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <p className="text-xs font-semibold">AI Chat & Comments</p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowComments(false)}><X className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {annotations.filter(a => a.type === 'comment').map(a => (
                <div key={a.id} className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-xs">
                  <p className="font-medium text-amber-600">Comment • Page {a.page}</p>
                  <p className="mt-0.5 text-muted-foreground">{a.content}</p>
                </div>
              ))}
              {chatMessages.map((m, i) => (
                <div key={i} className={cn('rounded-lg px-3 py-2 text-xs', m.role === 'user' ? 'bg-primary text-primary-foreground ml-4' : 'bg-muted mr-4')}>
                  {m.content}
                  {m.sources?.length ? <p className="mt-1 text-[10px] opacity-60">Sources: {m.sources.join(', ')}</p> : null}
                </div>
              ))}
              {isLoading && <div className="bg-muted rounded-lg px-3 py-2 text-xs mr-4 animate-pulse">Thinking...</div>}
              {chatMessages.length === 0 && annotations.filter(a => a.type === 'comment').length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">Upload a PDF and ask questions about it</p>
              )}
            </div>
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && chatWithPdf()}
                  placeholder="Ask about this PDF..." className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none" disabled={!file} />
                <Button size="icon" className="h-7 w-7 shrink-0" onClick={chatWithPdf} disabled={!file || isLoading}><Send className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Sign Modal ───────────────────────────────────────── */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <AnimatedCard hover={false} className="w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Add Signature</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSignModal(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="flex gap-2 mb-4">
              {(['type', 'draw', 'upload'] as SignatureType[]).map(t => (
                <button key={t} onClick={() => setSigType(t)}
                  className={cn('rounded-md px-3 py-1.5 text-xs capitalize font-medium', sigType === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                  {t}
                </button>
              ))}
            </div>
            {sigType === 'type' && (
              <input value={signatureText} onChange={e => setSignatureText(e.target.value)} placeholder="Type your signature"
                className="w-full border border-input rounded-md px-3 py-2 text-xl font-signature italic mb-4 outline-none" />
            )}
            {sigType === 'draw' && (
              <canvas ref={sigCanvasRef} width={400} height={150}
                className="w-full border border-input rounded-md bg-white cursor-crosshair mb-4"
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} />
            )}
            {sigType === 'upload' && (
              <div className="rounded-lg border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground mb-4">
                Click to upload signature image
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowSignModal(false)}>Cancel</Button>
              <Button size="sm" className="gap-2" onClick={handleSign}><Check className="h-3.5 w-3.5" />Apply Signature</Button>
            </div>
          </AnimatedCard>
        </div>
      )}

      {/* ── Request Signature Modal ──────────────────────────── */}
      {showRequestSig && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <AnimatedCard hover={false} className="w-full max-w-sm animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Request Signature</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowRequestSig(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3">
              <input value={requestName} onChange={e => setRequestName(e.target.value)} placeholder="Signer's name" className="w-full border border-input rounded-md px-3 py-2 text-sm outline-none" />
              <input value={requestEmail} onChange={e => setRequestEmail(e.target.value)} placeholder="Signer's email" type="email" className="w-full border border-input rounded-md px-3 py-2 text-sm outline-none" />
              <Button className="w-full gap-2" onClick={handleRequestSignature} disabled={!requestEmail}><Send className="h-4 w-4" />Send Request</Button>
            </div>
          </AnimatedCard>
        </div>
      )}

      {/* ── Convert Modal ────────────────────────────────────── */}
      {showConvert && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <AnimatedCard hover={false} className="w-full max-w-xs animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Convert PDF</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowConvert(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['docx', 'xlsx', 'pptx', 'html', 'png', 'jpg'].map(fmt => (
                <Button key={fmt} variant="outline" size="sm" className="gap-2 uppercase" onClick={() => handleConvert(fmt)}>
                  <FileOutput className="h-3.5 w-3.5" />{fmt}
                </Button>
              ))}
            </div>
          </AnimatedCard>
        </div>
      )}
    </div>
  );
}
