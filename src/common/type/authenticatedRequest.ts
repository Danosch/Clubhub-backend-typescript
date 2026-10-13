import type { IncomingHttpHeaders } from "node:http";

/**
 * Contains the request fields used during authentication.
 */
export interface AuthenticatedRequest {
    headers: IncomingHttpHeaders;
    userId?: string;
}