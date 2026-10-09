import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService } from "../service/auth.service.js";
import { CreateUserDTO } from "../../users/dto/createUser.dto.js";
import { AuthResponseDTO } from "../dto/authResponse.dto.js";
import { LoginDTO } from "../dto/login.dto.js";

/**
 * Handles registration and authentication requests.
 */
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    /**
     * Registers a user and creates an authentication session.
     * @returns HTTP 201 with the authentication token.    
    */
    @Post('register')
    register(@Body() dto: CreateUserDTO): Promise<AuthResponseDTO> {
        return this.authService.register(dto);

    }
    /**
     * Authenticates a user and creates an authentication session.
     * Responds with HTTP 401 if the credentials are invalid.
     *
     * @returns HTTP 200 with the authentication token.
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: LoginDTO): Promise<AuthResponseDTO> {
        return this.authService.login(dto);
    }
}