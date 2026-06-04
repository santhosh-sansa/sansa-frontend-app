'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useStreamingChat, type ChatMessage } from '@/hooks/use-streaming-chat';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GradientText } from '@/components/ui/gradient-text';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { PulseDot } from '@/components/ui/pulse-dot';
import {
  Send,
  Square,
  Paperclip,
  Mic,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Image,
  Code,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Suggestion chips ─────────────────────────────────────────
const SUGGESTIONS = [
  { icon: <Image className="h-3.5 w-3.5" />, text: 'Generate a banner for my business', category: 'create' },
  { icon: <FileText className="h-3.5 w-3.5" />, text: 'Help me write Tamil marketing copy', category: 'write' },
  { icon: <Code className="h-3.5 w-3.5" />, text: 'Create an invoice template', category: 'business' },
  { icon: <Sparkles className="h-3.5 w-3.5" />, text: 'Remove background from an image', category: 'ai' },
];

// ─── Message Bubble ───────────────────────────────────────────
function MessageBubble({ message, onCopy, onRetry }: {
  message: ChatMessage;
  onCopy: (text: string) => void;
  onRetry?: () => void;
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('group flex gap-3 px-4 py-4 animate-fade-in', isUser ? 'justify-end' : 'hover:bg-muted/20')}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      {/* Content */}
      <div className={cn('max-w-[75%] space-y-1.5', isUser && 'flex flex-col items-end')}>
        {/* Name + time */}
        <div className={cn('flex items-center gap-2', isUser && 'flex-row-reverse')}>
          <span className="text-[10px] font-medium text-muted-foreground">
            {isUser ? 'You' : 'SANSA AI'}
          </span>
          <span className="text-[9px] text-muted-foreground/60">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md shadow-lg shadow-primary/10'
              : 'bg-card border border-border rounded-bl-md shadow-sm',
          )}
        >
          {message.isStreaming && !message.content ? (
            <TypingIndicator />
          ) : (
            <div className="whitespace-pre-wrap">
              {message.content}
              {message.isStreaming && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current opacity-70" />
              )}
            </div>
          )}
        </div>

        {/* Actions (assistant messages only) */}
        {!isUser && !message.isStreaming && message.content && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button onClick={handleCopy} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
            {onRetry && (
              <button onClick={onRetry} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <RotateCcw className="h-3 w-3" />
              </button>
            )}
            <button className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <ThumbsDown className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary ring-1 ring-border">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
}

// ─── Main Chat Interface ──────────────────────────────────────
export function ChatInterface({ threadId }: { threadId?: string }) {
  const { messages, isStreaming, error, sendMessage, stopStreaming } = useStreamingChat(threadId);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-3 glass">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-sm font-semibold">SANSA AI Assistant</h1>
          <div className="flex items-center gap-1.5">
            <PulseDot status={isStreaming ? 'processing' : 'online'} size="sm" />
            <span className="text-xs text-muted-foreground">
              {isStreaming ? 'Generating response...' : 'Online — English & Tamil'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            GPT-4o
          </span>
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
            {/* Welcome */}
            <div className="relative">
              <div className="absolute inset-0 -m-4 rounded-full bg-primary/10 blur-2xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold">
                <GradientText>SANSA AI</GradientText>
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Your AI-powered business assistant. Ask me anything in English or Tamil —
                I can help with creative design, marketing, business management, and more.
              </p>
            </div>

            {/* Suggestions */}
            <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => sendMessage(s.text)}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-left text-xs transition-all hover:border-primary/30 hover:bg-muted/50 hover:shadow-sm"
                >
                  <span className="text-muted-foreground">{s.icon}</span>
                  <span className="text-muted-foreground">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="pb-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onCopy={handleCopy} />
            ))}
          </div>
        )}
      </div>

      {/* ── Error ──────────────────────────────────────────── */}
      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* ── Input ──────────────────────────────────────────── */}
      <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4">
        <div
          className={cn(
            'flex items-end gap-2 rounded-2xl border bg-background px-4 py-3 transition-all',
            'border-input focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20',
            'shadow-sm',
          )}
        >
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground">
            <Paperclip className="h-4 w-4" />
          </Button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask anything in English or Tamil…"
            disabled={isStreaming}
            rows={1}
            className="max-h-[200px] min-h-[24px] flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />

          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground">
            <Mic className="h-4 w-4" />
          </Button>

          {isStreaming ? (
            <Button onClick={stopStreaming} size="icon" variant="destructive" className="h-8 w-8 shrink-0 rounded-full">
              <Square className="h-3 w-3" />
            </Button>
          ) : (
            <Button onClick={handleSend} size="icon" disabled={!input.trim()} className="h-8 w-8 shrink-0 rounded-full">
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          SANSA AI can make mistakes. Verify important information. • 1 credit per message
        </p>
      </div>
    </div>
  );
}
