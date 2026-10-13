import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { UserModule } from './modules/users/user.module.js';
import { RedisModule } from './infrastructure/redis/redis.module.js';
import { AuthModule } from './modules/auth/auth.module.js';



@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        DatabaseModule,
        HealthModule,
        UserModule,
        RedisModule,
        AuthModule
    ],
})
export class AppModule { }