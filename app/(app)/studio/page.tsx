'use client';

import Link from 'next/link';
import {
  Image,
  Mic,
  FileImage,
  Layers,
  Palette,
  Video,
  Wand2,
  Sparkles,
} from 'lucide-react';
import { GradientText } from '@/components/ui/gradient-text';
import { cn } from '@/lib/utils';

const tools = [
  {
    title: 'Image AI',
    titleTa: 'பட AI',
    description: 'Generate stunning images from text prompts',
    href: '/studio/image',
    icon: Image,
    color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    credits: 3,
  },
  {
    title: 'Voice Studio',
    titleTa: 'குரல் ஸ்டூடியோ',
    description: 'Text-to-speech, voice cloning, Tamil TTS',
    href: '/studio/voice',
    icon: Mic,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    credits: 2,
  },
  {
    title: 'Banner Maker',
    titleTa: 'பேனர் உருவாக்கி',
    description: 'Professional banners for social media',
    href: '/tools/banner',
    icon: FileImage,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    credits: 2,
  },
  {
    title: 'Poster Design',
    titleTa: 'போஸ்டர் வடிவமைப்பு',
    description: 'Event posters, flyers, and prints',
    href: '/tools/poster',
    icon: Layers,
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    credits: 2,
  },
  {
    title: 'Social Cards',
    titleTa: 'சமூக அட்டைகள்',
    description: 'Instagram, Facebook, Twitter cards',
    href: '/tools/social',
    icon: Palette,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    credits: 2,
  },
  {
    title: 'BG Remove',
    titleTa: 'பின்னணி நீக்கு',
    description: 'Remove backgrounds with AI precision',
    href: '/tools/bg-remove',
    icon: Wand2,
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    credits: 1,
  },
  {
    title: 'Design Editor',
    titleTa: 'வடிவமைப்பு திருத்தி',
    description: 'Fabric.js canvas — shapes, text, layers, AI tools',
    href: '/studio/editor',
    icon: Layers,
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    credits: 0,
    isNew: true,
  },
];

export default function StudioPage() {
  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          <GradientText>Creative Studio</GradientText>
        </h1>
        <p className="text-sm text-muted-foreground">
          AI-powered creative tools — உங்கள் வணிகத்திற்கான professional designs உருவாக்குங்கள்
        </p>
      </div>

      {/* Tools grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className={cn(
              'group relative flex flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-all duration-200',
              'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
            )}
          >
            <div className="flex items-center justify-between">
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', tool.color)}>
                <tool.icon className="h-5 w-5" />
              </div>
                <div className="flex items-center gap-1.5">
                {(tool as {isNew?: boolean}).isNew && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">NEW</span>
                )}
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {tool.credits > 0 ? `${tool.credits} credits` : 'Free'}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                {tool.title}
              </h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{tool.titleTa}</p>
              <p className="mt-2 text-xs text-muted-foreground">{tool.description}</p>
            </div>
            <div className="mt-auto flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              <Sparkles className="h-3 w-3" />
              Open tool →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
