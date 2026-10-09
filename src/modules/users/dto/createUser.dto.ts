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
    @Length(15, 128)
    password!: string;

}