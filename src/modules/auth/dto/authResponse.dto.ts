/**
 * Contains the authentication token returned to the client.
 */
export class AuthResponseDTO {
    constructor(
        public readonly token: string
    ) { }
}