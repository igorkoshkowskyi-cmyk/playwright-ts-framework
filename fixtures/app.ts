import { test as base } from '@playwright/test';
import { App } from '../app/App';
import type { Device } from '../app/PageFactory';

export interface DeviceOptions {
    device: Device;
}

export const test = base.extend<{ app: App } & DeviceOptions>({
    // set per e2e project in playwright.config.ts
    device: ['web', { option: true }],

    app: async ({ page, device }, use) => {
        await use(new App(page, device));
    },
});
