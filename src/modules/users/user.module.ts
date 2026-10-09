import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PasswordService } from '../../infrastructure/security/password.service.js';
import { UserController } from './control/user.controller.js';
import { User } from './entity/user.entity.js';
import { UserRepository } from './repository/user.repository.js';
import { UserService } from './service/user.service.js';
import { UserValidator } from './validation/user.validation.js';
import { SecurityModule } from '../../infrastructure/security/security.module.js';

/**
 * Registers the components required for user operations.
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        SecurityModule
    ],
    controllers: [
        UserController,
    ],
    providers: [
        UserRepository,
        UserService,
        UserValidator,
    ],
    exports: [
        UserService,
        UserRepository
    ],
})
export class UserModule { }