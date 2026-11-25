import { Pool } from 'pg';
import { ExpensesTable } from './tables/ExpensesTable';
import { UsersTable } from './tables/UsersTable';

export interface DbConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
}

/**
 * Database container, like ApiClient for the API: one entry point to every table helper.
 * Used for checks of what the API stored, and for cleanup the API cannot do.
 */
export class Db {
    readonly users: UsersTable;
    readonly expenses: ExpensesTable;
    private readonly pool: Pool;

    constructor(config: DbConfig) {
        // separate fields, not a URL: a password with special characters needs no escaping
        this.pool = new Pool({ ...config, max: 2 });
        this.users = new UsersTable(this.pool);
        this.expenses = new ExpensesTable(this.pool);
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}
