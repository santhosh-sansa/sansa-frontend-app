'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSocket, connectSocket } from '@/lib/socket';

export function useSocket() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = connectSocket();
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return { socket: getSocket(), connected };
}

export type JobUpdate = {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: { url?: string; [key: string]: unknown };
  error?: string;
};

/**
 * Subscribe to real-time job updates.
 * Falls back to polling if WebSocket is not available.
 */
export function useJobSubscription(jobId: string | null) {
  const { socket, connected } = useSocket();
  const [status, setStatus] = useState<JobUpdate['status']>('queued');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<JobUpdate['result'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Polling fallback
  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const token = localStorage.getItem('sansa_access_token');
        const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.sansaai.in';
        const res = await fetch(`${API}/api/jobs/${jobId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json() as { job?: { status: string; progress: number; result: unknown; error: string | null } };
        if (data.job) {
          setStatus(data.job.status as JobUpdate['status']);
          setProgress(data.job.progress || 0);
          if (data.job.result) setResult(data.job.result as JobUpdate['result']);
          if (data.job.error) setError(data.job.error);
        }
      } catch {}
    };

    poll();
    const interval = setInterval(poll, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  const reset = useCallback(() => {
    setStatus('queued');
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return { status, progress, result, error, connected, reset };
}
