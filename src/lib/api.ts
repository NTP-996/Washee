import { tokenStore } from './auth';
import type { ApiError, AuthResult } from '../types';

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

// ApiRequestError carries the backend error envelope's code + status so callers
// (and UI) can branch on them.
export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean; // attach the user bearer (default true)
  admin?: boolean; // attach the admin bearer instead of the user one
  retry?: boolean; // internal: allow one user 401 -> refresh retry (default true)
}

function send(path: string, opts: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.admin) {
    if (tokenStore.adminAccess) headers.Authorization = `Bearer ${tokenStore.adminAccess}`;
  } else if (opts.auth !== false && tokenStore.access) {
    headers.Authorization = `Bearer ${tokenStore.access}`;
  }
  return fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

// Silently exchange the (user) refresh token for a new pair. Returns success.
async function refreshTokens(): Promise<boolean> {
  const refresh = tokenStore.refresh;
  if (!refresh) return false;
  const res = await send('/api/auth/refresh', {
    method: 'POST',
    body: { refreshToken: refresh },
    auth: false,
  });
  if (!res.ok) {
    tokenStore.clear();
    return false;
  }
  tokenStore.set((await res.json()) as AuthResult);
  return true;
}

// api performs a typed JSON request. User requests transparently refresh once on
// a 401; admin requests drop the (access-only) admin token on a 401.
export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  let res = await send(path, opts);

  if (res.status === 401 && !opts.admin && opts.auth !== false && opts.retry !== false && tokenStore.refresh) {
    if (await refreshTokens()) res = await send(path, { ...opts, retry: false });
  }
  if (res.status === 401 && opts.admin) tokenStore.clearAdmin();

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (data as ApiError).error;
    throw new ApiRequestError(res.status, err?.code ?? 'error', err?.message ?? 'Request failed');
  }
  return data as T;
}
