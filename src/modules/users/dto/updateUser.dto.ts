import {
    IsOptional,
    IsString,
    Length,
    MaxLength,
    Matches,
    IsEnum
} from 'class-validator'
import { Subject } from '../enum/subject.enum.js';

/**
 * Contains the editable fields of a user profile.
 * 
 * Omitted or null fields leave the existing values unchanged.
 */
export class UpdateUserDTO {

    @IsOptional()
    @IsString()
    @Length(1, 100)
    @Matches(/\S/, {
        message: 'username must contain a non-whitespace character'
    })
    username?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(1024)
    description?: string | null;

    @IsOptional()
    @IsEnum(Subject)
    subject?: Subject | null;
}