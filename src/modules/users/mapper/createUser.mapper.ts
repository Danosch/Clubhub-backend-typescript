import type { CreateUserDTO } from "../dto/createUser.dto.js";
import { User } from "../entity/user.entity.js";

/**
 * Maps user creation data to a new user entity.
 */
export class CreateUserMapper {

    /**
     * Creates an entity using an already hashed password.
     */
    static toEntity(dto: CreateUserDTO, passwordHash: string): User {
        const user = new User();

        user.email = dto.email;
        user.username = dto.username;
        user.passwordHash = passwordHash;

        user.description = null;
        user.subject = null;
        user.avatarBucket = null;
        user.avatarObject = null;
        user.avatarEtag = null;

        return user;
    }
}