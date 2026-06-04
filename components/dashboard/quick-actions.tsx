'use client';

import Link from 'next/link';
import {
  MessageSquare,
  Palette,
  Mic,
  Image,
  FileText,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const actions = [
  {
    label: 'AI Chat',
    description: 'Ask anything in English or Tamil',
    href: '/assistant',
    icon: MessageSquare,
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    label: 'Generate Image',
    description: 'Create AI art & graphics',
    href: '/studio/image',
    icon: Image,
    color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  },
  {
    label: 'Voice Studio',
    description: 'Text-to-speech & cloning',
    href: '/studio/voice',
    icon: Mic,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    label: 'Creative Tools',
    description: 'Banners, posters, cards',
    href: '/studio',
    icon: Palette,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'Documents',
    description: 'PDF tools & templates',
    href: '/tools/compress',
    icon: FileText,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    label: 'AI Magic',
    description: 'Background remove & more',
    href: '/tools/bg-remove',
    icon: Wand2,
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={cn(
            'group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all duration-200',
            'hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5',
          )}
        >
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', action.color)}>
            <action.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium">{action.label}</p>
            <p className="mt-0.5 hidden text-[10px] text-muted-foreground sm:block">
              {action.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
