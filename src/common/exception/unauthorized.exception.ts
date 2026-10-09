import { HttpStatus } from "@nestjs/common";
import { ClubHubException } from "./clubhub.exception.js";
import { ErrorPayload } from "./errorPayload.js";

/**
 * Indicates missing or invalid authentication.
 */
export class UnauthorizedException extends ClubHubException {
    constructor(payload: ErrorPayload) {
        super(payload, HttpStatus.UNAUTHORIZED)
    }
}