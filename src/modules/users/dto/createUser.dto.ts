import {
    IsEmail,
    IsString,
    Length,
    Matches,
    MaxLength
} from 'class-validator';

/**
 * Contains the credentials required to create a user.
 */
export class CreateUserDTO {

    @IsEmail()
    @MaxLength(255)
    email!: string;

    @IsString()
    @Length(1, 100)
    @Matches(/\S/, {
        message: 'username must contain a non-whitepsace character'
    })
    username!: string;

    @IsString()
    // Development: allow passwords with at least 6 characters.
    // Production: change the minimum to 15 before deployment
    @Length(6, 128)
    password!: string;

}