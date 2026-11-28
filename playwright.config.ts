import { existsSync } from 'node:fs';
import { defineConfig, devices, type Project, type ReporterDescription } from '@playwright/test';
import { DEVICES, type Device } from './app/PageFactory';
import type { DeviceOptions } from './fixtures/app';
import { requireEnv } from './utils/requireEnv';

// Local settings live in .env (see .env.example); in CI the workflow sets the same variables.
// Every worker loads this config too, so the variables reach the fixtures as well.
// process.loadEnvFile is built into Node 20.12+ and does not override variables already set.
if (existsSync('.env')) {
    process.loadEnvFile('.env');
}

const isCI = Boolean(process.env.CI);

/**
 * One e2e project per layout. The device option makes PageFactory pick that layout's page
 * objects; tests tagged for another layout (@web, @tablet, @mobile) are filtered out.
 */
function e2eProject(device: Device, profile: Project['use']): Project<DeviceOptions> {
    const otherLayouts = DEVICES.filter((d) => d !== device).map((d) => `@${d}`);
    return {
        name: `e2e-${device}`,
        testDir: './tests/e2e',
        dependencies: ['setup'],
        grepInvert: new RegExp(otherLayouts.join('|')),
        use: { ...profile, device },
    };
}

const reporters: ReporterDescription[] = isCI
    ? [
          ['list'],
          // a failed test becomes an annotation on the workflow run, at its file and line
          ['github'],
          ['blob'],
          ['allure-playwright'],
      ]
    : [['list'], ['html', { open: 'never' }], ['allure-playwright']];

export default defineConfig<DeviceOptions>({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 1 : 0,
    // One test account per worker: 4 workers x 2 CI shards = 8 accounts in data/accounts.json.
    workers: 4,
    reporter: reporters,
    expect: { timeout: 5_000 },

    use: {
        // the one source of the app address: pages, request contexts and fixtures all use it
        baseURL: requireEnv('BASE_URL'),
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        // registers the accounts and saves one session file per account
        { name: 'setup', testMatch: /auth\.setup\.ts/ },
        {
            name: 'api',
            testDir: './tests/api',
            dependencies: ['setup'],
        },
        e2eProject('web', devices['Desktop Chrome']),
        // iPad runs on WebKit, so the suite covers a second browser engine too
        e2eProject('tablet', devices['iPad (gen 7)']),
        e2eProject('mobile', devices['Pixel 7']),
    ],
});
