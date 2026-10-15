import { after, afterEach, before, describe, it } from 'node:test';
import 'reflect-metadata';
import { TestDatabase } from '../../helpers/testDatabase.js';
import { UserTestFactory } from '../../helpers/userTestFactory.js';
import assert from 'node:assert/strict';
import { ClubHubErrorCode } from '../../../common/exception/clubHubErrorCode.js';



describe('UserRepository.create', () => {
    let database: TestDatabase;

    before(async () => {
        database = await TestDatabase.connect();
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

    it('persist a new user', async () => {
        // arrange
        const user = UserTestFactory.create();
        database.trackUser(user);

        // act
        const result = await database.users.create(user);
        assert.ok(result.success);

        const persisted = await database.userEntityRepository.findOneBy({
            email: user.email
        });

        // assert
        assert.ok(persisted);
        assert.equal(persisted.id, user.id);
        assert.equal(persisted.email, user.email);
        assert.equal(persisted.username, user.username);
    });

    it('returns a duplicated-email result without creating another user', async () => {
        // arrange
        const existingUser = UserTestFactory.create();
        database.trackUser(existingUser);
        await database.userEntityRepository.save(existingUser);

        // act
        const duplicatedUser = UserTestFactory.create(existingUser.email);

        const result = await database.users.create(duplicatedUser);

        // assert
        assert.deepEqual(result, {
            success: false,
            errorCode: ClubHubErrorCode.USER_ALREADY_EXISTS
        });

        const count = await database.userEntityRepository.countBy({
            email: existingUser.email
        });
        assert.equal(count, 1);
    });
});