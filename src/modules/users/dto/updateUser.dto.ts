import {
    IsEmail,
    IsOptional,
    IsString,
    Length,
    MaxLength
} from 'class-validator'

/**
 * Contains the editable fields of a user profile.
 * 
 * Omitted or null fields leave the existing values unchanged.
 */
export class UpdateUserDTO {
    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    email?: string | null;

    @IsOptional()
    @IsString()
    @Length(1, 100)
    username?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(1024)
    description?: string | null;
}