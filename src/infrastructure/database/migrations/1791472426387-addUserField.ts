import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserField1791472426387 implements MigrationInterface {
    name = 'AddUserField1791472426387'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "username" character varying NOT NULL, "password_hash" character varying NOT NULL, "avatar_bucket" text, "avatar_etag" text, "avatar_object" text, "description" character varying(1024), "subject" character varying, CONSTRAINT "users_email_key" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
