import 'reflect-metadata';

import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { User } from '../../modules/users/entity/user.entity.js';

const config = new ConfigService();

/**
 * Provides database configuration for the TypeORM CLI.
 */
export default new DataSource({
    type: 'postgres',
    host: config.getOrThrow<string>('POSTGRES_HOST'),
    port: Number(config.getOrThrow<string>('POSTGRES_PORT')),
    username: config.getOrThrow<string>('POSTGRES_USER'),
    password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
    database: config.getOrThrow<string>('POSTGRES_DB'),
    entities: [User],
    synchronize: false,
    migrationsRun: false,
});