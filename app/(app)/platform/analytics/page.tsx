'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, isApiError } from '@/lib/api';
import { GradientText } from '@/components/ui/gradient-text';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Zap, Palette, Calendar, Crown,
  Coins, Activity, BarChart2, Clock, Sparkles,
  Image as ImageIcon, Mic, Video, FileText, Wand2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────

interface OverviewData {
  user:  { name: string; email: string; planId: string; credits: number; memberSince: string };
  stats: {
    designs:      { total: number; thisMonth: number };
    credits:      { balance: number; spentTotal: number; spentMonth: number };
    jobs:         { total: number; thisMonth: number; byType: Array<{ type: string; count: number }> };
    creditsByApp: Array<{ app: string; spent: number }>;
    activeDays:   number;
  };
}

interface ActivityItem {
  kind:    'credit' | 'job';
  id:      string | number;
  delta?:  number;
  reason?: string;
  app?:    string;
  type?:   string;
  status?: string;
  at:      string;
}

// ─── Constants ────────────────────────────────────────────────

const JOB_META: Record<string, { label: string }> = {
  'image-gen':    { label: 'Image Gen'       },
  'bg-remove':    { label: 'BG Remove'       },
  'enhance':      { label: 'AI Enhance'      },
  'upscale':      { label: 'Upscale'         },
  'tts':          { label: 'Voice / TTS'     },
  'video-gen':    { label: 'Video Gen'       },
  'pdf-generate': { label: 'PDF Generate'    },
  'translation':  { label: 'Tamil Translate' },
};

const CHART_COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#f97316','#06b6d4'];

// ─── Helpers ──────────────────────────────────────────────────

function fmtDay(day: string) {
  return new Date(day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function activityLabel(item: ActivityItem): string {
  if (item.kind === 'credit') {
    const sign = (item.delta ?? 0) > 0 ? '+' : '';
    return `${sign}${item.delta} credits — ${item.reason ?? item.app ?? 'system'}`;
  }
  return `${JOB_META[item.type ?? '']?.label ?? item.type} — ${item.status}`;
}

// ─── Sub-components ───────────────────────────────────────────

function StatCard({
  icon: Icon, label, labelTa, value, sub, colorClass,
}: {
  icon: React.ElementType; label: string; labelTa?: string;
  value: string | number; sub?: string; colorClass: string;
}) {
  return (
    <AnimatedCard hover className="flex items-start gap-4">
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', colorClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-muted-foreground">
          {label}{labelTa && <span className="ml-1 opacity-60">· {labelTa}</span>}
        </p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </AnimatedCard>
  );
}

function ChartTip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-xl text-xs space-y-1">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function RangePicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden text-xs">
      {[7, 30, 90].map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={cn(
            'px-3 py-1.5 font-medium transition-colors',
            value === d ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {d}d
        </button>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange] = useState(30);

  const { data: ov, isLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const r = await apiFetch<{ ok: boolean } & OverviewData>('/api/analytics/overview');
      if (isApiError(r)) throw new Error(r.error);
      return r;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: credits } = useQuery({
    queryKey: ['analytics-credits', range],
    queryFn: async () => {
      const r = await apiFetch<{ series: Array<{ day: string; spent: number; earned: number }> }>(
        `/api/analytics/credits?days=${range}`,
      );
      if (isApiError(r)) return [];
      return r.series.map((s) => ({ ...s, day: fmtDay(s.day) }));
    },
    staleTime: 1000 * 60 * 3,
  });

  const { data: activity } = useQuery({
    queryKey: ['analytics-activity', range],
    queryFn: async () => {
      const r = await apiFetch<{ series: Array<{ day: string; designs: number; jobs: number }> }>(
        `/api/analytics/activity?days=${range}`,
      );
      if (isApiError(r)) return [];
      return r.series.map((s) => ({ ...s, day: fmtDay(s.day) }));
    },
    staleTime: 1000 * 60 * 3,
  });

  const { data: feed } = useQuery({
    queryKey: ['analytics-feed'],
    queryFn: async () => {
      const r = await apiFetch<{ activity: ActivityItem[] }>('/api/analytics/feed');
      if (isApiError(r)) return [];
      return r.activity;
    },
    staleTime: 1000 * 60 * 2,
  });

  const s = ov?.stats;
  const tickGap = range <= 7 ? 0 : range <= 30 ? 4 : 14;

  const creditPct = s
    ? Math.min(100, Math.round((s.credits.balance / Math.max(s.credits.balance + s.credits.spentTotal, 1)) * 100))
    : 0;

  const memberSince = ov?.user.memberSince
    ? new Date(ov.user.memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="space-y-6 p-6 lg:p-8">

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold"><GradientText>Analytics</GradientText></h1>
          <p className="text-sm text-muted-foreground">
            பகுப்பாய்வு
            {ov?.user.name ? ` — வணக்கம் ${ov.user.name.split(' ')[0]}!` : ' — Your usage insights'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {ov && (
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              {ov.user.planId === 'pro' ? '⭐ Pro' : '🆓 Free'} · Member since {memberSince}
            </div>
          )}
          <RangePicker value={range} onChange={setRange} />
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Coins}    label="Credits Balance"  labelTa="கிரெடிட் இருப்பு"    value={s?.credits.balance.toLocaleString() ?? '—'}   sub={`${s?.credits.spentMonth ?? 0} spent this month`}    colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
          <StatCard icon={Palette}  label="Designs Created"  labelTa="வடிவமைப்புகள்"        value={s?.designs.total.toLocaleString() ?? '—'}     sub={`${s?.designs.thisMonth ?? 0} this month`}           colorClass="bg-primary/10 text-primary" />
          <StatCard icon={Zap}      label="AI Jobs Run"      labelTa="AI பணிகள்"             value={s?.jobs.total.toLocaleString() ?? '—'}         sub={`${s?.jobs.thisMonth ?? 0} this month`}              colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400" />
          <StatCard icon={Calendar} label="Active Days"      labelTa="செயலில் உள்ள நாட்கள்" value={s?.activeDays ?? '—'}                          sub={`${s?.credits.spentTotal ?? 0} total credits used`}  colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
        </div>
      )}

      {/* ── Charts row 1 ───────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Credits area chart */}
        <AnimatedCard hover={false} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Credits Usage</h3>
              <p className="text-[11px] text-muted-foreground">கிரெடிட் பயன்பாடு · {range}d</p>
            </div>
            <Coins className="h-4 w-4 text-amber-500" />
          </div>
          {!credits ? <Skeleton className="h-52 rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={credits} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                <defs>
                  <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={tickGap} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<ChartTip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="spent"  name="Spent"  stroke="#6366f1" fill="url(#gs)" strokeWidth={2} />
                <Area type="monotone" dataKey="earned" name="Earned" stroke="#10b981" fill="url(#ge)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </AnimatedCard>

        {/* Activity bar chart */}
        <AnimatedCard hover={false} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Daily Activity</h3>
              <p className="text-[11px] text-muted-foreground">தினசரி செயல்பாடு · {range}d</p>
            </div>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          {!activity ? <Skeleton className="h-52 rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={activity} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={tickGap} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="designs" name="Designs" fill="#6366f1" radius={[3,3,0,0]} maxBarSize={18} />
                <Bar dataKey="jobs"    name="AI Jobs"  fill="#ec4899" radius={[3,3,0,0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </AnimatedCard>
      </div>

      {/* ── Charts row 2 ───────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* AI tool donut */}
        <AnimatedCard hover={false} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">AI Tool Breakdown</h3>
              <p className="text-[11px] text-muted-foreground">AI கருவி பயன்பாடு · all time</p>
            </div>
            <BarChart2 className="h-4 w-4 text-primary" />
          </div>
          {!s ? <Skeleton className="h-52 rounded-lg" /> : s.jobs.byType.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
              No AI jobs yet — start with Image Gen 🎨
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="42%" height={190}>
                <PieChart>
                  <Pie data={s.jobs.byType} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={3}>
                    {s.jobs.byType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5 min-w-0">
                {s.jobs.byType.map((j, i) => {
                  const pct = Math.round((j.count / Math.max(s.jobs.total, 1)) * 100);
                  return (
                    <div key={j.type}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="flex items-center gap-1.5 text-muted-foreground truncate">
                          <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          {JOB_META[j.type]?.label ?? j.type}
                        </span>
                        <span className="font-semibold tabular-nums ml-2">{j.count}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </AnimatedCard>

        {/* Credits by app horizontal bar */}
        <AnimatedCard hover={false} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Credits by Tool (30d)</h3>
              <p className="text-[11px] text-muted-foreground">கருவி வாரியாக செலவு</p>
            </div>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          {!s ? <Skeleton className="h-52 rounded-lg" /> : s.creditsByApp.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
              No credit usage this month
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={s.creditsByApp} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 52 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="app" tick={{ fontSize: 10 }} width={50} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="spent" name="Credits" radius={[0,4,4,0]} maxBarSize={18}>
                  {s.creditsByApp.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </AnimatedCard>
      </div>

      {/* ── Credit Balance Meter ───────────────────────────────── */}
      {s && (
        <AnimatedCard hover={false} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Credit Balance</h3>
              <p className="text-[11px] text-muted-foreground">கிரெடிட் நிலை</p>
            </div>
            <span className={cn(
              'rounded-full px-2.5 py-1 text-xs font-semibold',
              s.credits.balance > 200 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
              s.credits.balance > 50  ? 'bg-amber-500/10  text-amber-600  dark:text-amber-400'    :
                                        'bg-rose-500/10   text-rose-500',
            )}>
              {s.credits.balance > 200 ? '✅ Plenty' : s.credits.balance > 50 ? '⚠️ Low' : '🚨 Critical'}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{s.credits.balance.toLocaleString()} remaining</span>
              <span>{s.credits.spentTotal.toLocaleString()} total used</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-700"
                style={{ width: `${creditPct}%` }}
              />
            </div>
            <div className="flex gap-4 text-[11px] text-muted-foreground pt-0.5">
              <span>💸 This month: <strong className="text-foreground">{s.credits.spentMonth}</strong></span>
              <span>📅 Active days: <strong className="text-foreground">{s.activeDays}</strong></span>
              <span>🤖 Total jobs: <strong className="text-foreground">{s.jobs.total}</strong></span>
            </div>
          </div>
        </AnimatedCard>
      )}

      {/* ── Activity Feed ──────────────────────────────────────── */}
      <AnimatedCard hover={false} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Recent Activity</h3>
            <p className="text-[11px] text-muted-foreground">சமீபத்திய செயல்பாடுகள்</p>
          </div>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        {!feed ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : feed.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No activity yet — start creating! 🚀
          </div>
        ) : (
          <div className="divide-y divide-border">
            {feed.slice(0, 15).map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2.5">
                <span className="text-base shrink-0">
                  {item.kind === 'credit' ? ((item.delta ?? 0) > 0 ? '💰' : '⚡') : '🤖'}
                </span>
                <p className="flex-1 min-w-0 text-xs font-medium truncate">{activityLabel(item)}</p>
                <span className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">
                  {new Date(item.at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                {item.kind === 'credit' && (
                  <span className={cn('shrink-0 text-[11px] font-bold tabular-nums w-10 text-right',
                    (item.delta ?? 0) > 0 ? 'text-emerald-600' : 'text-rose-500')}>
                    {(item.delta ?? 0) > 0 ? '+' : ''}{item.delta}
                  </span>
                )}
                {item.kind === 'job' && (
                  <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                    item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                    item.status === 'failed'    ? 'bg-rose-500/10 text-rose-500' :
                    'bg-muted text-muted-foreground')}>
                    {item.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </AnimatedCard>

    </div>
  );
}
