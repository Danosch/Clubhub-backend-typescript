import { HttpException, HttpStatus } from "@nestjs/common";
import type { ErrorPayload } from "./errorPayload.js";

/**
 * Base class for application exceptions with structured error payloads.
 */
export abstract class ClubHubException extends HttpException {
    protected constructor(
        public readonly payload: ErrorPayload,
        status: HttpStatus,
    ) {
        super(payload, status);
        this.message = payload.title;
    }
}