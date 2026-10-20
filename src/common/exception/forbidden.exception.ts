import { HttpStatus } from "@nestjs/common";
import { ClubHubException } from "./clubhub.exception.js";
import { ErrorPayload } from "./errorPayload.js";

export class ForbiddenException extends ClubHubException {
    constructor(payload: ErrorPayload) {
        super(payload, HttpStatus.FORBIDDEN);
    }
}