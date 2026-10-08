import { HttpStatus } from "@nestjs/common";
import { ClubHubException } from "./clubhub.exception.js";
import type { ErrorPayload } from "./errorPayload.js";

/**
 * Indicates that input violates an application rule.
 */
export class ValidationException extends ClubHubException {
    constructor(payload: ErrorPayload) {
        super(payload, HttpStatus.BAD_REQUEST)
    }
}