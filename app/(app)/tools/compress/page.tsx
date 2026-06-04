'use client';

import { FormEvent, useState } from 'react';

export default function CompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [stats, setStats] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const token = localStorage.getItem('sansa_access_token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/tools/compress`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const data = (await res.json()) as { url?: string; bytesIn?: number; bytesOut?: number };
    setUrl(data.url || '');
    if (data.bytesIn && data.bytesOut) {
      setStats(`${data.bytesIn} → ${data.bytesOut} bytes`);
    }
  }

  return (
    <div>
      <h1>Image Compressor</h1>
      <form onSubmit={onSubmit}>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button type="submit" style={{ marginLeft: 8 }}>
          Compress
        </button>
      </form>
      {stats && <p>{stats}</p>}
      {url && <img src={url} alt="Compressed" style={{ maxWidth: '100%', marginTop: 16 }} />}
    </div>
  );
}
