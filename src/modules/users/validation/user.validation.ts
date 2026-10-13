import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ClubHubErrorCode } from "../../../common/exception/clubHubErrorCode.js";
import { NotFoundException } from "../../../common/exception/notFound.exception.js";
import { ValidationException } from "../../../common/exception/validation.exception.js";

import type { User } from "../entity/user.entity.js";

/**
 * Enforces business rules for user operations.
 */
@Injectable()
export class UserValidator {

    private readonly registrationEmailDomain: string;

    constructor(config: ConfigService) {
        this.registrationEmailDomain =
            config.getOrThrow<string>('REGISTRATION_EMAIL_DOMAIN');
    }

    /**
    * Returns the user or throws if the requested user does not exist.
    */
    requireUser(user: User | null, id: string): User {
        if (user == null) {
            throw this.userNotFound(id);
        }
        return user;
    }

    /**
     * Creates the error used when a user does not exist.
     */
    userNotFound(id: string): NotFoundException {
        return new NotFoundException({
            errorCode: ClubHubErrorCode.USER_NOT_FOUND,
            title: 'User not found',
            details: `No user with id ${id} exists.`,
            messageParameters: {
                userId: id
            },
            sourcePointer: 'userId'
        });
    }

    /**
     * Creates the error used for conflicting email addresses.
     */
    emailAlreadyExists(email: string): ValidationException {
        return new ValidationException({
            errorCode: ClubHubErrorCode.USER_ALREADY_EXISTS,
            title: 'User already exists',
            details: 'A user with this email already exists.',
            messageParameters: {
                email
            },
            sourcePointer: 'email'
        });
    }

    /**
     * Ensures that an email is not assigned to another user.
     * 
     * @throws {ValidationException} If the email belongs to another user.
     */
    ensureEmailAvailable(existingUser: User | null): void {
        if (existingUser !== null) {
            throw this.emailAlreadyExists(existingUser.email)
        }
    }

    ensureRegistrationEmail(email: string): void {
        const requiredSuffix = `@${this.registrationEmailDomain}`;

        if (!email.endsWith(requiredSuffix)) {
            throw new ValidationException({
                errorCode: ClubHubErrorCode.INVALID_EMAIL,
                title: 'Invalid email',
                details: `Email must end with ${requiredSuffix}.`,
                messageParameters: {
                    email
                },
                sourcePointer: 'email'
            });
        }
    }
}