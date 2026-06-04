'use client';

import { io, Socket } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.sansaai.in';

// ── Main jobs namespace socket ────────────────────────────────
let jobsSocket: Socket | null = null;

export function getSocket(): Socket {
  if (!jobsSocket) {
    jobsSocket = io(`${API}/jobs`, {
      autoConnect: false,
      transports: ['websocket'],
      auth: { token: typeof window !== 'undefined' ? localStorage.getItem('sansa_access_token') : null },
    });
  }
  return jobsSocket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  jobsSocket?.disconnect();
}

// ── Collab namespace socket (per-session) ─────────────────────
let collabSocket: Socket | null = null;

export function getCollabSocket(): Socket {
  if (!collabSocket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sansa_access_token') : null;
    collabSocket = io(`${API}/collab`, {
      autoConnect: false,
      transports: ['websocket'],
      auth: { token },
    });
  }
  return collabSocket;
}

export function connectCollabSocket(): Socket {
  const s = getCollabSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectCollabSocket() {
  collabSocket?.disconnect();
  collabSocket = null;
}
