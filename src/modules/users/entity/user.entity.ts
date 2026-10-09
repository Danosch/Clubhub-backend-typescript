import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

/**
 * Represents a user stored in the users table.
 * 
 * Passwords hashes are excluded from queries unless explicitly selected.
 */
@Entity('users')
@Unique('users_email_key', ['email'])
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({
        type: 'varchar',
        length: 255
    })
    email!: string;

    @Column({
        type: 'varchar'
    })
    username!: string;

    @Column({
        name: 'password_hash',
        type: 'varchar',
        select: false
    })
    passwordHash!: string;

    @Column({
        name: 'avatar_bucket',
        type: 'text',
        nullable: true
    })
    avatarBucket!: string | null;

    @Column({
        name: 'avatar_etag',
        type: 'text',
        nullable: true
    })
    avatarEtag!: string | null;

    @Column({
        name: 'avatar_object',
        type: 'text',
        nullable: true
    })
    avatarObject!: string | null;

    @Column({
        type: 'varchar',
        length: 1024,
        nullable: true
    })
    description!: string | null;

    @Column({
        type: 'varchar',
        nullable: true
    })
    subject!: string | null;

}