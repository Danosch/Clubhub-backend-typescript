import 'reflect-metadata';
import { after, afterEach, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';

import { TestDatabase } from '../../helpers/testDatabase.js';
import { UserTestFactory } from '../../helpers/userTestFactory.js';
import { UserService } from '../../../modules/users/service/user.service.js';
import { UserValidator } from '../../../modules/users/validation/user.validation.js';
import { PasswordService } from '../../../infrastructure/security/password.service.js';
import { NotFoundException } from '../../../common/exception/notFound.exception.js';
import { ValidationException } from '../../../common/exception/validation.exception.js';
import { ClubHubErrorCode } from '../../../common/exception/clubHubErrorCode.js';

/**
 * Tests user service operations against the test database.
 * Requires an initially empty users table and sequential execution.
 */
describe('UserService', () => {
    let database: TestDatabase;
    let service: UserService;
    let passwords: PasswordService;

    before(async () => {
        database = await TestDatabase.connect();

        const config = new ConfigService({
            S3_PUBLIC_URL: 'https://assets.example.test',
            PASSWORD_PEPPER: 'service-test-pepper',
        });

        passwords = new PasswordService(config);

        service = new UserService(
            database.users,
            config,
            new UserValidator(config),
            passwords,
        );
    });

    afterEach(async () => {
        if (database) {
            await database.cleanupUsers();
        }
    });

    after(async () => {
        if (database) {
            await database.close();
        }
    });

    describe('getUserById', () => {
        it('returns the requested user profile', async () => {
            // arrange
            const user = UserTestFactory.create();
            database.trackUser(user);
            await database.userEntityRepository.save(user);

            // act
            const result = await service.getUserById(user.id);

            // assert
            assert.deepEqual(result, {
                id: user.id,
                email: user.email,
                username: user.username,
                avatar: null,
                description: null,
                subject: 'NONE',
            });
        });

        it('throws when the user does not exist', async () => {
            // arrange
            const id = randomUUID();

            // act / assert
            await assert.rejects(
                () => service.getUserById(id),
                (error: unknown) =>
                    error instanceof NotFoundException &&
                    error.payload.errorCode === ClubHubErrorCode.USER_NOT_FOUND,
            );
        });
    });

    describe('getAllUsers', () => {
        it('returns all user profiles', async () => {
            // arrange
            const users = [
                UserTestFactory.create(),
                UserTestFactory.create(),
            ];

            for (const user of users) {
                database.trackUser(user);
            }

            await database.userEntityRepository.save(users);
            users.sort((a, b) => a.id.localeCompare(b.id));

            // act
            const result = await service.getAllUsers();

            // assert
            assert.deepEqual(
                result,
                users.map(user => ({
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    avatar: null,
                    description: null,
                    subject: 'NONE',
                })),
            );
        });

        it('returns an empty array when no users exist', async () => {
            // act
            const result = await service.getAllUsers();

            // assert
            assert.deepEqual(result, []);
        });
    });

    describe('createUser', () => {
        it('creates a user with a hashed password', async () => {
            // arrange
            const user = UserTestFactory.create();
            database.trackUser(user);

            const dto = {
                email: user.email,
                username: user.username,
                password: 'Test-password-123!',
            };

            // act
            const result = await service.createUser(dto);

            // assert
            const persisted =
                await database.users.findByEmailWithPasswordHash(dto.email);

            assert.ok(persisted);
            assert.notEqual(persisted.passwordHash, dto.password);
            assert.equal(
                await passwords.verify(dto.password, persisted.passwordHash),
                true,
            );

            assert.deepEqual(result, {
                id: persisted.id,
                email: dto.email,
                username: dto.username,
                avatar: null,
                description: null,
                subject: 'NONE',
            });
        });

        it('rejects an email that is already registered', async () => {
            // arrange
            const user = UserTestFactory.create();
            database.trackUser(user);
            await database.userEntityRepository.save(user);

            const dto = {
                email: user.email,
                username: 'another-user',
                password: 'Test-password-123!',
            };

            // act / assert
            await assert.rejects(
                () => service.createUser(dto),
                (error: unknown) =>
                    error instanceof ValidationException &&
                    error.payload.errorCode === ClubHubErrorCode.USER_ALREADY_EXISTS,
            );

            const count = await database.userEntityRepository.countBy({
                email: dto.email,
            });
            assert.equal(count, 1);
        });

        it('rejects an unsupported email domain', async () => {
            // arrange
            const user = UserTestFactory.create();
            user.email = user.email.replace('@', '@unsupported.');
            database.trackUser(user);

            const dto = {
                email: user.email,
                username: user.username,
                password: 'Test-password-123!',
            };

            // act / assert
            await assert.rejects(
                () => service.createUser(dto),
                (error: unknown) =>
                    error instanceof ValidationException &&
                    error.payload.errorCode === ClubHubErrorCode.INVALID_EMAIL,
            );

            const persisted = await database.users.findByEmail(dto.email);
            assert.equal(persisted, null);
        });
    });
});