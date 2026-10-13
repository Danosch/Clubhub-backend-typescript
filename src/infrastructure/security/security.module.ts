import { Module } from '@nestjs/common';

import { PasswordService } from './password.service.js';

/**
 * Provides shared password hashing and verification.
 */
@Module({
    providers: [
        PasswordService,
    ],
    exports: [
        PasswordService,
    ],
})
export class SecurityModule { }