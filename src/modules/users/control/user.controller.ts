import { Body, Controller, Get, Param, Patch, ParseUUIDPipe } from "@nestjs/common";
import type { UserDTO } from "../dto/user.dto.js";
import { UserService } from "../service/user.service.js";
import { CurrentUserId } from "../../../common/decorator/currentUserId.decorator.js";
import { UpdateUserDTO } from "../dto/updateUser.dto.js";

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
     * Returns the profile associated with the authenticated session.
     */
    @Get('me')
    getCurrentUser(
        @CurrentUserId() userId: string): Promise<UserDTO> {
        return this.userService.getUserById(userId);
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

    /**
     * Partially updates the authenticated user's profile.
     * 
     * @param id Id of the user to update.
     * @param dto Validated profile changes
     * @param CurrentUserId User ID provided by the authenticated guard.
     * @returns HTTP 200 with the updated public profile.
     */
    @Patch(':id')
    updateUser(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateUserDTO,
        @CurrentUserId() currentUserId: string
    ): Promise<UserDTO> {
        return this.userService.updateUser(id, dto, currentUserId);
    }

}