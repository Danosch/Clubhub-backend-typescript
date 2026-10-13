/**
 * Contains the basic user profile data returned by the API.
 */
export class UserDTO {
    id!: string;
    email!: string;
    username!: string;
    description!: string | null;
    avatar!: string | null
    subject!: string;
}