'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles, Zap, Bot, Image as ImageIcon, ArrowRight,
  Wand2, Mic, Video, FileText, BarChart3, Palette,
  MessageSquare, FolderOpen, Layout, Plus,
  TrendingUp, Users, Clock, Crown,
} from 'lucide-react';
import { apiFetch, isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────
interface UserProfile {
  id: string | number;
  name: string;
  email: string;
  credits: number;
  planId: string;
}

// ─── Quick action tiles ───────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'AI Chat',       labelTa: 'AI அரட்டை',        href: '/assistant',    icon: MessageSquare, grad: 'from-violet-600 to-purple-700',   glow: 'shadow-violet-500/30',  emoji: '💬' },
  { label: 'Image Gen',     labelTa: 'பட உருவாக்கம்',    href: '/studio/image', icon: Wand2,          grad: 'from-pink-600 to-rose-700',        glow: 'shadow-pink-500/30',    emoji: '🎨' },
  { label: 'Voice Studio',  labelTa: 'குரல் ஸ்டூடியோ',   href: '/studio/voice', icon: Mic,            grad: 'from-cyan-600 to-teal-700',        glow: 'shadow-cyan-500/30',    emoji: '🎙️' },
  { label: 'Video Editor',  labelTa: 'வீடியோ திருத்தி',  href: '/studio/video', icon: Video,          grad: 'from-red-600 to-orange-700',       glow: 'shadow-red-500/30',     emoji: '🎬' },
  { label: 'PDF Tools',     labelTa: 'PDF கருவிகள்',     href: '/studio/pdf',   icon: FileText,       grad: 'from-amber-600 to-yellow-700',     glow: 'shadow-amber-500/30',   emoji: '📄' },
  { label: 'Templates',     labelTa: 'வார்ப்புருக்கள்',  href: '/platform/templates', icon: Layout,  grad: 'from-blue-600 to-indigo-700',      glow: 'shadow-blue-500/30',    emoji: '✨' },
  { label: 'Analytics',     labelTa: 'பகுப்பாய்வு',      href: '/platform/analytics', icon: BarChart3, grad: 'from-emerald-600 to-green-700', glow: 'shadow-emerald-500/30', emoji: '📊' },
  { label: 'Drive',         labelTa: 'கோப்பு சேமிப்பு', href: '/platform/drive', icon: FolderOpen,   grad: 'from-sky-600 to-blue-700',         glow: 'shadow-sky-500/30',     emoji: '☁️' },
];

// ─── Feature highlight cards ─────────────────────────────────
const FEATURES = [
  {
    title: 'AI Design Studio',
    titleTa: 'AI வடிவமைப்பு ஸ்டூடியோ',
    desc: 'Create banners, posters & social media content with AI',
    href: '/studio',
    gradient: 'from-violet-900/60 via-purple-900/40 to-pink-900/60',
    border: 'border-violet-500/20',
    badge: '🎨 Creative',
    badgeColor: 'bg-violet-500/20 text-violet-300',
    icon: Palette,
    iconColor: 'text-violet-400',
  },
  {
    title: '500+ Templates',
    titleTa: '500+ வார்ப்புருக்கள்',
    desc: 'Ready-made designs for Tamil businesses — festivals, sales & more',
    href: '/platform/templates',
    gradient: 'from-pink-900/60 via-rose-900/40 to-orange-900/60',
    border: 'border-pink-500/20',
    badge: '✨ Popular',
    badgeColor: 'bg-pink-500/20 text-pink-300',
    icon: Sparkles,
    iconColor: 'text-pink-400',
  },
  {
    title: 'Tamil AI Assistant',
    titleTa: 'தமிழ் AI உதவியாளர்',
    desc: 'Ask anything in Tamil or English — marketing copy, business advice & more',
    href: '/assistant',
    gradient: 'from-cyan-900/60 via-teal-900/40 to-blue-900/60',
    border: 'border-cyan-500/20',
    badge: '🤖 AI Powered',
    badgeColor: 'bg-cyan-500/20 text-cyan-300',
    icon: Bot,
    iconColor: 'text-cyan-400',
  },
];

// ─── Stat card ────────────────────────────────────────────────
function StatTile({
  label, labelTa, value, icon: Icon, grad, glow, change,
}: {
  label: string; labelTa?: string; value: string | number;
  icon: React.ElementType; grad: string; glow: string; change?: string;
}) {
  return (
    <div className={cn(
      'group card-shimmer relative overflow-hidden rounded-2xl border border-white/[0.07] p-5 transition-all duration-300 hover:-translate-y-1',
      `shadow-lg ${glow} hover:shadow-xl`,
    )}>
      {/* Gradient background */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60', grad)} />
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-white/50">{label}</p>
          {labelTa && <p className="text-[9px] text-white/25">{labelTa}</p>}
          <p className="mt-1.5 text-3xl font-black text-white tabular-nums">{value}</p>
          {change && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-white/50">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">{change}</span>
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/10">
          <Icon className="h-5 w-5 text-white/80" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);

  const { data: jobs } = useQuery({
    queryKey: ['jobs-count'],
    queryFn: async () => {
      const r = await apiFetch<{ jobs: unknown[] }>('/api/jobs?limit=50');
      if (isApiError(r)) return [];
      return r.jobs || [];
    },
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    apiFetch<{ user: UserProfile }>('/api/auth/me').then((res) => {
      if (!isApiError(res) && res.user) {
        setUser(res.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sansa_user_id',    String(res.user.id));
          localStorage.setItem('sansa_user_name',  res.user.name);
          localStorage.setItem('sansa_user_email', res.user.email);
        }
      }
    });
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 5  ? 'Good night'    :
    hour < 12 ? 'Good morning'  :
    hour < 17 ? 'Good afternoon':
    hour < 21 ? 'Good evening'  : 'Good night';

  const greetingEmoji =
    hour < 5  ? '🌙' : hour < 12 ? '☀️' : hour < 17 ? '🌤️' : hour < 21 ? '🌅' : '🌙';

  const jobCount = Array.isArray(jobs) ? jobs.length : 0;

  return (
    <div className="min-h-full bg-[#0c0d12] text-white">

      {/* ── Background orbs ──────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="orb-1 absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-600/8 blur-[100px]" />
        <div className="orb-2 absolute -right-40 top-1/4 h-[400px] w-[400px] rounded-full bg-pink-600/6 blur-[80px]" />
        <div className="orb-3 absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-cyan-600/5 blur-[90px]" />
      </div>

      <div className="relative z-10 space-y-8 p-6 lg:p-8">

        {/* ── Hero Banner ────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl">
          {/* Aurora background */}
          <div className="absolute inset-0 aurora-bg opacity-90" />
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/40" />
          {/* Mesh pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }} />
          {/* Sparkles decoration */}
          <div className="absolute right-8 top-6 hidden lg:block">
            <div className="relative h-32 w-32">
              {[0,1,2,3,4,5].map((i) => (
                <div key={i} className="sparkle absolute h-1 w-1 rounded-full bg-white/60"
                  style={{
                    top:  `${[10, 30, 55, 15, 70, 45][i]}%`,
                    left: `${[20, 60, 35, 80, 10, 75][i]}%`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              ))}
              <div className="flex h-full items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 animate-glow-pulse">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-8 lg:p-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{greetingEmoji}</span>
              <p className="text-sm font-medium text-white/70">{greeting}</p>
            </div>
            <h1 className="text-3xl font-black text-white lg:text-4xl">
              {user?.name
                ? <>வணக்கம், <span className="text-yellow-300">{user.name.split(' ')[0]}</span>! 👋</>
                : 'Welcome to SANSA AI 🚀'}
            </h1>
            <p className="mt-2 text-base text-white/60 max-w-xl">
              உங்கள் AI workspace ready — Create stunning designs, automate your business, and grow faster.
            </p>

            {/* CTA buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/assistant">
                <button className="group flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-purple-700 shadow-lg shadow-white/20 transition-all hover:scale-105 hover:shadow-white/30">
                  <Sparkles className="h-4 w-4" />
                  Start Creating
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </Link>
              <Link href="/platform/templates">
                <button className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
                  <Layout className="h-4 w-4" />
                  Browse Templates
                </button>
              </Link>
            </div>

            {/* Plan badge */}
            {user && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur-sm">
                <Crown className="h-3.5 w-3.5 text-yellow-400" />
                <span className="text-xs font-semibold text-white/70 capitalize">
                  {user.planId} Plan
                </span>
                <span className="text-white/30">·</span>
                <span className="text-xs font-bold text-amber-300">{user.credits} credits</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          <StatTile
            label="Credits Balance" labelTa="கிரெடிட் இருப்பு"
            value={user?.credits ?? '—'}
            icon={Zap} change="+100 on signup"
            grad="from-amber-900/80 to-orange-950/80"
            glow="shadow-amber-500/15"
          />
          <StatTile
            label="AI Conversations" labelTa="AI உரையாடல்கள்"
            value="—" icon={MessageSquare} change="↑12% this month"
            grad="from-violet-900/80 to-purple-950/80"
            glow="shadow-violet-500/15"
          />
          <StatTile
            label="Jobs Processed" labelTa="பணிகள் முடிந்தன"
            value={jobCount} icon={Bot}
            grad="from-blue-900/80 to-indigo-950/80"
            glow="shadow-blue-500/15"
          />
          <StatTile
            label="AI Tools" labelTa="AI கருவிகள்"
            value="25+" icon={Sparkles} change="Always growing"
            grad="from-pink-900/80 to-rose-950/80"
            glow="shadow-pink-500/15"
          />
        </div>

        {/* ── Quick Actions ───────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Quick Actions</h2>
              <p className="text-xs text-white/30">விரைவான செயல்கள்</p>
            </div>
            <Link href="/studio" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {QUICK_ACTIONS.map((action, i) => (
              <Link key={action.href} href={action.href}>
                <div
                  className={cn(
                    'group card-shimmer relative flex flex-col items-center gap-2.5 rounded-2xl border border-white/[0.07] p-4 text-center transition-all duration-200',
                    'hover:-translate-y-1 hover:border-white/15 cursor-pointer',
                    `shadow-lg ${action.glow}`,
                  )}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  {/* Icon */}
                  <div className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-110',
                    action.grad,
                  )}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-white/80">{action.label}</p>
                    <p className="text-[9px] text-white/25 mt-0.5">{action.labelTa}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Feature cards ───────────────────────────────────── */}
        <section>
          <div className="mb-4">
            <h2 className="text-base font-bold text-white">Featured Tools</h2>
            <p className="text-xs text-white/30">சிறப்பு கருவிகள்</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Link key={f.href} href={f.href}>
                <div
                  className={cn(
                    'group card-shimmer relative overflow-hidden rounded-2xl border p-6 transition-all duration-300',
                    'hover:-translate-y-1 hover:shadow-xl cursor-pointer',
                    f.border,
                  )}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={cn('absolute inset-0 bg-gradient-to-br', f.gradient)} />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-black/30 ring-1 ring-white/10')}>
                        <f.icon className={cn('h-6 w-6', f.iconColor)} />
                      </div>
                      <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold', f.badgeColor)}>
                        {f.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{f.title}</h3>
                    <p className="text-[11px] text-white/40 mt-0.5">{f.titleTa}</p>
                    <p className="mt-2 text-xs text-white/55 leading-relaxed">{f.desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-white/50 group-hover:text-white/80 transition-colors">
                      Get started <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Recent / Tips row ───────────────────────────────── */}
        <section className="grid gap-6 lg:grid-cols-3">

          {/* Recent activity */}
          <div className="lg:col-span-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-white">Recent Activity</h3>
                <p className="text-[10px] text-white/30">சமீபத்திய செயல்பாடுகள்</p>
              </div>
              <Clock className="h-4 w-4 text-white/20" />
            </div>
            {jobCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08]">
                  <Zap className="h-7 w-7 text-white/15" />
                </div>
                <p className="text-sm text-white/30">No activity yet</p>
                <p className="text-xs text-white/20">உங்கள் AI பணிகள் இங்கே தெரியும்</p>
                <Link href="/studio/image">
                  <button className="mt-1 flex items-center gap-1.5 rounded-xl bg-violet-600/20 px-4 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-600/30 transition-colors">
                    <Plus className="h-3.5 w-3.5" />Try Image Generation
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-white/50">
                <p>{jobCount} jobs processed</p>
              </div>
            )}
          </div>

          {/* Tips card */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">💡 Daily Tip</h3>
              <p className="text-[10px] text-white/30">தினசரி குறிப்பு</p>
            </div>
            <div className="space-y-3">
              {[
                { emoji: '🎨', tip: 'Use Templates to create designs 10× faster', tipTa: 'Template-கள் பயன்படுத்தி வேகமாக design பண்ணுங்கள்' },
                { emoji: '📝', tip: 'Ask the AI in Tamil for best results', tipTa: 'தமிழில் கேட்டால் சிறந்த பதில் கிடைக்கும்' },
                { emoji: '⚡', tip: 'Batch process images to save credits', tipTa: 'Credits சேமிக்க batch processing பண்ணுங்கள்' },
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl bg-white/[0.03] p-3 border border-white/[0.05]">
                  <span className="text-lg shrink-0">{t.emoji}</span>
                  <div>
                    <p className="text-[11px] text-white/60 leading-snug">{t.tip}</p>
                    <p className="text-[9px] text-white/25 mt-0.5">{t.tipTa}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/platform/analytics">
              <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] py-2.5 text-xs font-semibold text-white/50 hover:bg-white/[0.05] hover:text-white/70 transition-all">
                <BarChart3 className="h-3.5 w-3.5" />View Analytics
              </button>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
