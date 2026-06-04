'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function WhiteboardPage() {
  const [docs, setDocs] = useState<Record<string, unknown>[]>([]);
  const [title, setTitle] = useState('My board');

  useEffect(() => {
    void apiFetch<{ documents?: Record<string, unknown>[] }>('/api/tools/whiteboard').then((res) => {
      if ('documents' in res) setDocs(res.documents || []);
    });
  }, []);

  async function save() {
    await apiFetch('/api/tools/whiteboard', {
      method: 'POST',
      body: JSON.stringify({ title, canvasJson: { nodes: [] } }),
    });
    const res = await apiFetch<{ documents?: Record<string, unknown>[] }>('/api/tools/whiteboard');
    if ('documents' in res) setDocs(res.documents || []);
  }

  return (
    <div>
      <h1>Whiteboard</h1>
      <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginRight: 8 }} />
      <button type="button" onClick={save}>
        Save board
      </button>
      <ul>
        {docs.map((d) => (
          <li key={String(d.id)}>{String(d.title)}</li>
        ))}
      </ul>
    </div>
  );
}
