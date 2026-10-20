import type { UpdateUserDTO } from "../dto/updateUser.dto.js";
import type { User } from "../entity/user.entity.js";

/**
 * Maps update requests to partial user entity data.
 */
export class UpdateUserMapper {

    /**
     * Maps supplied properties to their corresponding entity properties.
     * Omitted or null properties are excluded.
     */
    static toEntity(dto: UpdateUserDTO): Partial<Pick<User, 'username' | 'description' | 'subject'>> {
        const changes: Partial<
            Pick<User, 'username' | 'description' | 'subject'>
        > = {};

        if (dto.username != null) {
            changes.username = dto.username;
        }

        if (dto.description != null) {
            changes.description = dto.description;
        }

        if (dto.subject != null) {
            changes.subject = dto.subject;
        }

        return changes;
    }
}