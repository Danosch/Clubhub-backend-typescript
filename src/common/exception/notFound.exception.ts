import { HttpStatus } from "@nestjs/common";
import { ClubHubException } from "./clubhub.exception.js";
import type { ErrorPayload } from "./errorPayload.js";

/**
 * Indicates that a requested resource does not exist.
 */
export class NotFoundException extends ClubHubException {
    constructor(payload: ErrorPayload) {
        super(payload, HttpStatus.NOT_FOUND)
    }
}