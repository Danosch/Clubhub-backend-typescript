import { Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";

import { SessionRepository } from "../repository/session.repository.js";

/**
 * Creates, validates and revokes authenticaiton sessions.
 */
@Injectable()
export class SessionService {
    private static readonly TOKEN_TTL_SECONDS = 900;

    constructor(
        private readonly sessionRepository: SessionRepository
    ) { }

    /**
     * Creates a cryptographically random token and stores its association with the user for 15 minutes.
     */
    async createToken(userId: string): Promise<string> {
        const token = randomBytes(32).toString('hex');

        await this.sessionRepository.save(
            token,
            userId,
            SessionService.TOKEN_TTL_SECONDS
        );

        return token;
    }

    /**
     * Returns the associated user ID, or null if the token is unknown or its session has expired.
     */
    validateToken(token: string): Promise<string | null> {
        return this.sessionRepository.findUserIdByToken(token);
    }

    /**
     * Invalidates the session and reports whether it existed.
     */
    revokeToken(token: string): Promise<boolean> {
        return this.sessionRepository.deleteByToken(token);
    }

}