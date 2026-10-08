import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import type { UserDTO } from "../dto/user.dto.js";
import { UserService } from "../service/user.service.js";

/**
 * Handles HTTP requests for user profiles.
 */
@Controller('users')
export class UserController {
    constructor(
        private readonly userService: UserService,
    ) { }

    /**
     * 
     */
    @Get(':id')
    getById(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<UserDTO> {
        return this.userService.getById(id);
    }
}