'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { GradientText } from '@/components/ui/gradient-text';
import { AnimatedCard } from '@/components/ui/animated-card';
import { apiFetch, isApiError } from '@/lib/api';
import { toast } from 'sonner';
import {
  Upload,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Scissors,
  Type,
  Music,
  Volume2,
  Download,
  Sparkles,
  Mic,
  Languages,
  Film,
  Gauge,
} from 'lucide-react';

export function VideoEditor() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(100);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (f: File) => {
    setVideoFile(f);
    setVideoUrl(URL.createObjectURL(f));
    toast.success(`Loaded: ${f.name}`);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setTrimEnd(videoRef.current.duration);
  };

  const seek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const changeSpeed = (s: number) => {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
  };

  const changeVolume = (v: number) => {
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v / 100;
  };

  const generateCaptions = async () => {
    if (!videoFile) return;
    toast.info('Generating AI captions...');
    const res = await apiFetch<{ jobId: string }>('/api/video/temp/captions', {
      method: 'POST',
      body: JSON.stringify({ language: 'en' }),
    });
    if (!isApiError(res)) {
      toast.success(`Caption job started: ${res.jobId}`);
    }
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-semibold"><GradientText>Video Editor</GradientText></h1>
          <span className="text-[10px] text-muted-foreground">வீடியோ திருத்தி</span>
        </div>
        <div className="flex items-center gap-1">
          {videoFile && <Button size="sm" variant="outline" className="gap-1.5"><Download className="h-3.5 w-3.5" />Export</Button>}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Tools */}
        <div className="w-48 border-r border-border bg-card/30 p-3 space-y-2 overflow-y-auto">
          <Button variant="outline" size="sm" className="w-full gap-2 justify-start" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" />Open Video
          </Button>
          <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />

          <div className="pt-2 border-t border-border space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Edit</p>
            <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-xs"><Scissors className="h-3.5 w-3.5" />Trim / Cut</Button>
            <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-xs"><Type className="h-3.5 w-3.5" />Add Text</Button>
            <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-xs"><Music className="h-3.5 w-3.5" />Add Music</Button>
            <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-xs"><Gauge className="h-3.5 w-3.5" />Speed</Button>
          </div>

          <div className="pt-2 border-t border-border space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">AI Tools</p>
            <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-xs" onClick={generateCaptions}><Sparkles className="h-3.5 w-3.5" />AI Captions</Button>
            <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-xs"><Languages className="h-3.5 w-3.5" />Translate</Button>
            <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-xs"><Mic className="h-3.5 w-3.5" />AI Voiceover</Button>
          </div>

          {/* Speed control */}
          <div className="pt-2 border-t border-border space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Speed: {speed}x</p>
            <div className="flex gap-1">
              {[0.5, 1, 1.5, 2].map(s => (
                <button key={s} onClick={() => changeSpeed(s)} className={`rounded px-2 py-0.5 text-[10px] ${speed === s ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{s}x</button>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5"><Volume2 className="h-3 w-3 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">{volume}%</span></div>
            <input type="range" min={0} max={100} value={volume} onChange={(e) => changeVolume(Number(e.target.value))} className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary" />
          </div>
        </div>

        {/* Video Preview */}
        <div className="flex-1 flex flex-col bg-black">
          <div className="flex-1 flex items-center justify-center p-4">
            {!videoUrl ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-white/20 p-16 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                <Film className="h-12 w-12 text-white/40" />
                <p className="text-sm text-white/60">Upload a video to start editing</p>
                <p className="text-xs text-white/40">MP4, MOV, WebM supported</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                src={videoUrl}
                className="max-h-full max-w-full rounded shadow-2xl"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />
            )}
          </div>

          {/* Controls */}
          {videoUrl && (
            <div className="border-t border-white/10 bg-black/80 px-4 py-3 space-y-2">
              {/* Timeline */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                step={0.1}
                className="w-full h-1.5 rounded-full appearance-none bg-white/20 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
              {/* Playback controls */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">{formatTime(currentTime)} / {formatTime(duration)}</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={() => seek(Math.max(0, currentTime - 5))}><SkipBack className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-white rounded-full bg-white/10" onClick={togglePlay}>
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={() => seek(Math.min(duration, currentTime + 5))}><SkipForward className="h-4 w-4" /></Button>
                </div>
                <span className="text-xs text-white/60">{speed}x</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
