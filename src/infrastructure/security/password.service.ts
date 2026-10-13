import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    createHmac,
    randomBytes,
    scrypt,
    timingSafeEqual,
} from 'node:crypto';

const HASH_FORMAT = 'scrypt-hmac-sha256-v1';

const SCRYPT_OPTIONS = {
    N: 131072,
    r: 8,
    p: 1,
    maxmem: 256 * 1024 * 1024,
};

/**
 * Creates and verifies password hashes using scrypt and a pepper.
 */
@Injectable()
export class PasswordService {
    private readonly pepper: string;

    constructor(config: ConfigService) {
        this.pepper = config.getOrThrow<string>('PASSWORD_PEPPER');

        if (this.pepper.trim().length === 0) {
            throw new Error('PASSWORD_PEPPER must not be empty.');
        }
    }

    /**
     * Creates a salted scrypt hash protected with HMAC-SHA256.
     */
    async hash(password: string): Promise<string> {
        const salt = randomBytes(16);
        const protectedHash = await this.deriveProtectedHash(
            password,
            salt,
        );

        return [
            HASH_FORMAT,
            SCRYPT_OPTIONS.N,
            SCRYPT_OPTIONS.r,
            SCRYPT_OPTIONS.p,
            salt.toString('hex'),
            protectedHash.toString('hex'),
        ].join('$');
    }

    /**
     * Verifies a password against a stored hash.s
     * Returns false for incorrect passwords or unsupported hash formats.
     */
    async verify(
        password: string,
        storedHash: string | null,
    ): Promise<boolean> {
        if (storedHash === null) {
            await this.deriveProtectedHash(password, Buffer.alloc(16));
            return false;
        }
        const parts = storedHash.split('$');

        const [
            format,
            cost,
            blockSize,
            parallelization,
            saltHex,
            hashHex,
        ] = parts;

        // Validate the supported format before decoding or deriving a key.
        if (
            parts.length !== 6 ||
            format !== HASH_FORMAT ||
            cost !== String(SCRYPT_OPTIONS.N) ||
            blockSize !== String(SCRYPT_OPTIONS.r) ||
            parallelization !== String(SCRYPT_OPTIONS.p) ||
            typeof saltHex !== 'string' ||
            typeof hashHex !== 'string' ||
            !/^[0-9a-f]{32}$/i.test(saltHex) ||
            !/^[0-9a-f]{64}$/i.test(hashHex)
        ) {
            return false;
        }

        const salt = Buffer.from(saltHex, 'hex');
        const expectedHash = Buffer.from(hashHex, 'hex');

        const actualHash = await this.deriveProtectedHash(
            password,
            salt,
        );

        return timingSafeEqual(actualHash, expectedHash);
    }

    /**
     * Derives a scrypt key and protects it with the configured pepper.
     */
    private async deriveProtectedHash(
        password: string,
        salt: Buffer,
    ): Promise<Buffer> {
        const derivedKey = await new Promise<Buffer>((resolve, reject) => {
            scrypt(
                password,
                salt,
                64,
                SCRYPT_OPTIONS,
                (error, key) => {
                    if (error !== null) {
                        reject(error);
                        return;
                    }

                    resolve(key);
                },
            );
        });

        return createHmac('sha256', this.pepper)
            .update(derivedKey)
            .digest();
    }
}