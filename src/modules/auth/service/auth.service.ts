import { Injectable } from '@nestjs/common';

import { PasswordService } from '../../../infrastructure/security/password.service.js';
import type { CreateUserDTO } from '../../users/dto/createUser.dto.js';
import { UserRepository } from '../../users/repository/user.repository.js';
import { UserService } from '../../users/service/user.service.js';
import type { LoginDTO } from '../dto/login.dto.js';
import { AuthValidator } from '../validation/auth.validation.js';
import { SessionService } from './session.service.js';
import type { UserDTO } from '../../users/dto/user.dto.js';

/**
 * Coordinates registration, credential verification and sessions.
 */
@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly userRepository: UserRepository,
        private readonly passwordService: PasswordService,
        private readonly sessionService: SessionService,
        private readonly authValidator: AuthValidator,
    ) { }

    /**
     * Registration creates an account; the user signs in afterward.
     */
    async register(dto: CreateUserDTO): Promise<UserDTO> {
        return this.userService.createUser(dto);
    }

    /**
     * The token stays inside the backend and is passed to the controller.
     */
    async login(dto: LoginDTO): Promise<string> {
        const user = await this.userRepository.findByEmailWithPasswordHash(
            dto.email
        );
        const passwordMatches = await this.passwordService.verify(
            dto.password,
            user?.passwordHash ?? null
        );

        const authenticatedUser =
            this.authValidator.requireAuthenticatedUser(user, passwordMatches);

        return this.sessionService.createToken(authenticatedUser.id);
    }

    /**
    * Revokes the session when the browser sends a session cookie.
    */
    async logout(token: string | undefined): Promise<void> {
        if (token === undefined) {
            return;
        }
        await this.sessionService.revokeToken(token);
    }

    /**
     * Renews an active session and returns its token for the response cookie.
     * 
     * @param token The token from the session cookie.
     * @returns The renewed token for internal use by the controller.
     * @throws {UnauthorizedException} If the session is missing or expired.
     */
    async refresh(token: string | undefined): Promise<string> {
        if (!token || !(await this.sessionService.refreshToken(token))) {
            throw this.authValidator.invalidToken();
        }
        return token;
    }
}