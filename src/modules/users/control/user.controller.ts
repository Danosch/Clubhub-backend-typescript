import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from "@nestjs/common";
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
     * Returns all user profiles without password hashes or storage metadata
     * 
     * @returns HTTP 200 with the profiles, or an empty array if no users exist.
     */
    @Get()
    getAllUsers(): Promise<UserDTO[]> {
        return this.userService.getAllUsers();
    }


    /**
     * Returns the profile associated with the given user ID.
     * Responds with HTTP 400 for an invalid UUID and HTTP 404, if the user does not exist.
     */
    @Get(':id')
    getUserById(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<UserDTO> {
        return this.userService.getUserById(id);
    }

}