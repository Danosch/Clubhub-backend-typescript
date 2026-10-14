/**
 * Error thrown by API requests on non-2xx responses.
 * Contains the HTTP status code alongside the message.
 */
export class ApiError extends Error {
  /** HTTP status code returned by the server. */
  status: number;
  /** Optional machine-readable error code (e.g., CLB-... identifiers). */
  code?: string;
  /** Optional short human-readable title. */
  title?: string;
  /** Optional detailed description of the error. */
  details?: string;
  /** Optional parameter bag provided by backend. */
  params?: Record<string, unknown>;
  /** The raw parsed payload, if any. */
  raw?: unknown;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}
