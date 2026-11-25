import type { Pool } from 'pg';

/** A row of the users table, column names as in the database. */
export interface UserRow {
    id: number;
    email: string;
    name: string;
    password_hash: string;
}

export class UsersTable {
    constructor(private readonly pool: Pool) {}

    async findByEmail(email: string): Promise<UserRow | undefined> {
        const { rows } = await this.pool.query<UserRow>(
            'SELECT id, email, name, password_hash FROM users WHERE email = $1',
            [email.toLowerCase()]
        );
        return rows[0];
    }

    /** Users have no delete endpoint, so tests remove the ones they registered here. */
    async deleteByEmail(email: string): Promise<void> {
        await this.pool.query('DELETE FROM users WHERE email = $1', [email.toLowerCase()]);
    }
}
