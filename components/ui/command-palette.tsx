'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Palette,
  Image,
  Mic,
  Users,
  FileText,
  CreditCard,
  Settings,
  Search,
  BarChart3,
  FolderOpen,
  Ticket,
  Store,
  BookOpen,
} from 'lucide-react';

type CommandItem = {
  id: string;
  label: string;
  labelTa?: string;
  icon: React.ReactNode;
  href: string;
  category: string;
};

const COMMANDS: CommandItem[] = [
  { id: 'chat', label: 'AI Chat', labelTa: 'AI அரட்டை', icon: <MessageSquare className="h-4 w-4" />, href: '/assistant', category: 'AI' },
  { id: 'image', label: 'Image Studio', labelTa: 'பட ஸ்டூடியோ', icon: <Image className="h-4 w-4" />, href: '/studio/image', category: 'AI' },
  { id: 'voice', label: 'Voice Studio', labelTa: 'குரல் ஸ்டூடியோ', icon: <Mic className="h-4 w-4" />, href: '/studio/voice', category: 'AI' },
  { id: 'studio', label: 'Creative Studio', labelTa: 'படைப்பு ஸ்டூடியோ', icon: <Palette className="h-4 w-4" />, href: '/studio', category: 'Create' },
  { id: 'crm', label: 'CRM Contacts', labelTa: 'தொடர்புகள்', icon: <Users className="h-4 w-4" />, href: '/business/crm', category: 'Business' },
  { id: 'helpdesk', label: 'Helpdesk', labelTa: 'உதவி', icon: <Ticket className="h-4 w-4" />, href: '/business/helpdesk', category: 'Business' },
  { id: 'invoices', label: 'Invoices', labelTa: 'விலைப்பட்டியல்', icon: <FileText className="h-4 w-4" />, href: '/business/invoices', category: 'Business' },
  { id: 'drive', label: 'Drive', labelTa: 'கோப்புகள்', icon: <FolderOpen className="h-4 w-4" />, href: '/platform/drive', category: 'Platform' },
  { id: 'marketplace', label: 'Marketplace', labelTa: 'சந்தை', icon: <Store className="h-4 w-4" />, href: '/platform/marketplace', category: 'Platform' },
  { id: 'analytics', label: 'Analytics', labelTa: 'பகுப்பாய்வு', icon: <BarChart3 className="h-4 w-4" />, href: '/platform/analytics', category: 'Platform' },
  { id: 'knowledge', label: 'Knowledge Base', labelTa: 'அறிவுத்தளம்', icon: <BookOpen className="h-4 w-4" />, href: '/platform/knowledge', category: 'Platform' },
  { id: 'billing', label: 'Billing & Credits', labelTa: 'கிரெடிட்கள்', icon: <CreditCard className="h-4 w-4" />, href: '/billing', category: 'Account' },
  { id: 'settings', label: 'Settings', labelTa: 'அமைப்புகள்', icon: <Settings className="h-4 w-4" />, href: '/settings', category: 'Account' },
];

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function CommandPalette({ open, setOpen }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, setOpen]);

  const filtered = COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.labelTa?.includes(query) ||
      cmd.category.toLowerCase().includes(query.toLowerCase()),
  );

  const grouped = filtered.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    },
    {} as Record<string, CommandItem[]>,
  );

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Dialog */}
      <div className="fixed inset-x-0 top-[20%] z-50 mx-auto w-full max-w-lg animate-scale-in">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands... (English or Tamil)"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2">
            {Object.keys(grouped).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No results found</p>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-2">
                  <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{category}</p>
                  {items.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelect(cmd.href)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                    >
                      <span className="text-muted-foreground">{cmd.icon}</span>
                      <span className="flex-1 text-left">{cmd.label}</span>
                      {cmd.labelTa && <span className="text-[10px] text-muted-foreground">{cmd.labelTa}</span>}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
            <span className="mr-3">↑↓ Navigate</span>
            <span className="mr-3">↵ Select</span>
            <span>⌘K Toggle</span>
          </div>
        </div>
      </div>
    </>
  );
}
