import {
    createParamDecorator,
    InternalServerErrorException
} from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../type/authenticatedRequest.js';


/**
 * Returns the user ID atached to the request by AuthGuard.
 */
export const CurrentUserId = createParamDecorator(
    (_data: unknown, context: ExecutionContext): string => {
        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();

        if (request.userId === undefined) {
            throw new InternalServerErrorException(
                'Authenticated user ID is unavailable.'
            );
        }

        return request.userId;
    }
)