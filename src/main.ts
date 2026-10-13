import 'reflect-metadata';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import cookieParser from 'cookie-parser';

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

    const frontendOrigin = process.env.FRONTEND_ORIGIN;

    if (!frontendOrigin) {
        throw new Error('FRONTEND_ORIGIN is required');
    }

    app.enableCors({
        origin: frontendOrigin,
        credentials: true
    });

    app.enableCsrfProtection({
        trustedOrigins: [frontendOrigin]
    });

    app.use(cookieParser());

    app.enableShutdownHooks(); // Graceful shutdown hooks for the application
    await app.listen(8080);
}

await bootstrap();