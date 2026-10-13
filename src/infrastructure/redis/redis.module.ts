import { Module } from '@nestjs/common';
import { RedisService } from './redis.service.js';

/**
 * Provides the shared Redis connection to importing modules.
 */
@Module({
    providers: [RedisService],
    exports: [RedisService],
})
export class RedisModule { }