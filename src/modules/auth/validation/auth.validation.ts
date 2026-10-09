import { Injectable } from '@nestjs/common';

import { ClubHubErrorCode } from '../../../common/exception/clubHubErrorCode.js';
import { UnauthorizedException } from '../../../common/exception/unauthorized.exception.js';
import type { User } from '../../users/entity/user.entity.js';

/**
 * Enforces authentication rules.
 */
@Injectable()
export class AuthValidator {
    /**
     * Returns the authenticated user when the credentials are valid.
     *
     * @throws {UnauthorizedException} If the credentials are invalid.
     */
    requireAuthenticatedUser(
        user: User | null,
        passwordMatches: boolean,
    ): User {
        if (user === null || !passwordMatches) {
            throw this.invalidCredentials();
        }

        return user;
    }

    /**
     * Creates a generic error without exposing account existence.
     */
    invalidCredentials(): UnauthorizedException {
        return new UnauthorizedException({
            errorCode: ClubHubErrorCode.INVALID_CREDENTIALS,
            title: 'Invalid credentials',
            details: 'Email or password is incorrect.',
            messageParameters: {},
            sourcePointer: null,
        });
    }
}