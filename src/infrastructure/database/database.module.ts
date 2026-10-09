import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { fileURLToPath } from 'node:url';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.getOrThrow<string>('POSTGRES_HOST'),
                port: Number(config.getOrThrow<number>('POSTGRES_PORT')),
                username: config.getOrThrow<string>('POSTGRES_USER'),
                password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
                database: config.getOrThrow<string>('POSTGRES_DB'),
                autoLoadEntities: true,
                synchronize: false, // Set to false we will use migrations to manage the database schema
                migrations: [
                    fileURLToPath(
                        new URL('./migrations/[0-9]*-*.js', import.meta.url)
                    )
                ],
                migrationsRun: true
            }),
        }),
    ],
})
export class DatabaseModule { }