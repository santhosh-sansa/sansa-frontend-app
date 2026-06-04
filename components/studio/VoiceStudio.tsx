'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, isApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { AnimatedCard } from '@/components/ui/animated-card';
import { GradientText } from '@/components/ui/gradient-text';
import { useJobSubscription } from '@/hooks/use-socket';
import { cn } from '@/lib/utils';
import {
  Mic,
  Play,
  Pause,
  Download,
  Trash2,
  Wand2,
  Languages,
  Volume2,
  Clock,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────

type Language = 'en' | 'ta' | 'tanglish';

interface Voice {
  id: string;
  name: string;
  language: string;
  gender: string;
  preview?: string;
}

interface VoiceProject {
  id: string;
  title: string;
  script: string;
  voiceId: string;
  language: string;
  audioUrl: string;
  status: string;
  createdAt: string;
}

// ─── Language config ──────────────────────────────────────────

const LANGUAGES: { value: Language; label: string; flag: string; hint: string }[] = [
  { value: 'en',       label: 'English',   flag: '🇬🇧', hint: 'Speak in English'        },
  { value: 'ta',       label: 'தமிழ்',      flag: '🇮🇳', hint: 'Tamil (Unicode script)'  },
  { value: 'tanglish', label: 'Tanglish',  flag: '🌐', hint: 'Tamil written in English' },
];

// ─── AudioPlayer sub-component ────────────────────────────────

function AudioPlayer({ url, title }: { url: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  const fullUrl = url.startsWith('http') ? url : `${apiBase}${url}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded    = () => setDuration(audio.duration);
    const onEnded     = () => setPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); } else { void audio.play(); }
    setPlaying(!playing);
  };

  const seek = (v: number) => {
    if (audioRef.current) audioRef.current.currentTime = v;
    setCurrentTime(v);
  };

  const changeVolume = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const fmt = (t: number) => {
    if (!isFinite(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
      <audio ref={audioRef} src={fullUrl} preload="metadata" />

      {/* Waveform bar + time */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition-transform hover:scale-105 active:scale-95"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
        </button>

        <div className="flex-1 space-y-1.5">
          <p className="text-xs font-medium truncate text-foreground">{title}</p>
          {/* Scrubber */}
          <div className="relative h-1.5 rounded-full bg-muted overflow-hidden cursor-pointer"
               onClick={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const ratio = (e.clientX - rect.left) / rect.width;
                 seek(ratio * duration);
               }}>
            <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-1.5">
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="range" min={0} max={1} step={0.05} value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="h-1 w-16 cursor-pointer accent-primary"
          />
        </div>
      </div>

      {/* Download */}
      <Button size="sm" variant="outline" className="w-full gap-2" asChild>
        <a href={fullUrl} download={`${title}.mp3`}>
          <Download className="h-3.5 w-3.5" />Download Audio
        </a>
      </Button>
    </div>
  );
}

// ─── Job tracker sub-component ────────────────────────────────

function VoiceJobTracker({
  jobId,
  onComplete,
}: {
  jobId: string;
  onComplete: (url: string) => void;
}) {
  const { status, progress, result, error } = useJobSubscription(jobId);

  useEffect(() => {
    if (status === 'completed' && result?.url) {
      onComplete(result.url as string);
    }
  }, [status, result, onComplete]);

  const isComplete   = status === 'completed';
  const isFailed     = status === 'failed';
  const isProcessing = status === 'processing' || status === 'queued';

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-xl border p-4',
      isComplete ? 'border-emerald-500/30 bg-emerald-500/5' : '',
      isFailed   ? 'border-red-500/30 bg-red-500/5'         : '',
      isProcessing ? 'border-border bg-card/50'             : '',
    )}>
      {isComplete ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
      ) : isFailed ? (
        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
      ) : (
        <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {isComplete ? 'Audio ready!' : isFailed ? 'Generation failed' : 'Generating audio…'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isFailed
            ? (error || 'Unknown error')
            : isProcessing && progress > 0
            ? `${Math.round(progress)}% complete`
            : isProcessing ? 'Queued…' : 'Done'}
        </p>
      </div>
    </div>
  );
}

// ─── Main VoiceStudio ─────────────────────────────────────────

export function VoiceStudio() {
  const qc = useQueryClient();

  // Form state
  const [script, setScript]         = useState('');
  const [language, setLanguage]     = useState<Language>('en');
  const [selectedVoice, setVoice]   = useState('');
  const [stability, setStability]   = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [showVoices, setShowVoices] = useState(false);

  // Job / result state
  const [activeJobId, setActiveJobId]   = useState<string | null>(null);
  const [latestAudioUrl, setLatestAudioUrl] = useState<string | null>(null);
  const [latestTitle, setLatestTitle]   = useState('');

  // ── Fetch voices ─────────────────────────────────────────
  const { data: voicesData } = useQuery({
    queryKey: ['voice-voices'],
    queryFn: async () => {
      const res = await apiFetch<{ ok: boolean; provider: string; voices: Voice[] }>('/api/voice/voices');
      if (isApiError(res)) return { provider: 'none', voices: [] as Voice[] };
      return res;
    },
    staleTime: 1000 * 60 * 10,
  });

  const voices = voicesData?.voices ?? [];
  const provider = voicesData?.provider ?? 'none';

  // Set default voice once loaded
  useEffect(() => {
    if (voices.length > 0 && !selectedVoice) {
      setVoice(voices[0].id);
    }
  }, [voices, selectedVoice]);

  // ── Fetch voice projects ──────────────────────────────────
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['voice-projects'],
    queryFn: async () => {
      const res = await apiFetch<{ ok: boolean; projects: VoiceProject[] }>('/api/studio/voice');
      if (isApiError(res)) return { projects: [] as VoiceProject[] };
      return res;
    },
    refetchInterval: activeJobId ? 4000 : false,
  });

  const projects = projectsData?.projects ?? [];

  // ── Generate ──────────────────────────────────────────────
  const generate = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        script,
        language,
        voiceId: selectedVoice || 'default',
        title: script.slice(0, 60),
      };
      // Pass stability settings via meta if supported
      const res = await apiFetch<{ ok: boolean; jobId: string }>('/api/studio/voice/synthesize', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (isApiError(res)) throw new Error(res.error);
      return res.jobId;
    },
    onMutate: () => {
      setLatestAudioUrl(null);
      setActiveJobId(null);
      setLatestTitle(script.slice(0, 60));
    },
    onSuccess: (jobId) => {
      setActiveJobId(jobId);
      toast.success('Generating audio…');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleJobComplete = useCallback((url: string) => {
    setLatestAudioUrl(url);
    setActiveJobId(null);
    toast.success('Audio is ready!');
    void qc.invalidateQueries({ queryKey: ['voice-projects'] });
  }, [qc]);

  // ── Delete project ────────────────────────────────────────
  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/studio/voice/projects/${id}`, { method: 'DELETE' });
      if (isApiError(res)) throw new Error(res.error);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['voice-projects'] });
      toast.success('Deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const selectedVoiceName = voices.find((v) => v.id === selectedVoice)?.name ?? 'Select voice';
  const charCount         = script.length;
  const maxChars          = 5000;
  const creditsPerCall    = 4;

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Mic className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-none">
              <GradientText>Voice Studio</GradientText>
            </h1>
            <p className="mt-0.5 text-[10px] text-muted-foreground">குரல் ஸ்டுடியோ</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
            {provider === 'elevenlabs' ? 'ElevenLabs' : provider === 'openai-tts' ? 'OpenAI TTS' : 'No Provider'}
          </span>
          <span className="text-[10px] text-muted-foreground">{creditsPerCall} credits / gen</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Input Panel ────────────────────────────────── */}
        <div className="flex w-[420px] shrink-0 flex-col gap-4 border-r border-border overflow-y-auto p-5">

          {/* Language selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Language / மொழி
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                    language === lang.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {LANGUAGES.find((l) => l.value === language)?.hint}
            </p>
          </div>

          {/* Voice selector */}
          {voices.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Voice / குரல்
              </label>
              <button
                onClick={() => setShowVoices(!showVoices)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedVoiceName}</span>
                </div>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', showVoices && 'rotate-180')} />
              </button>

              {showVoices && (
                <div className="rounded-lg border border-border bg-card overflow-hidden max-h-48 overflow-y-auto">
                  {voices.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { setVoice(v.id); setShowVoices(false); }}
                      className={cn(
                        'flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-muted transition-colors',
                        selectedVoice === v.id && 'bg-primary/10 text-primary',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                          v.gender === 'female' ? 'bg-pink-500/15 text-pink-500' : 'bg-blue-500/15 text-blue-500',
                        )}>
                          {v.gender === 'female' ? '♀' : '♂'}
                        </div>
                        <span className="font-medium">{v.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase">{v.language}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Script input */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Script / வசனம்
              </label>
              <span className={cn('text-[10px]', charCount > maxChars * 0.9 ? 'text-amber-500' : 'text-muted-foreground')}>
                {charCount}/{maxChars}
              </span>
            </div>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              maxLength={maxChars}
              placeholder={
                language === 'ta'
                  ? 'இங்கே உங்கள் வசனம் தமிழில் எழுதுங்கள்…'
                  : language === 'tanglish'
                  ? 'Inga unkal vasanam tanglish-la ezhuthunga…'
                  : 'Enter your script here. Supports English, Tamil, and Tanglish…'
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[160px]"
              disabled={generate.isPending}
            />
          </div>

          {/* Voice settings (ElevenLabs only) */}
          {provider === 'elevenlabs' && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Voice Settings
              </p>
              {[
                { label: 'Stability', value: stability, set: setStability, hint: 'Higher = more consistent' },
                { label: 'Similarity', value: similarity, set: setSimilarity, hint: 'Higher = closer to original voice' },
              ].map((s) => (
                <div key={s.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                    <span className="text-[10px] text-muted-foreground">{Math.round(s.value * 100)}%</span>
                  </div>
                  <input
                    type="range" min={0} max={1} step={0.05} value={s.value}
                    onChange={(e) => s.set(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary"
                  />
                  <p className="text-[10px] text-muted-foreground/70">{s.hint}</p>
                </div>
              ))}
            </div>
          )}

          {/* Generate button */}
          <Button
            onClick={() => generate.mutate()}
            disabled={!script.trim() || generate.isPending || !!activeJobId}
            className="w-full gap-2"
            size="lg"
          >
            {generate.isPending || activeJobId ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate Voice — {creditsPerCall} credits
              </>
            )}
          </Button>
        </div>

        {/* ── Right: Output + History ───────────────────────────── */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">

          {/* Active job tracker */}
          {activeJobId && (
            <VoiceJobTracker jobId={activeJobId} onComplete={handleJobComplete} />
          )}

          {/* Latest audio player */}
          {latestAudioUrl && (
            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" />Latest Generation
              </p>
              <AudioPlayer url={latestAudioUrl} title={latestTitle || 'Generated Audio'} />
            </div>
          )}

          {/* Empty state */}
          {!activeJobId && !latestAudioUrl && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                <Mic className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                உங்கள் audio இங்கே தோன்றும்
              </p>
              <p className="text-xs text-muted-foreground/70">
                Write a script and click Generate
              </p>
            </div>
          )}

          {/* Voice projects history */}
          {projects.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />Recent Generations ({projects.length})
              </p>
              <div className="space-y-2">
                {projects.map((p) => (
                  <AnimatedCard key={p.id} hover={false} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">{p.title || 'Untitled'}</p>
                          <span className={cn(
                            'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase',
                            p.status === 'completed' ? 'bg-emerald-500/15 text-emerald-500' :
                            p.status === 'failed'    ? 'bg-red-500/15 text-red-500'         :
                                                       'bg-amber-500/15 text-amber-500',
                          )}>
                            {p.status}
                          </span>
                          <span className="shrink-0 text-[9px] text-muted-foreground uppercase rounded-full bg-muted px-1.5 py-0.5">
                            {p.language}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{p.script}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground/60">
                          {new Date(p.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {p.status === 'completed' && p.audioUrl && (
                          <button
                            onClick={() => { setLatestAudioUrl(p.audioUrl); setLatestTitle(p.title); }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            title="Play"
                          >
                            <Play className="h-3.5 w-3.5 translate-x-0.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteProject.mutate(p.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline audio player for completed */}
                    {p.status === 'completed' && p.audioUrl && latestAudioUrl === p.audioUrl && (
                      <div className="mt-3">
                        <AudioPlayer url={p.audioUrl} title={p.title} />
                      </div>
                    )}
                  </AnimatedCard>
                ))}
              </div>
            </div>
          )}

          {projectsLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />Loading projects…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
