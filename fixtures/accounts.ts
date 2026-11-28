import { test as base, type WorkerInfo } from '@playwright/test';
import type { RegisterInput } from '../api/types';
import accountsJson from '../data/accounts.json';

export type Account = RegisterInput;

/** Test accounts: one per worker slot, see accountSlot(). */
export const ACCOUNTS: readonly Account[] = accountsJson;

/** Session file saved by the setup project for each account. */
export const authFile = (account: Account): string => `playwright/.auth/${account.email}.json`;

/**
 * A slot that is unique across workers and CI shards: with 4 workers and 2 shards,
 * shard 1 gets slots 0-3 and shard 2 gets slots 4-7. A restarted worker keeps its slot.
 */
export function accountSlot(workerInfo: WorkerInfo): number {
    const shard = workerInfo.config.shard;
    const shardOffset = shard ? (shard.current - 1) * workerInfo.config.workers : 0;
    return shardOffset + workerInfo.parallelIndex;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const test = base.extend<{}, { account: Account }>({
    account: [
        async ({}, use, workerInfo) => {
            const slot = accountSlot(workerInfo);
            const account = ACCOUNTS[slot];
            if (!account) {
                throw new Error(
                    `No test account for slot ${slot}: data/accounts.json has ${ACCOUNTS.length}. ` +
                        'Add accounts or lower workers x shards.'
                );
            }
            await use(account);
        },
        { scope: 'worker' },
    ],

    // the browser of every test starts signed in as the worker's account
    storageState: async ({ account }, use) => {
        await use(authFile(account));
    },
});
