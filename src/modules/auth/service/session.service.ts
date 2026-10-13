import { Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";

import { SessionRepository } from "../repository/session.repository.js";
import { SESSION_TTL_SECONDS } from "../auth.constants.js";

/**
 * Creates, validates and revokes authenticaiton sessions.
 */
@Injectable()
export class SessionService {

    constructor(
        private readonly sessionRepository: SessionRepository
    ) { }

    /**
     * Creates a random session token and stores if for the configured lifetime.
     * 
     * @param userId The ID of the user who owns the session.
     * @returns The token to send to the browser as a cookie.
     */
    async createToken(userId: string): Promise<string> {
        const token = randomBytes(32).toString('hex');

        await this.sessionRepository.save(
            token,
            userId,
            SESSION_TTL_SECONDS
        );

        return token;
    }

    /**
     * Looks up the user associated with an active session.
     * 
     * @param token The session token to validate.
     * @returns THe user ID, or null if the session is missing or expired.
     */
    validateToken(token: string): Promise<string | null> {
        return this.sessionRepository.findUserIdByToken(token);
    }

    /**
     * Revokes a session.
     * 
     * @param token The session token to revoke.
     * @returns Whether the session existed and was removed.
     */
    revokeToken(token: string): Promise<boolean> {
        return this.sessionRepository.deleteByToken(token);
    }

    /**
     * Renews an existing session for the configured lifetime.
     * 
     * @param token The token of the session to renew.
     * @returns Whether the session was still active.
     */
    refreshToken(token: string): Promise<boolean> {
        return this.sessionRepository.extendExpiration(
            token,
            SESSION_TTL_SECONDS
        );
    }

}