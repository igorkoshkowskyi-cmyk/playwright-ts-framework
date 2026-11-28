import { ApiClient } from '../api/ApiClient';
import { ignoreNotFound } from '../api/http';
import type { Expense, User } from '../api/types';
import { buildExpense } from '../data/builders';
import { Db } from '../db/Db';
import { requireEnv, requirePort } from '../utils/requireEnv';
import { test as accountsTest, authFile } from './accounts';

export interface Cleanup {
    /** Registers an undo step; steps run after the test in reverse order. */
    add(action: () => Promise<unknown>): void;
}

interface ApiFixtures {
    api: ApiClient;
    anonApi: ApiClient;
    currentUser: User;
    cleanup: Cleanup;
    expense: Expense;
}

interface WorkerFixtures {
    db: Db;
}

export const test = accountsTest.extend<ApiFixtures, WorkerFixtures>({
    // one connection pool per worker, closed when the worker ends
    db: [
        async ({}, use) => {
            const db = new Db({
                host: requireEnv('DB_HOST'),
                port: requirePort('DB_PORT'),
                database: requireEnv('DB_NAME'),
                user: requireEnv('DB_USER'),
                password: requireEnv('DB_PASSWORD'),
            });
            await use(db);
            await db.close();
        },
        { scope: 'worker' },
    ],

    // Inside a test every new request context gets the `use` options of the project: baseURL
    // from playwright.config.ts, and the worker's storageState unless the context sets its own.

    // signed in through the session the setup project saved for this worker's account
    api: async ({ playwright, account }, use) => {
        const request = await playwright.request.newContext({ storageState: authFile(account) });
        await use(new ApiClient(request));
        await request.dispose();
    },

    // no session: auth tests, and acting as a second user
    anonApi: async ({ playwright }, use) => {
        const request = await playwright.request.newContext({
            storageState: { cookies: [], origins: [] },
        });
        await use(new ApiClient(request));
        await request.dispose();
    },

    // the worker's account as the API sees it: tests need its id, which the database assigns
    currentUser: async ({ api }, use) => {
        await use(await api.auth.currentUser());
    },

    // Requests api and db only to depend on them: Playwright tears fixtures down in reverse
    // order, so both are still alive when the undo steps run after the test.
    // LIFO order deletes children before parents; a failed step is reported, never fatal.
    cleanup: async ({ api: _api, db: _db }, use, testInfo) => {
        const actions: (() => Promise<unknown>)[] = [];
        await use({ add: (action) => actions.push(action) });
        for (const action of actions.reverse()) {
            try {
                await action();
            } catch (error) {
                testInfo.annotations.push({ type: 'cleanup failed', description: String(error) });
                console.warn(`[cleanup] ${testInfo.title}: ${String(error)}`);
            }
        }
    },

    expense: async ({ api, cleanup }, use) => {
        const expense = await api.expenses.create(buildExpense());
        // the test itself may delete it: a 404 at cleanup is not a failure
        cleanup.add(() => ignoreNotFound(api.expenses.delete(expense.id)));
        await use(expense);
    },
});
