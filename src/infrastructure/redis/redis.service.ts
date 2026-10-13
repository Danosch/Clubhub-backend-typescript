import { Injectable, Logger } from '@nestjs/common';
import type {
    OnApplicationShutdown,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

/**
 * Manages the Redis connection throughout the application lifecycle.
 */
@Injectable()
export class RedisService
    implements OnModuleInit, OnApplicationShutdown {
    private readonly logger = new Logger(RedisService.name);

    readonly client: ReturnType<typeof createClient>;

    constructor(config: ConfigService) {
        this.client = createClient({
            socket: {
                host: config.getOrThrow<string>('REDIS_HOST'),
                port: Number(
                    config.getOrThrow<string>('REDIS_PORT'),
                ),
            },
            password: config.getOrThrow<string>('REDIS_PASSWORD'),
        });

        this.client.on('error', (error: Error) => {
            this.logger.error('Redis connection error.', error.stack);
        });
    }

    /**
     * Opens the connection during application initialization.
     */
    async onModuleInit(): Promise<void> {
        await this.client.connect();

        this.logger.log('Redis connection established.');
    }

    /**
     * Closes the connection when the application shuts down.
     */
    async onApplicationShutdown(): Promise<void> {
        if (this.client.isOpen) {
            await this.client.close();
        }
    }
}