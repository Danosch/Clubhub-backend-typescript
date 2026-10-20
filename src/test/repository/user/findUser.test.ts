import 'reflect-metadata';
import { TestDatabase } from '../../helpers/testDatabase.js';
import type { User } from '../../../modules/users/entity/user.entity.js';
import { UserTestFactory } from '../../helpers/userTestFactory.js';
import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';
import { randomUUID } from 'crypto';


// Defines a lookup method and its expected password hash visibility.
interface UserLookupTestCase {
    name: string;
    find: (user: User) => Promise<User | null>;
    includesPasswordHash: boolean;
}

/**
 * Tests user lookup queries against the test database.
 * Requires an initially empty users table and squential execution.
 */
describe('UserRepository find queries', () => {
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

    // Each lookup runs the same test with its own query and expectations.
    const lookupCases: UserLookupTestCase[] = [
        {
            name: 'findById',
            find: (user) => database.users.findById(user.id),
            includesPasswordHash: false
        },
        {
            name: 'findByEmail',
            find: (user) => database.users.findByEmail(user.email),
            includesPasswordHash: false

        },
        {
            name: 'findByEmailWithPasswordHash',
            find: (user) =>
                database.users.findByEmailWithPasswordHash(user.email),
            includesPasswordHash: true
        }
    ];

    for (const { name, find, includesPasswordHash } of lookupCases) {
        describe(name, () => {
            it('returns the matching user', async () => {
                // arrange
                const user = UserTestFactory.create();
                const otherUser = UserTestFactory.create();

                database.trackUser(user);
                database.trackUser(otherUser);
                await database.userEntityRepository.save([otherUser, user]);

                // act
                const result = await find(user);

                // assert
                assert.ok(result);
                assert.equal(result.id, user.id);
                assert.equal(result.email, user.email);
                assert.equal(result.username, user.username);
            });

            it('returns null when the user does not exist', async () => {
                // arrange
                const existingUser = UserTestFactory.create();
                database.trackUser(existingUser);
                await database.userEntityRepository.save(existingUser);

                const missingUser = UserTestFactory.create();
                missingUser.id = randomUUID();

                // act
                const result = await find(missingUser);

                // assert
                assert.equal(result, null);

            });

            it(
                includesPasswordHash
                    ? 'loads the password hash'
                    : 'does not load the password hash',
                async () => {
                    // arrange
                    const user = UserTestFactory.create();
                    database.trackUser(user);
                    await database.userEntityRepository.save(user);

                    // act
                    const result = await find(user);

                    // assert
                    assert.ok(result);
                    assert.equal(
                        result.passwordHash,
                        includesPasswordHash ? user.passwordHash : undefined
                    );

                }
            );
        });
    }

    it('returns all users ordered by ID ascending', async () => {
        // arrange
        const users = Array.from({ length: 3 }, () => {
            const user = UserTestFactory.create();
            user.id = randomUUID();
            database.trackUser(user);
            return user;
        });

        users.sort((a, b) => a.id.localeCompare(b.id));
        // Insert in reverse ID order to verify that findAll sorts its result.
        await database.userEntityRepository.save([...users].reverse());

        // act
        const result = await database.users.findAll();

        // assert
        assert.deepEqual(
            result.map(user => user.id),
            users.map(user => user.id)
        );


    });

    it('returns empty array if no users exist', async () => {
        // act
        const result = await database.users.findAll();

        // assert | side fact in java is the asser.equals method (expected, actual). 
        assert.deepStrictEqual(result, []);
    });


});