import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { RedisService } from '../../../infrastructure/redis/redis.service.js';

/**
 * Stores authentication sessions in Redis with automatic expiration.
 */
@Injectable()
export class SessionRepository {
    constructor(
        private readonly redis: RedisService,
    ) { }

    /**
     * Stores the user ID associated with the token.
     * The session expires after the supplied number of seconds.
     */
    async save(
        token: string,
        userId: string,
        ttlSeconds: number,
    ): Promise<void> {
        await this.redis.client.set(
            this.createKey(token),
            userId,
            {
                expiration: {
                    type: 'EX',
                    value: ttlSeconds,
                },
            },
        );
    }

    /**
     * Returns the associated user ID, or null if the session
     * does not exist or has expired.
     */
    findUserIdByToken(token: string): Promise<string | null> {
        return this.redis.client.get(this.createKey(token));
    }

    /**
     * Removes the session and reports whether it existed.
     */
    async deleteByToken(token: string): Promise<boolean> {
        const deletedCount = await this.redis.client.del(
            this.createKey(token),
        );

        return deletedCount > 0;
    }

    /**
     * Builds a namespaced Redis key using the token's SHA-256 hash.
     * The original authentication token is not stored in Redis.
     */
    private createKey(token: string): string {
        const tokenHash = createHash('sha256')
            .update(token)
            .digest('hex');

        return `auth:session:${tokenHash}`;
    }

    /**
     * Extends the expiration of an existing session.
     * 
     * @param token The session token whose Redis key should be renewed.
     * @param ttlSeconds The new lifetime in seconds.
     * @returns Whether the session existed and its expiration was updated.
    */
    async extendExpiration(
        token: string,
        ttlSeconds: number
    ): Promise<boolean> {
        const updated = await this.redis.client.expire(
            this.createKey(token),
            ttlSeconds
        );

        return updated === 1;
    }




}