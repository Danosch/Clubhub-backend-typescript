import { ApiError } from './ApiError';

/**
 * Fetch options for requests that may suppress the global 401 callback.
 */
type ApiRequestOptions = RequestInit & {
  skipUnauthorizedCallback?: boolean;
};


/**
 * Wraps fetch for ClubHub API requests.
 * 
 * Resolves the API base URL, includes browser cookies and converts
 * unsuccessful HTTP responses into ApiError instances.
 */
export class ClientApi {
  /** Resolved API base URL including the '/api' suffix (no trailing slash). */
  public readonly baseUrl: string;

  /**
   * Calles when an API request returns HTTP 401.
   * The auth provider uses this to mark the session as unauthenticated.
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

  /**
   * Sends a API request with the browser's session cookie.
   * 
   * @typeParam T Expected response data.
   * @param path Relative API path or absolute URL.
   * @param options Fetch options and optional 401 callback supression.
   * @returns Parsed response data, or undefined for HTTP 204.
   * @throws {ApiError} When the server returns a non 2-xx response.
   */
  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { skipUnauthorizedCallback = false, ...fetchOptions } = options;
    const isAbsolute = /^https?:\/\//i.test(path);
    const url = isAbsolute
      ? path
      : `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

    const headers = new Headers(fetchOptions.headers);
    const isForm =
      typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;

    if (fetchOptions.body != null && !isForm && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include',
    });

    if (res.status === 401 && !skipUnauthorizedCallback) {
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