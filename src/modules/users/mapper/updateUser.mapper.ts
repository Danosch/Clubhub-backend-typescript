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
    static toEntity(dto: UpdateUserDTO): Partial<Pick<User, 'email' | 'username' | 'description'>> {
        const entityData: Partial<Pick<User, 'email' | 'username' | 'description'>> = {};

        if (dto.email != null) {
            entityData.email = dto.email;
        }

        if (dto.username != null) {
            entityData.username = dto.username;
        }

        if (dto.description != null) {
            entityData.description = dto.description;
        }

        return entityData;
    }
}