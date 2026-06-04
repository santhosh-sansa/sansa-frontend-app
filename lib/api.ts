const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.sansaai.in';

export type ApiError = { ok: false; error: string; status?: number };

export function isApiError(res: unknown): res is ApiError {
  return typeof res === 'object' && res !== null && 'ok' in res && (res as ApiError).ok === false;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sansa_access_token');
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem('sansa_access_token', access);
  if (refresh) localStorage.setItem('sansa_refresh_token', refresh);
}

/**
 * After any login (email/password OR OAuth), call this to persist
 * user_id and user_name in localStorage so other features (collab, etc.) can read them.
 */
export async function hydrateUserCache(): Promise<void> {
  try {
    const res = await apiFetch<{ user: { id: string | number; name: string; email: string } }>('/api/auth/me');
    if (!isApiError(res) && res.user) {
      localStorage.setItem('sansa_user_id',    String(res.user.id));
      localStorage.setItem('sansa_user_name',  res.user.name || res.user.email.split('@')[0]);
      localStorage.setItem('sansa_user_email', res.user.email);
    }
  } catch { /* silent — not critical */ }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T | ApiError> {
  const headers = new Headers(init.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    return { ok: false, error: data.error || res.statusText, status: res.status };
  }
  return data;
}

export async function pollJob(jobId: string, onTick?: (status: string) => void) {
  for (let i = 0; i < 60; i++) {
    const job = await apiFetch<{ status: string; result?: { url?: string }; error?: string }>(
      `/api/jobs/${jobId}`,
    );
    if (isApiError(job)) throw new Error(job.error);
    onTick?.(job.status);
    if (job.status === 'completed') return job;
    if (job.status === 'failed') throw new Error(job.error || 'Job failed');
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('Job timed out');
}

export { API_BASE };
