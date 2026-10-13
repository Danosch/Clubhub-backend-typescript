import {
    IsEmail,
    IsString,
    Length,
    MaxLength,
} from 'class-validator';

/**
 * Contains the credentials supplied for login.
 */
export class LoginDTO {
    @IsEmail()
    @MaxLength(255)
    email!: string;

    @IsString()
    @Length(1, 128)
    password!: string;
}