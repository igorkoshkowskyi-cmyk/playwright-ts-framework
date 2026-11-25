import { test as base } from '@playwright/test';
import { App } from '../app/App';
import type { Device } from '../app/PageFactory';

export interface DeviceOptions {
    device: Device;
}

interface AppFixtures {
    app: App;
    apiCalls: readonly string[];
}

export const test = base.extend<AppFixtures & DeviceOptions>({
    // set per e2e project in playwright.config.ts
    device: ['web', { option: true }],

    app: async ({ page, device }, use) => {
        await use(new App(page, device));
    },

    // Every API request the page sends from now on, as "METHOD /path", for checks that a call
    // did or did not happen. Like any test fixture it starts after beforeEach, not before it.
    apiCalls: async ({ page }, use) => {
        const calls: string[] = [];
        page.on('request', (request) => {
            const { pathname } = new URL(request.url());
            if (pathname.startsWith('/api/')) {
                calls.push(`${request.method()} ${pathname}`);
            }
        });
        await use(calls);
    },
});
