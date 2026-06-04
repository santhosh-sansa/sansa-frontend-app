'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiFetch, isApiError } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.sansaai.in';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
};

export function useStreamingChat(threadId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load existing messages when threadId changes
  useEffect(() => {
    if (!threadId) return;
    void (async () => {
      const res = await apiFetch<{ messages: Array<{ id: string; role: string; content: string; createdAt: string }> }>(
        `/api/assistant/threads/${threadId}/messages`,
      );
      if (!isApiError(res) && res.messages) {
        setMessages(
          res.messages.map((m) => ({
            id: m.id,
            role: m.role as ChatMessage['role'],
            content: m.content,
            timestamp: new Date(m.createdAt).getTime(),
          })),
        );
      }
    })();
  }, [threadId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const token = localStorage.getItem('sansa_access_token');

        // Use streaming endpoint if threadId exists, otherwise quick chat
        const endpoint = threadId
          ? `${API_BASE}/api/assistant/threads/${threadId}/stream`
          : `${API_BASE}/api/assistant/chat`;

        const body = threadId
          ? { content: content.trim() }
          : { content: content.trim() };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(errData.error || `API error: ${res.status}`);
        }

        // Check if response is SSE stream or JSON
        const contentType = res.headers.get('content-type') || '';

        if (contentType.includes('text/event-stream')) {
          // SSE streaming response
          const reader = res.body?.getReader();
          if (!reader) throw new Error('No response stream');

          const decoder = new TextDecoder();
          let accumulated = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;
                try {
                  const parsed = JSON.parse(data) as { delta?: string; content?: string; done?: boolean };
                  const text = parsed.delta || parsed.content || '';
                  if (text && !parsed.done) {
                    accumulated += text;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMsg.id
                          ? { ...m, content: accumulated }
                          : m,
                      ),
                    );
                  }
                  if (parsed.done && parsed.content) {
                    accumulated = parsed.content;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMsg.id
                          ? { ...m, content: accumulated }
                          : m,
                      ),
                    );
                  }
                } catch {
                  // Non-JSON SSE line
                }
              }
            }
          }
        } else {
          // JSON response (quick chat fallback)
          const data = await res.json() as { content?: string; assistantMessage?: { content: string } };
          const aiContent = data.content || data.assistantMessage?.content || '';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: aiContent } : m,
            ),
          );
        }

        // Mark streaming complete
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, isStreaming: false } : m,
          ),
        );
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        const errorMsg = (err as Error).message || 'Failed to send message';
        setError(errorMsg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: 'Sorry, something went wrong. Please try again.', isStreaming: false }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, threadId],
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages };
}
