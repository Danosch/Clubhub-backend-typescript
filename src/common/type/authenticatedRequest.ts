/**
 * Contains the request fields used during authentication.
 */
export interface AuthenticatedRequest {
    cookies?: Record<string, string>;
    userId?: string;
}