import { Injectable } from '@nestjs/common';

import { PasswordService } from '../../../infrastructure/security/password.service.js';
import type { CreateUserDTO } from '../../users/dto/createUser.dto.js';
import { UserRepository } from '../../users/repository/user.repository.js';
import { UserService } from '../../users/service/user.service.js';
import { AuthResponseDTO } from '../dto/authResponse.dto.js';
import type { LoginDTO } from '../dto/login.dto.js';
import { AuthValidator } from '../validation/auth.validation.js';
import { SessionService } from './session.service.js';

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
     * Creates a user and an authentication session.
     */
    async register(dto: CreateUserDTO): Promise<AuthResponseDTO> {
        const user = await this.userService.createUser(dto);
        const token = await this.sessionService.createToken(user.id);

        return new AuthResponseDTO(token);
    }

    /**
     * Verifies credentials and creates an authentication session.
     *
     * @throws {UnauthorizedException} If the credentials are invalid.
     */
    async login(dto: LoginDTO): Promise<AuthResponseDTO> {
        const user = await this.userRepository.findByEmailWithPasswordHash(
            dto.email,
        );

        const passwordMatches = await this.passwordService.verify(
            dto.password,
            user?.passwordHash ?? null,
        );

        const authenticatedUser =
            this.authValidator.requireAuthenticatedUser(
                user,
                passwordMatches,
            );

        const token = await this.sessionService.createToken(
            authenticatedUser.id,
        );

        return new AuthResponseDTO(token);
    }
}