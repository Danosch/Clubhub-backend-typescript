import 'reflect-metadata';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('api', {
        exclude: [
            { path: 'health/live', method: RequestMethod.GET },
            { path: 'health/ready', method: RequestMethod.GET }
        ]
    });

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true
        })
    );
    app.enableCors({
        origin: 'http://localhost:3000'
    })
    app.enableShutdownHooks(); // Graceful shutdown hooks for the application
    await app.listen(8080);
}

await bootstrap();