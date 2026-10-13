import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PasswordService } from '../../../infrastructure/security/password.service.js';
import type { CreateUserDTO } from '../dto/createUser.dto.js';
import type { UserDTO } from '../dto/user.dto.js';
import type { User } from '../entity/user.entity.js';
import { CreateUserMapper } from '../mapper/createUser.mapper.js';
import { UserMapper } from '../mapper/user.mapper.js';
import { UserRepository } from '../repository/user.repository.js';
import { UserValidator } from '../validation/user.validation.js';

/**
 * Provides user profile operations.
 */
@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly config: ConfigService,
        private readonly userValidator: UserValidator,
        private readonly passwordService: PasswordService
    ) { }


    /**
     * Returns all user as profile responses.
     */
    async getAllUsers(): Promise<UserDTO[]> {
        const users = await this.userRepository.findAll();
        return users.map(user => this.toDto(user));
    }

    /**
     * Returns the requested profile or throws if the user does not exist.
     */
    async getUserById(id: string): Promise<UserDTO> {
        const user = await this.findUserOrThrow(id);

        return this.toDto(user);
    }

    async createUser(dto: CreateUserDTO): Promise<UserDTO> {
        this.userValidator.ensureRegistrationEmail(dto.email);

        const existingUser = await this.userRepository.findByEmail(dto.email);
        this.userValidator.ensureEmailAvailable(existingUser);

        const passwordHash = await this.passwordService.hash(dto.password);
        const user = CreateUserMapper.toEntity(dto, passwordHash);

        const result = await this.userRepository.create(user);

        if (!result.success) {
            throw this.userValidator.emailAlreadyExists(dto.email);
        }

        return this.toDto(result.data);
    }


    /**
     * Loads a user and delegates the existence check to the validator.
     */
    private async findUserOrThrow(id: string): Promise<User> {
        const user = await this.userRepository.findById(id);

        return this.userValidator.requireUser(user, id);
    }

    /**
     * Maps an entity without exposing password hashes or storage metadata.
     */
    private toDto(user: User): UserDTO {
        return UserMapper.toDto(
            user,
            this.config.getOrThrow<string>('S3_PUBLIC_URL')
        );
    }


}