import { SetMetadata } from "@nestjs/common";

export const PUBLIC_ROUTE_KEY = 'clubhub:isPublic';

/**
 * Allows access without an authentication token.
 */
export const Public = () => SetMetadata(PUBLIC_ROUTE_KEY, true);