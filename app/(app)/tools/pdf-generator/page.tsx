'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AnimatedCard } from '@/components/ui/animated-card';
import { GradientText } from '@/components/ui/gradient-text';
import { apiFetch, isApiError } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  FileText, Download, Eye, Sparkles, Palette, Type,
  AlignLeft, RefreshCw, Wand2, Settings,
} from 'lucide-react';

const STYLES = [
  { id: 'modern', name: 'Modern', emoji: '🎨', desc: 'Gradient headers, purple accent' },
  { id: 'classic', name: 'Classic', emoji: '📜', desc: 'Traditional serif, formal' },
  { id: 'minimal', name: 'Minimal', emoji: '⬜', desc: 'Clean, minimal whitespace' },
  { id: 'report', name: 'Report', emoji: '📊', desc: 'Business report layout' },
  { id: 'invoice', name: 'Invoice', emoji: '🧾', desc: 'Professional invoice' },
  { id: 'letter', name: 'Letter', emoji: '✉️', desc: 'Formal letter format' },
];

const COLORS = [
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Green', value: '#059669' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Dark', value: '#1e293b' },
  { name: 'Teal', value: '#0d9488' },
];

const TEMPLATES = [
  { name: 'Business Report', prompt: 'Create a professional business report about quarterly sales performance with sections for executive summary, key metrics, analysis, and recommendations.' },
  { name: 'Tamil Proposal', prompt: 'ஒரு தொழில் திட்ட முன்மொழிவை தமிழிலும் ஆங்கிலத்திலும் எழுதுக. Budget, timeline, team members மற்றும் expected outcomes உள்பட.' },
  { name: 'Invoice', prompt: 'Create a professional invoice template with client details, service description, pricing breakdown, tax (GST 18%), and payment terms.' },
  { name: 'Meeting Notes', prompt: 'Format professional meeting notes with agenda, attendees, discussion points, action items with owners and deadlines.' },
  { name: 'Resume/CV', prompt: 'Create a professional resume template for a software engineer with sections for summary, skills, experience, education, and projects.' },
  { name: 'Marketing Plan', prompt: 'Create a comprehensive marketing plan with target audience, channels, budget allocation, timeline, and KPIs for a small business.' },
];

export default function PdfGeneratorPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [style, setStyle] = useState('modern');
  const [primaryColor, setPrimaryColor] = useState('#7c3aed');
  const [fontSize, setFontSize] = useState(12);
  const [author, setAuthor] = useState('');
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const generateAiContent = async (prompt: string) => {
    if (!prompt.trim()) return;
    setIsAiLoading(true);
    const res = await apiFetch<{ content: string }>('/api/pdf/generate/ai-content', {
      method: 'POST',
      body: JSON.stringify({ prompt, style }),
    });
    if (!isApiError(res)) {
      setContent(res.content);
      if (!title) setTitle(prompt.split(' ').slice(0, 5).join(' '));
      toast.success('AI content generated!');
    } else {
      toast.error('AI generation failed');
    }
    setIsAiLoading(false);
  };

  const generatePdf = async () => {
    if (!content.trim()) { toast.error('Add some content first'); return; }
    setIsGenerating(true);
    const res = await apiFetch<{ url: string; html: string }>('/api/pdf/generate', {
      method: 'POST',
      body: JSON.stringify({ title, content, style, primaryColor, fontSize, author, includePageNumbers }),
    });
    if (!isApiError(res)) {
      setPdfUrl(res.url);
      setPreviewHtml(res.html);
      toast.success('PDF generated!');
    } else {
      toast.error('Generation failed');
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold"><GradientText>Text to PDF Generator</GradientText></h1>
          <p className="text-sm text-muted-foreground">உரையை PDF ஆக மாற்றுங்கள் — AI-powered document creation</p>
        </div>
        {pdfUrl && (
          <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
            <Button className="gap-2"><Download className="h-4 w-4" />Download PDF</Button>
          </a>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI Prompt */}
          <AnimatedCard hover={false}>
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">AI Content Generator</p>
            </div>
            <div className="flex gap-2">
              <Input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe your document... (English or Tamil)" onKeyDown={e => e.key === 'Enter' && generateAiContent(aiPrompt)} />
              <Button onClick={() => generateAiContent(aiPrompt)} disabled={isAiLoading} className="shrink-0 gap-2">
                {isAiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate
              </Button>
            </div>
            {/* Quick templates */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {TEMPLATES.map(t => (
                <button key={t.name} onClick={() => { setAiPrompt(t.prompt); generateAiContent(t.prompt); }}
                  className="rounded-full bg-muted px-3 py-1 text-[10px] font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                  {t.name}
                </button>
              ))}
            </div>
          </AnimatedCard>

          {/* Document title */}
          <div className="space-y-1.5">
            <Label className="text-xs">Document Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter document title..." />
          </div>

          {/* Content editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Content (Markdown supported)</Label>
              <span className="text-[10px] text-muted-foreground">{content.length} chars</span>
            </div>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={`# Document Title\n\n## Introduction\nYour content here...\n\n## Section 1\n- Point 1\n- Point 2\n\n**Bold text** and *italic text* supported.\n\nதமிழ் உள்ளடக்கமும் ஆதரிக்கப்படுகிறது.`}
              className="min-h-[400px] font-mono text-sm"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button className="flex-1 gap-2" onClick={generatePdf} disabled={isGenerating || !content.trim()}>
              {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {isGenerating ? 'Generating...' : 'Generate PDF'}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setShowPreview(!showPreview)} disabled={!previewHtml}>
              <Eye className="h-4 w-4" />{showPreview ? 'Hide' : 'Preview'}
            </Button>
          </div>

          {/* HTML Preview */}
          {showPreview && previewHtml && (
            <AnimatedCard hover={false} className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Preview</span>
              </div>
              <iframe srcDoc={previewHtml} className="w-full h-[600px] border-0" title="PDF Preview" />
            </AnimatedCard>
          )}
        </div>

        {/* Right: Settings */}
        <div className="space-y-4">
          {/* Style selector */}
          <AnimatedCard hover={false}>
            <div className="flex items-center gap-2 mb-3"><Palette className="h-4 w-4 text-primary" /><p className="text-sm font-medium">Document Style</p></div>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)}
                  className={cn('rounded-lg border p-2.5 text-left transition-all', style === s.id ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-primary/30')}>
                  <span className="text-lg">{s.emoji}</span>
                  <p className="text-xs font-medium mt-1">{s.name}</p>
                  <p className="text-[9px] text-muted-foreground">{s.desc}</p>
                </button>
              ))}
            </div>
          </AnimatedCard>

          {/* Color picker */}
          <AnimatedCard hover={false}>
            <div className="flex items-center gap-2 mb-3"><Palette className="h-4 w-4 text-primary" /><p className="text-sm font-medium">Primary Color</p></div>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map(c => (
                <button key={c.value} onClick={() => setPrimaryColor(c.value)} title={c.name}
                  className={cn('h-8 rounded-lg border-2 transition-all', primaryColor === c.value ? 'border-foreground scale-110' : 'border-transparent hover:scale-105')}
                  style={{ backgroundColor: c.value }} />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Custom:</span>
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-8 w-12 rounded cursor-pointer border border-border" />
              <span className="text-xs font-mono text-muted-foreground">{primaryColor}</span>
            </div>
          </AnimatedCard>

          {/* Typography */}
          <AnimatedCard hover={false}>
            <div className="flex items-center gap-2 mb-3"><Type className="h-4 w-4 text-primary" /><p className="text-sm font-medium">Typography</p></div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Font Size: {fontSize}pt</Label>
                <input type="range" min={9} max={16} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full mt-1 h-1.5 rounded-full appearance-none bg-muted cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary" />
              </div>
              <div>
                <Label className="text-xs">Author Name</Label>
                <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Your name" className="mt-1 h-8 text-xs" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={includePageNumbers} onChange={e => setIncludePageNumbers(e.target.checked)} className="rounded" />
                <span className="text-xs">Include page numbers</span>
              </label>
            </div>
          </AnimatedCard>

          {/* Markdown guide */}
          <AnimatedCard hover={false} className="bg-muted/30">
            <p className="text-xs font-medium mb-2">Markdown Guide</p>
            <div className="space-y-1 text-[10px] text-muted-foreground font-mono">
              <p># Heading 1</p>
              <p>## Heading 2</p>
              <p>**bold** *italic*</p>
              <p>- bullet point</p>
              <p>1. numbered list</p>
              <p>`inline code`</p>
              <p>&gt; blockquote</p>
              <p>--- (divider)</p>
            </div>
          </AnimatedCard>
        </div>
      </div>
    </div>
  );
}
