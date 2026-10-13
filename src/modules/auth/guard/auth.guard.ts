import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PUBLIC_ROUTE_KEY } from '../../../common/decorator/public.decorator.js';
import type { AuthenticatedRequest } from '../../../common/type/authenticatedRequest.js';
import { UserRepository } from '../../users/repository/user.repository.js';
import { SessionService } from '../service/session.service.js';
import { AuthValidator } from '../validation/auth.validation.js';
import { SESSION_COOKIE_NAME } from '../auth.constants.js';

/**
 * Authenticates requests using the sessions stored in Redis.
 */
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly sessionService: SessionService,
        private readonly userRepository: UserRepository,
        private readonly authValidator: AuthValidator

    ) { }

    /**
     * Allows public routes or requests with a valid user session.
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            PUBLIC_ROUTE_KEY,
            [context.getHandler(), context.getClass()],

        );

        if (isPublic == true) {
            return true;
        }

        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();

        const token = this.extractToken(request.cookies?.[SESSION_COOKIE_NAME]);

        if (token === null) {
            throw this.authValidator.invalidToken();
        }

        const userId = await this.sessionService.validateToken(token);

        if (userId == null) {
            throw this.authValidator.invalidToken();
        }

        // Reject session whose user no longer exists.
        const user = await this.userRepository.findById(userId);

        if (user === null) {
            throw this.authValidator.invalidToken();
        }

        request.userId = user.id;

        return true;

    }

    /**
     * Accepts only the 64-charcter hexadecimal token format we generate.
     */
    private extractToken(cookieValue: unknown): string | null {
        // A missing cookie or a non-string value cannot contain a session token.
        if (typeof cookieValue !== 'string') {
            return null;
        }

        // SessionService generates 32 random bytes as 64 hexadecimal characters.
        // This checks the format only; Redis determines whether the token is valid.
        return /^[0-9a-f]{64}$/i.test(cookieValue)
            ? cookieValue
            : null;
    }

}