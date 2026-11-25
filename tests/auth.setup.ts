import { expect, test as setup } from '@playwright/test';
import { ApiClient } from '../api/ApiClient';
import { ACCOUNTS, authFile } from '../fixtures/accounts';

// Runs before the api and e2e projects (dependencies in playwright.config.ts).
// Find-or-create every account from data/accounts.json, sign in, save the session file.
// One cookie file serves both the browser context and the API request context.
// Request contexts take baseURL from the config, so paths below are relative.
setup('register test accounts and save their sessions', async ({ playwright, baseURL }) => {
    const probe = await playwright.request.newContext();
    const health = await probe.get('/health').catch(() => undefined);
    await probe.dispose();
    expect(
        health?.ok(),
        `The app is not reachable at ${baseURL}. Start it with "npm run env:up".`
    ).toBe(true);

    for (const account of ACCOUNTS) {
        const request = await playwright.request.newContext();
        const api = new ApiClient(request);
        await api.auth.ensureRegistered(account);
        await api.auth.login(account);
        // the saved session must really work, or every dependent test fails later and less clearly
        const profile = await api.auth.currentUser();
        expect(profile).toMatchObject({ email: account.email });
        await request.storageState({ path: authFile(account) });
        await request.dispose();
    }
});
