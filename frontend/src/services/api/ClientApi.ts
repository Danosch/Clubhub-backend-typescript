import { ApiError } from './ApiError';

/**
 * Small wrapper for `fetch` that centralizes API base URL resolution and
 * bearer-token handling for requests.
 *
 * Base URL resolution order (the '/api' suffix is always appended):
 * - Constructor `base` argument, when provided
 * - `import.meta.env.VITE_API_URL`, when defined (Vite)
 * - Fallback `http://localhost:8080`
 */
export class ClientApi {
  /** Resolved API base URL including the '/api' suffix (no trailing slash). */
  public readonly baseUrl: string;

  /**
   * Optional callback invoked when a request receives a 401 Unauthorized.
   * The access token is cleared before this callback runs. Useful for
   * triggering logout flows or redirecting to a sign-in page.
   */
  public onUnauthorized?: () => void;

  /**
   * Create a new ClientApi instance.
   *
   * @param base Optional override for the server root URL
   *             (e.g., `https://example.com`). If omitted, uses
   *             `import.meta.env.VITE_API_URL` or `http://localhost:8080`.
   */
  constructor(base?: string) {
    // default to local quarkus + /api when env is missing
    const env = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
    const root = (base ?? env ?? 'http://localhost:8080').replace(/\/+$/, '');
    // Ensure we always hit /api
    this.baseUrl = `${root}/api`;
  }

  /** In-memory bearer token used for Authorization header. */
  private static accessToken: string | null = null;

  /**
   * Set (or clear) the bearer access token. The token is stored in
   * `localStorage` under the key `access_token`.
   *
   * Call after login/registration, and pass `null` on logout.
   *
   * @param token The access token string, or `null` to clear it.
   */
  static setAuthToken(token: string | null) {
    ClientApi.accessToken = token;
    try {
      if (token) localStorage.setItem('access_token', token);
      else localStorage.removeItem('access_token');
    } catch {}
  }

  /**
   * Restore a previously persisted token from `localStorage` into memory.
   * Safe to call during application bootstrap.
   */
  static bootstrapTokenFromStorage() {
    try {
      const t = localStorage.getItem('access_token');
      ClientApi.accessToken = t;
    } catch {}
  }

  /**
   * Perform an HTTP request against the API.
   *
   * Behavior:
   * - Accepts a relative `path` (joined to `baseUrl`) or an absolute URL.
   * - Adds `Authorization: Bearer <token>` when a token is set.
   * - Sets `Content-Type: application/json` when the body is not `FormData`
   *   and no `Content-Type` is already provided.
   * - Does not JSON-serialize the body for you; provide a string body if
   *   sending JSON (e.g., `body: JSON.stringify(payload)`).
   * - On 401: clears the token and invokes `onUnauthorized`.
   * - On non-2xx: throws `ApiError` with the status and a parsed message.
   * - On 204: resolves to `undefined`.
   *
   * @typeParam T Expected JSON shape of the successful response.
   * @param path Relative API path (e.g., `/users`) or absolute URL.
   * @param options Standard `fetch` options.
   * @returns Parsed JSON as `T`, or `undefined` for 204 responses.
   * @throws ApiError When the response is not OK (non-2xx).
   */
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const isAbsolute = /^https?:\/\//i.test(path);
    const url = isAbsolute
      ? path
      : `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Only set JSON header if the body is not FormData and header not provided
    const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (!isForm && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (ClientApi.accessToken) {
      headers['Authorization'] = `Bearer ${ClientApi.accessToken}`;
    }

    const res = await fetch(url, { ...options, headers });
    // Invoke callback and clear token when session is invalid
    if (res.status === 401) {
      ClientApi.setAuthToken(null);
      this.onUnauthorized?.();
    }

    // Throw ApiError on non-ok responses with structured details if present.
    if (!res.ok) {
      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      const msg = (data && (data.message || data.error || data.title || data.details)) || res.statusText;
      const err = new ApiError(res.status, msg);
      if (data && typeof data === 'object') {
        err.code = (data as any).errorCode || (data as any).code;
        err.title = (data as any).title;
        err.details = (data as any).details || (data as any).detail;
        err.params = (data as any).messageParameters || (data as any).params;
        err.raw = data;
      }
      throw err;
    }

    if (res.status === 204) return undefined as unknown as T;
    return res.json() as Promise<T>;
  }
}

/** Shared ClientApi instance configured from environment variables. */
export const clientApi = new ClientApi();

// handy re-export
export const setAuthToken = ClientApi.setAuthToken;
ClientApi.bootstrapTokenFromStorage();
