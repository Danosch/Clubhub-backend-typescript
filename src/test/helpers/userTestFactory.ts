import { randomUUID } from "crypto";
import { User } from "../../modules/users/entity/user.entity.js";


/**
 * Creates fresh user entities for database tests.
 */
export class UserTestFactory {

    /**
     * Builds an unsaved user with a unique email by default.
     * 
     * @param email Optional email for duplicated-email scenarios.
     * @returns A new user entity.
     */
    static create(email?: string): User {
        const domain = process.env.REGISTRATION_EMAIL_DOMAIN;

        if (!domain) {
            throw new Error(
                'REGISTRATION_EMAIL_DOMAIN is required for tests'
            );
        }

        const user = new User();

        user.email = email ?? `test-users-${randomUUID()}@${domain}`;
        user.username = 'integration-test';
        user.passwordHash = 'test-hash';
        user.avatarBucket = null;
        user.avatarEtag = null;
        user.avatarObject = null;
        user.description = null;
        user.subject = null;

        return user;
    }
}