import { Body, Controller, Cookies, HttpCode, HttpStatus, Post, Res } from "@nestjs/common";
import { AuthService } from "../service/auth.service.js";
import { CreateUserDTO } from "../../users/dto/createUser.dto.js";
import { LoginDTO } from "../dto/login.dto.js";
import { Public } from "../../../common/decorator/public.decorator.js";
import { SessionCookieService } from "../service/sessionCookie.service.js";
import { UserDTO } from "../../users/dto/user.dto.js";
import { SESSION_COOKIE_NAME } from "../auth.constants.js";

/**
 * Handles registration and authentication requests.
 */
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly sessionCookieService: SessionCookieService
    ) { }

    /**
     * Creates a user account without starting a session.
     * 
     * @param dto Validated registration data.
     * @returns HTTP 201 with the created user profile.
     */
    @Public()
    @Post('register')
    register(@Body() dto: CreateUserDTO): Promise<UserDTO> {
        return this.authService.register(dto);

    }
    /**
     * Authenticates a user and sets the session cookie.
     * 
     * @param dto The login credentials
     * @param response the HTTP response used to set the cookie.
     * @returns HTTP 204 without a response body.
     * @throws {UnauthorizedException} If the credentials are invalid.
     */
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.NO_CONTENT)
    async login(@Body() dto: LoginDTO,
        @Res({ passthrough: true }) response: unknown): Promise<void> {
        const token = await this.authService.login(dto);
        this.sessionCookieService.setSessionCookie(response, token);
    }

    /**
     * Revokes the current session and removes its browser cookie.
     * 
     * @param token The session token from the cookie, if present.
     * @param reponse The HTTP response used to clear the cookie.
     * @returns HTTP 204 without a response body.
     */
    @Public()
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(
        @Cookies(SESSION_COOKIE_NAME) token: string | undefined,
        @Res({ passthrough: true }) response: unknown): Promise<void> {
        await this.authService.logout(token);
        this.sessionCookieService.clearSessionCookie(response);
    }

    /**
     * Renews the current session and updated its browser cookie.
     * 
     * @param token The token from the session cookie. 
     * @param response The HTTP response used to update the cookie.
     * @returns HTTP 204 with an updated Set-Cookie header.
     * @throws {UnauthorizedException} If the session is missing or expired.
     */
    @Post('refresh')
    @HttpCode(HttpStatus.NO_CONTENT)
    async refresh(
        @Cookies(SESSION_COOKIE_NAME) token: string | undefined,
        @Res({ passthrough: true }) response: unknown
    ): Promise<void> {
        const renewedToken = await this.authService.refresh(token);
        this.sessionCookieService.setSessionCookie(response, renewedToken);
    }
}