'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GradientText } from '@/components/ui/gradient-text';
import { AnimatedCard } from '@/components/ui/animated-card';
import { cn } from '@/lib/utils';
import {
  Search,
  Sparkles,
  Download,
  Heart,
  Grid3X3,
  LayoutGrid,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  FileText,
  Presentation,
  CreditCard as CardIcon,
  Image as ImageIcon,
  Palette,
  Star,
} from 'lucide-react';

// ─── Template Data ────────────────────────────────────────────
type Template = {
  id: string;
  name: string;
  nameTa?: string;
  size: string;
  width: number;
  height: number;
  category: string;
  subcategory: string;
  colors: string[];
  popular?: boolean;
};

const TEMPLATES: Template[] = [
  // Social Media
  { id: 'insta-post-1', name: 'Instagram Post', nameTa: 'இன்ஸ்டாகிராம் போஸ்ட்', size: '1080×1080', width: 1080, height: 1080, category: 'Social Media', subcategory: 'Instagram', colors: ['#E1306C', '#F77737'], popular: true },
  { id: 'insta-story-1', name: 'Instagram Story', nameTa: 'இன்ஸ்டாகிராம் ஸ்டோரி', size: '1080×1920', width: 1080, height: 1920, category: 'Social Media', subcategory: 'Instagram', colors: ['#833AB4', '#FD1D1D'] },
  { id: 'insta-reel-1', name: 'Instagram Reel Cover', size: '1080×1920', width: 1080, height: 1920, category: 'Social Media', subcategory: 'Instagram', colors: ['#405DE6', '#5851DB'] },
  { id: 'fb-cover-1', name: 'Facebook Cover', nameTa: 'பேஸ்புக் கவர்', size: '820×312', width: 820, height: 312, category: 'Social Media', subcategory: 'Facebook', colors: ['#1877F2', '#42B72A'], popular: true },
  { id: 'fb-post-1', name: 'Facebook Post', size: '1200×630', width: 1200, height: 630, category: 'Social Media', subcategory: 'Facebook', colors: ['#1877F2', '#fff'] },
  { id: 'fb-ad-1', name: 'Facebook Ad', size: '1200×628', width: 1200, height: 628, category: 'Social Media', subcategory: 'Facebook', colors: ['#1877F2', '#F7B928'] },
  { id: 'twitter-header-1', name: 'Twitter/X Header', size: '1500×500', width: 1500, height: 500, category: 'Social Media', subcategory: 'Twitter', colors: ['#1DA1F2', '#14171A'] },
  { id: 'twitter-post-1', name: 'Twitter/X Post', size: '1200×675', width: 1200, height: 675, category: 'Social Media', subcategory: 'Twitter', colors: ['#000', '#1DA1F2'] },
  { id: 'linkedin-banner-1', name: 'LinkedIn Banner', size: '1584×396', width: 1584, height: 396, category: 'Social Media', subcategory: 'LinkedIn', colors: ['#0A66C2', '#fff'] },
  { id: 'linkedin-post-1', name: 'LinkedIn Post', size: '1200×627', width: 1200, height: 627, category: 'Social Media', subcategory: 'LinkedIn', colors: ['#0A66C2', '#313335'] },
  { id: 'youtube-thumb-1', name: 'YouTube Thumbnail', nameTa: 'யூடியூப் சிறுபடம்', size: '1280×720', width: 1280, height: 720, category: 'Social Media', subcategory: 'YouTube', colors: ['#FF0000', '#fff'], popular: true },
  { id: 'youtube-banner-1', name: 'YouTube Channel Art', size: '2560×1440', width: 2560, height: 1440, category: 'Social Media', subcategory: 'YouTube', colors: ['#FF0000', '#282828'] },
  { id: 'whatsapp-status-1', name: 'WhatsApp Status', nameTa: 'வாட்ஸ்அப் நிலை', size: '1080×1920', width: 1080, height: 1920, category: 'Social Media', subcategory: 'WhatsApp', colors: ['#25D366', '#fff'] },

  // Marketing
  { id: 'flyer-1', name: 'Event Flyer', nameTa: 'நிகழ்வு துண்டுப்பிரசுரம்', size: 'A4', width: 2480, height: 3508, category: 'Marketing', subcategory: 'Flyers', colors: ['#6C63FF', '#FF6584'], popular: true },
  { id: 'poster-1', name: 'Poster', nameTa: 'போஸ்டர்', size: '18×24"', width: 1800, height: 2400, category: 'Marketing', subcategory: 'Posters', colors: ['#FF6B6B', '#4ECDC4'] },
  { id: 'brochure-1', name: 'Brochure', nameTa: 'சிற்றேடு', size: 'A4 Tri-fold', width: 2480, height: 3508, category: 'Marketing', subcategory: 'Brochures', colors: ['#2C3E50', '#E74C3C'] },
  { id: 'banner-web-1', name: 'Web Banner', size: '728×90', width: 728, height: 90, category: 'Marketing', subcategory: 'Banners', colors: ['#667eea', '#764ba2'] },
  { id: 'banner-large-1', name: 'Large Banner', size: '1200×600', width: 1200, height: 600, category: 'Marketing', subcategory: 'Banners', colors: ['#f093fb', '#f5576c'] },
  { id: 'email-header-1', name: 'Email Header', size: '600×200', width: 600, height: 200, category: 'Marketing', subcategory: 'Email', colors: ['#4facfe', '#00f2fe'] },

  // Business
  { id: 'bcard-1', name: 'Business Card', nameTa: 'வணிக அட்டை', size: '3.5×2"', width: 1050, height: 600, category: 'Business', subcategory: 'Cards', colors: ['#2d3436', '#dfe6e9'], popular: true },
  { id: 'letterhead-1', name: 'Letterhead', size: 'A4', width: 2480, height: 3508, category: 'Business', subcategory: 'Documents', colors: ['#0984e3', '#fff'] },
  { id: 'invoice-1', name: 'Invoice Template', nameTa: 'விலைப்பட்டியல்', size: 'A4', width: 2480, height: 3508, category: 'Business', subcategory: 'Documents', colors: ['#00b894', '#fff'] },
  { id: 'resume-1', name: 'Resume/CV', nameTa: 'சுயவிவரம்', size: 'A4', width: 2480, height: 3508, category: 'Business', subcategory: 'Documents', colors: ['#6c5ce7', '#a29bfe'] },
  { id: 'presentation-1', name: 'Presentation', nameTa: 'விளக்கக்காட்சி', size: '16:9', width: 1920, height: 1080, category: 'Business', subcategory: 'Presentations', colors: ['#fd79a8', '#e84393'] },

  // Print
  { id: 'invitation-1', name: 'Wedding Invitation', nameTa: 'திருமண அழைப்பிதழ்', size: '5×7"', width: 1500, height: 2100, category: 'Print', subcategory: 'Invitations', colors: ['#D4AF37', '#fff'], popular: true },
  { id: 'menu-1', name: 'Restaurant Menu', nameTa: 'உணவு பட்டியல்', size: 'A4', width: 2480, height: 3508, category: 'Print', subcategory: 'Menus', colors: ['#2d3436', '#e17055'] },
  { id: 'certificate-1', name: 'Certificate', nameTa: 'சான்றிதழ்', size: 'A4 Landscape', width: 3508, height: 2480, category: 'Print', subcategory: 'Certificates', colors: ['#0c2461', '#D4AF37'] },
  { id: 'label-1', name: 'Product Label', size: '4×3"', width: 1200, height: 900, category: 'Print', subcategory: 'Labels', colors: ['#00b894', '#55efc4'] },
];

const CATEGORIES = ['All', 'Social Media', 'Marketing', 'Business', 'Print'];
const SUBCATEGORIES: Record<string, string[]> = {
  'Social Media': ['Instagram', 'Facebook', 'Twitter', 'YouTube', 'LinkedIn', 'WhatsApp'],
  'Marketing': ['Flyers', 'Posters', 'Brochures', 'Banners', 'Email'],
  'Business': ['Cards', 'Documents', 'Presentations'],
  'Print': ['Invitations', 'Menus', 'Certificates', 'Labels'],
};

// ─── Component ────────────────────────────────────────────────
export function TemplateEditor() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const filtered = TEMPLATES.filter(t => {
    if (category !== 'All' && t.category !== category) return false;
    if (subcategory && t.subcategory !== subcategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.nameTa?.includes(search) || t.subcategory.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const useTemplate = (template: Template) => {
    setSelectedTemplate(template);
    // In production: open in Image Editor with template dimensions
    window.location.href = `/studio/editor?w=${template.width}&h=${template.height}&name=${encodeURIComponent(template.name)}`;
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold"><GradientText>Templates</GradientText></h1>
          <p className="text-sm text-muted-foreground">வார்ப்புருக்கள் — {TEMPLATES.length}+ professional templates</p>
        </div>
        <Button className="gap-2"><Sparkles className="h-4 w-4" />AI Generate Template</Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates... (English or Tamil)" className="pl-10" />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setSubcategory(null); }}
            className={cn('rounded-full px-4 py-1.5 text-xs font-medium transition-colors', category === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Subcategories */}
      {category !== 'All' && SUBCATEGORIES[category] && (
        <div className="flex flex-wrap gap-1.5">
          {SUBCATEGORIES[category].map(sub => (
            <button
              key={sub}
              onClick={() => setSubcategory(subcategory === sub ? null : sub)}
              className={cn('rounded-md px-3 py-1 text-[10px] font-medium transition-colors', subcategory === sub ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-card border border-border text-muted-foreground hover:text-foreground')}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Popular */}
      {category === 'All' && !search && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-medium">Popular Templates</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.filter(t => t.popular).map(template => (
              <TemplateCard key={template.id} template={template} isFavorite={favorites.has(template.id)} onFavorite={() => toggleFavorite(template.id)} onUse={() => useTemplate(template)} />
            ))}
          </div>
        </div>
      )}

      {/* All templates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">{category === 'All' ? 'All Templates' : category} ({filtered.length})</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map(template => (
            <TemplateCard key={template.id} template={template} isFavorite={favorites.has(template.id)} onFavorite={() => toggleFavorite(template.id)} onUse={() => useTemplate(template)} />
          ))}
        </div>
      </div>

      {/* Custom size */}
      <AnimatedCard hover={false} className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Custom Size</p>
          <p className="text-xs text-muted-foreground">Create a design with custom dimensions</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/studio/editor'}>Create Custom</Button>
      </AnimatedCard>
    </div>
  );
}

// ─── Template Card ────────────────────────────────────────────
function TemplateCard({ template, isFavorite, onFavorite, onUse }: { template: Template; isFavorite: boolean; onFavorite: () => void; onUse: () => void }) {
  return (
    <div className="group relative rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
      {/* Preview */}
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: `linear-gradient(135deg, ${template.colors[0]}, ${template.colors[1] || template.colors[0]}40)` }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white/80">
            <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
            <p className="text-[10px] font-medium">{template.size}</p>
          </div>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" className="gap-1.5" onClick={onUse}><Sparkles className="h-3 w-3" />Use</Button>
        </div>
        {/* Favorite */}
        <button onClick={onFavorite} className="absolute top-2 right-2 rounded-full bg-black/30 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Heart className={cn('h-3.5 w-3.5', isFavorite ? 'fill-red-500 text-red-500' : 'text-white')} />
        </button>
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-medium truncate">{template.name}</p>
        {template.nameTa && <p className="text-[10px] text-muted-foreground truncate">{template.nameTa}</p>}
        <p className="text-[10px] text-muted-foreground mt-0.5">{template.subcategory} • {template.size}</p>
      </div>
    </div>
  );
}
