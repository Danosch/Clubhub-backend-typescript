import type { User } from "../entity/user.entity.js";
import type { UserDTO } from '../dto/user.dto.js'

/**
 * Converts user entities into API response objects.
 */
export class UserMapper {

    /**
     * Maps basic profile fields and constructs the public avatar URL.
     * Password hashes and storage metadata are excluded.
     */
    static toDto(user: User, storagePublicUrl: string): UserDTO {
        let avatar: string | null = null;

        // Build an avatar URL only when both the bucket and object key are available.
        if (user.avatarBucket != null && user.avatarObject != null) {
            // Remove trailing slashes to avoid duplicate seperators in the URL.
            const baseUrl = storagePublicUrl.replace(/\/+$/, '');
            const bucket = encodeURIComponent(user.avatarBucket);
            // Encode each segment separately so spaces and special characters
            // are escaped while "/" separators in the object key are preserved
            const objectKey = user.avatarObject
                .split('/')
                .map(segment => encodeURIComponent(segment))
                .join('/');

            avatar = `${baseUrl}/${bucket}/${objectKey}`
        }
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            avatar,
            description: user.description,
            subject: user.subject ?? 'NONE'
        };
    }
}