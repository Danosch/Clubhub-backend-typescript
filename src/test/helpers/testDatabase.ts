import { DataSource, Repository } from "typeorm";
import { UserRepository } from "../../modules/users/repository/user.repository.js";
import { User } from "../../modules/users/entity/user.entity.js";
import { fileURLToPath } from "url";

/**
 * Provides a PostgreSQL connection and cleans up users created by tests.
 */
export class TestDatabase {
    private readonly testEmails = new Set<string>();
    // Allows tests to seed and inspect users independently of UserRepository.
    readonly userEntityRepository: Repository<User>;

    readonly users: UserRepository;

    private constructor(private readonly dataSource: DataSource) {
        this.userEntityRepository = dataSource.getRepository(User);
        this.users = new UserRepository(dataSource.getRepository(User));
    }

    /**
     * Connects to the test database and applies pending migrations.
     * 
     * @returns A connected database helper.
     */
    static async connect(): Promise<TestDatabase> {
        const database = TestDatabase.requiredEnv('POSTGRES_DB');

        if (
            process.env.NODE_ENV !== 'test' ||
            !database.endsWith('_test')
        ) {
            throw new Error(
                'Integration tests require NODE_ENV=test and a *_test database.'
            );
        }

        const dataSource = new DataSource({
            type: 'postgres',
            host: TestDatabase.requiredEnv('POSTGRES_HOST'),
            port: Number(TestDatabase.requiredEnv('POSTGRES_PORT')),
            username: TestDatabase.requiredEnv('POSTGRES_USER'),
            password: TestDatabase.requiredEnv('POSTGRES_PASSWORD'),
            database,
            entities: [User],
            migrations: [
                fileURLToPath(
                    new URL(
                        '../../infrastructure/database/migrations/[0-9]*-*.js',
                        import.meta.url
                    )
                )
            ],
            migrationsRun: true,
            synchronize: false
        });
        await dataSource.initialize();
        return new TestDatabase(dataSource);
    }



    /**
     * Registers a user's email for cleanup after the test.
     * 
     * @param user The user that the test may persist.
     */
    trackUser(user: User): void {
        this.testEmails.add(user.email);
    }

    /**
     * Deletes only users registered by the current test.
     */
    async cleanupUsers(): Promise<void> {
        for (const email of this.testEmails) {
            await this.dataSource.getRepository(User).delete({ email });
            this.testEmails.delete(email);
        }
    }

    /**
     * Cleans up remaining test users and closes the connection.
     */
    async close(): Promise<void> {
        try {
            await this.cleanupUsers();
        } finally {
            if (this.dataSource.isInitialized) {
                await this.dataSource.destroy();
            }
        }
    }


    /**
     * Reads a required environment variable.
     * 
     * @param name The environment variable name.
     * @returns Its configured value.
     */
    private static requiredEnv(name: string): string {
        const value = process.env[name];

        if (!value) {
            throw new Error(`${name} is required for integration tests`);
        }
        return value;
    }

}