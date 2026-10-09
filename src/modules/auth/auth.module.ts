import { Module } from '@nestjs/common';

import { RedisModule } from '../../infrastructure/redis/redis.module.js';
import { UserModule } from '../users/user.module.js';
import { AuthController } from './control/auth.controller.js';
import { SessionRepository } from './repository/session.repository.js';
import { AuthService } from './service/auth.service.js';
import { SessionService } from './service/session.service.js';
import { SecurityModule } from '../../infrastructure/security/security.module.js';
import { AuthValidator } from './validation/auth.validation.js';

/**
 * Registers the components required for authentication.
 */
@Module({
    imports: [
        UserModule,
        RedisModule,
        SecurityModule
    ],
    controllers: [
        AuthController,
    ],
    providers: [
        AuthService,
        AuthValidator,
        SessionService,
        SessionRepository,
    ],
})
export class AuthModule { }