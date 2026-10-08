import { Injectable } from "@nestjs/common";

import { ClubHubErrorCode } from "../../../common/exception/clubHubErrorCode.js";
import { NotFoundException } from "../../../common/exception/notFound.exception.js";
import { ValidationException } from "../../../common/exception/validation.exception.js";

import type { User } from "../entity/user.entity.js";

/**
 * Enforces business rules for user operations.
 */
@Injectable()
export class UserValidator {

    /**
    * 
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

}