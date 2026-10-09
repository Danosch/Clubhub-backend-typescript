import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, type Repository } from 'typeorm';
import { ClubHubErrorCode } from '../../../common/exception/clubHubErrorCode.js';

import { User } from '../entity/user.entity.js';

/**
 * Represents a successful creation or an email conflict.
 */
export type UserCreateResult =
    | { success: true; data: User }
    | {
        success: false;
        errorCode: ClubHubErrorCode.USER_ALREADY_EXISTS;
    };

/**
 * Provides database access for users.
 */
@Injectable()
export class UserRepository {
    constructor(
        @InjectRepository(User)
        private readonly repository: Repository<User>,
    ) { }

    /**
     * Returns all users ordered by their IDs.
     */
    findAll(): Promise<User[]> {
        return this.repository.find({
            order: { id: 'ASC' },
        });
    }

    /**
     * Returns the user with the given ID, or null.
     */
    findById(id: string): Promise<User | null> {
        return this.repository.findOneBy({ id });
    }

    /**
     * Returns the user with the given email, or null.
     */
    findByEmail(email: string): Promise<User | null> {
        return this.repository.findOneBy({ email });
    }

    /**
     * Loads a user including the password hash for authentication.
     * Returns null if the email is not registered.
     */
    findByEmailWithPasswordHash(email: string): Promise<User | null> {
        return this.repository
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('user.email = :email', { email })
            .getOne();
    }

    /**
     * Persists a new user and identifies duplicate email conflicts.
     * Unexpected database errors are propagated to the caller.
     */
    async create(user: User): Promise<UserCreateResult> {
        try {
            const savedUser = await this.repository.save(user);

            return {
                success: true,
                data: savedUser,
            };
        } catch (error: unknown) {
            if (
                error instanceof QueryFailedError &&
                'code' in error.driverError &&
                error.driverError.code === '23505' &&
                'constraint' in error.driverError &&
                error.driverError.constraint === 'users_email_key'
            ) {
                return {
                    success: false,
                    errorCode: ClubHubErrorCode.USER_ALREADY_EXISTS,
                };
            }

            throw error;
        }
    }
}