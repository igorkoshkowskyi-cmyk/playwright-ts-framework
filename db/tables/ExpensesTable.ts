import type { Pool } from 'pg';

/** A row of the expenses table, column names as in the database. */
export interface ExpenseRow {
    id: number;
    user_id: number;
    title: string;
    amount_cents: number;
    category: string;
    spent_on: string;
}

export class ExpensesTable {
    constructor(private readonly pool: Pool) {}

    async findById(id: number): Promise<ExpenseRow | undefined> {
        // DATE as text: pg would turn it into a JS Date in the local time zone
        const { rows } = await this.pool.query<ExpenseRow>(
            `SELECT id, user_id, title, amount_cents, category, spent_on::text AS spent_on
             FROM expenses WHERE id = $1`,
            [id]
        );
        return rows[0];
    }

    async totalCentsFor(userId: number): Promise<number> {
        // SUM over INTEGER is BIGINT, which pg returns as a string
        const { rows } = await this.pool.query<{ total: string }>(
            'SELECT COALESCE(SUM(amount_cents), 0) AS total FROM expenses WHERE user_id = $1',
            [userId]
        );
        return Number(rows[0]?.total ?? 0);
    }
}
