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
import { Subject } from '../../../modules/users/enum/subject.enum.js';
import { ForbiddenException } from '../../../common/exception/forbidden.exception.js';
import { NotFoundException } from '../../../common/exception/notFound.exception.js';
import { ClubHubErrorCode } from '../../../common/exception/clubHubErrorCode.js';
import type { UpdateUserDTO } from '../../../modules/users/dto/updateUser.dto.js';

/** Tests profile updates, ownership checks and missing users. */
describe('UserService.updateUser', () => {
    let database: TestDatabase;
    let service: UserService;

    before(async () => {
        database = await TestDatabase.connect();

        const config = new ConfigService({
            S3_PUBLIC_URL: 'https://assets.example.test',
            PASSWORD_PEPPER: 'service-test-pepper',
        });

        service = new UserService(
            database.users,
            config,
            new UserValidator(config),
            new PasswordService(config),
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

    it('updates the editable profile fields', async () => {
        // arrange
        const user = UserTestFactory.create();
        database.trackUser(user);
        await database.userEntityRepository.save(user);

        const dto: UpdateUserDTO = {
            username: 'updated-user',
            description: 'Updated description',
            subject: Subject.COMPUTER_SCIENCE,
        };

        // act
        const result = await service.updateUser(user.id, dto, user.id);

        // assert
        assert.equal(result.id, user.id);
        assert.equal(result.username, dto.username);
        assert.equal(result.description, dto.description);
        assert.equal(result.subject, dto.subject);
        assert.equal('passwordHash' in result, false);

        const persisted = await database.users.findById(user.id);
        assert.ok(persisted);
        assert.equal(persisted.username, dto.username);
        assert.equal(persisted.description, dto.description);
        assert.equal(persisted.subject, dto.subject);
    });

    it('updates the username without changing other profile fields', async () => {
        // arrange
        const user = UserTestFactory.create();
        user.description = 'Existing description';
        user.subject = Subject.LAW;

        database.trackUser(user);
        await database.userEntityRepository.save(user);

        // act
        const result = await service.updateUser(
            user.id,
            { username: 'updated-user' },
            user.id,
        );

        // assert
        assert.equal(result.username, 'updated-user');
        assert.equal(result.description, user.description);
        assert.equal(result.subject, user.subject);

        const persisted = await database.users.findByEmailWithPasswordHash(
            user.email,
        );
        assert.ok(persisted);
        assert.equal(persisted.username, 'updated-user');
        assert.equal(persisted.description, user.description);
        assert.equal(persisted.subject, user.subject);
        assert.equal(persisted.email, user.email);
        assert.equal(persisted.passwordHash, user.passwordHash);
    });

    it('resets description and subject without changing the username', async () => {
        // arrange
        const user = UserTestFactory.create();
        user.description = 'Existing description';
        user.subject = Subject.LAW;

        database.trackUser(user);
        await database.userEntityRepository.save(user);

        // act
        const result = await service.updateUser(
            user.id,
            {
                description: '',
                subject: Subject.NONE,
            },
            user.id,
        );

        // assert
        assert.equal(result.username, user.username);
        assert.equal(result.description, '');
        assert.equal(result.subject, Subject.NONE);

        const persisted = await database.users.findById(user.id);
        assert.ok(persisted);
        assert.equal(persisted.username, user.username);
        assert.equal(persisted.description, '');
        assert.equal(persisted.subject, Subject.NONE);
    });

    // Both cases must preserve the existing profile values.
    const unchangedCases: {
        name: string;
        dto: UpdateUserDTO;
    }[] = [
            {
                name: 'omitted fields',
                dto: {},
            },
            {
                name: 'null fields',
                dto: {
                    username: null,
                    description: null,
                    subject: null,
                },
            },
        ];

    for (const { name, dto } of unchangedCases) {
        it(`preserves existing values for ${name}`, async () => {
            // arrange
            const user = UserTestFactory.create();
            user.description = 'Existing description';
            user.subject = Subject.LAW;

            database.trackUser(user);
            await database.userEntityRepository.save(user);

            // act
            const result = await service.updateUser(user.id, dto, user.id);

            // assert
            assert.equal(result.username, user.username);
            assert.equal(result.description, user.description);
            assert.equal(result.subject, user.subject);

            const persisted = await database.users.findById(user.id);
            assert.ok(persisted);
            assert.equal(persisted.username, user.username);
            assert.equal(persisted.description, user.description);
            assert.equal(persisted.subject, user.subject);
        });
    }

    it('rejects changes to another user', async () => {
        // arrange
        const user = UserTestFactory.create();
        const currentUser = UserTestFactory.create();

        database.trackUser(user);
        database.trackUser(currentUser);
        await database.userEntityRepository.save([user, currentUser]);

        // act / assert
        await assert.rejects(
            () => service.updateUser(
                user.id,
                { username: 'updated-user' },
                currentUser.id,
            ),
            (error: unknown) =>
                error instanceof ForbiddenException &&
                error.payload.errorCode === ClubHubErrorCode.USER_ACCESS_DENIED,
        );

        const persisted = await database.users.findById(user.id);
        assert.ok(persisted);
        assert.equal(persisted.username, user.username);
    });

    it('throws when the user does not exist', async () => {
        // arrange
        const id = randomUUID();

        // act / assert
        await assert.rejects(
            () => service.updateUser(
                id,
                { username: 'updated-user' },
                id,
            ),
            (error: unknown) =>
                error instanceof NotFoundException &&
                error.payload.errorCode === ClubHubErrorCode.USER_NOT_FOUND,
        );
    });
});