import { Injectable } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "../auth.constants.js";



@Injectable()
export class SessionCookieService {
    constructor(
        private readonly adapterHost: HttpAdapterHost
    ) { }

    setSessionCookie(response: unknown, token: string): void {
        this.adapterHost.httpAdapter.setCookie(
            response,
            SESSION_COOKIE_NAME,
            token,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/api',
                maxAge: SESSION_TTL_SECONDS
            }
        );
    }

    clearSessionCookie(response: unknown): void {
        this.adapterHost.httpAdapter.clearCookie(
            response,
            SESSION_COOKIE_NAME,
            { path: '/api' }
        );
    }
}