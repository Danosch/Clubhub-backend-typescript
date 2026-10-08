import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, type Repository } from 'typeorm';

import type { ActionResponseDTO } from '../../../common/dto/actionResponse.dto.js';
import { ClubHubErrorCode } from '../../../common/exception/clubHubErrorCode.js';
import { NotFoundException } from '../../../common/exception/notFound.exception.js';
import { ValidationException } from '../../../common/exception/validation.exception.js';

import { UpdateUserDTO } from '../dto/updateUser.dto.js';
import type { UserDTO } from '../dto/user.dto.js';
import { User } from '../entity/user.entity.js';
import { UserMapper } from '../mapper/user.mapper.js';
import { UpdateUserMapper } from '../mapper/updateUser.mapper.js';

/**
 * Provides user profile operations.
 */
@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly config: ConfigService,
    ) { }


    /**
     * Returns all user as profile responses.
     */
    async getAll(): Promise<UserDTO[]> {
        const users = await this.userRepository.find({
            order: { id: 'ASC' }
        });
        return users.map(user => this.toDto(user));
    }

    /**
     * Loads a user and maps it to a profile response.
     * 
     * @param id The user's UUID
     * @returns The requested user profile.
     * @throws {NotFoundException} If the user does not exist.
     * 
     */
    async getById(id: string): Promise<UserDTO> {
        const user = await this.userRepository.findOneBy({ id });

        if (user == null) {
            throw new NotFoundException({
                errorCode: ClubHubErrorCode.USER_NOT_FOUND,
                title: 'User not Found',
                details: `No user with id ${id} exists.`,
                messageParameters: {
                    userId: id,
                },
                sourcePointer: 'userId'
            });
        }

        return UserMapper.toDto(
            user,
            this.config.getOrThrow<string>('S3_PUBLIC_URL')
        );
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