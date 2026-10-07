import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import type { HealthCheckResult } from '@nestjs/terminus';

/**
 * Provides health check endpoints for the application liveness and readiness.
 */
@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private database: TypeOrmHealthIndicator,
    ) { }

    /**
     * Checks whether the application can respond to HTTP requests.
     * 
     * @returns HTTP 200 with an "ok" status
     */
    @Get('live')
    live(): { status: 'ok' } {
        return { status: 'ok' };
    }

    /**
     * Checks the PostgreSQL database connection by executing SELECT 1.
     * The check has a timeout of 1500 ms.
     * 
     * @returns The health check result when the check succeeds, or an error when the check fails.
     */
    @Get('ready')
    @HealthCheck()
    ready(): Promise<HealthCheckResult> {
        return this.health.check([
            () => this.database.pingCheck('database', { timeout: 1500 }),
        ]);
    }
}