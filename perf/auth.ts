// Load test for sign-up and sign-in. Run: k6 run -e PROFILE=smoke|load perf/auth.ts
// Needs the app at BASE_URL and an existing ./allure-results folder for the Allure output.
import { check } from 'k6';
import exec from 'k6/execution';
import http from 'k6/http';
import type { ConstantArrivalRateScenario, Options } from 'k6/options';
import { allureResults, textReport, type Summary } from './lib/summary.ts';

interface Profile {
    /** sign-ups per second; sign-ins run at twice this rate */
    rate: number;
    duration: string;
    /** users registered in setup() and reused by the sign-in scenario */
    loginPool: number;
}

const PROFILES: Record<string, Profile> = {
    smoke: { rate: 1, duration: '20s', loginPool: 3 },
    load: { rate: 5, duration: '2m', loginPool: 20 },
};

function selectProfile(name: string): Profile {
    const profile = PROFILES[name];
    if (!profile) {
        throw new Error(`Unknown PROFILE "${name}": use ${Object.keys(PROFILES).join(', ')}`);
    }
    return profile;
}

const PROFILE = selectProfile(__ENV.PROFILE ?? 'smoke');

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:3000';
const RUN_ID = __ENV.RUN_ID ?? `${Date.now()}`;
const PASSWORD = 'Load-Test-Passw0rd';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

interface Credentials {
    email: string;
    password: string;
}

/** Starts `rate` iterations of the `exec` function per second, for the whole profile duration. */
function arrivalRate(exec: string, rate: number): ConstantArrivalRateScenario {
    return {
        executor: 'constant-arrival-rate',
        exec,
        rate,
        timeUnit: '1s',
        duration: PROFILE.duration,
        // spare virtual users keep the rate when responses get slower
        preAllocatedVUs: rate * 2,
        maxVUs: rate * 10,
    };
}

export const options: Options = {
    scenarios: {
        register: arrivalRate('register', PROFILE.rate),
        login: arrivalRate('login', PROFILE.rate * 2),
    },
    // each scenario tags its requests, so each gets its own limits
    thresholds: {
        'http_req_duration{scenario:register}': ['p(95)<800'],
        'http_req_duration{scenario:login}': ['p(95)<500'],
        'http_req_failed{scenario:register}': ['rate<0.01'],
        'http_req_failed{scenario:login}': ['rate<0.01'],
        checks: ['rate>0.99'],
    },
};

/** POSTs a JSON body. The name tag is the route, so the results group per endpoint, not per URL. */
function postJson(path: string, body: object) {
    return http.post(`${BASE_URL}${path}`, JSON.stringify(body), {
        headers: JSON_HEADERS,
        tags: { name: `POST ${path}` },
    });
}

function signUp(email: string) {
    return postJson('/api/auth/register', { name: 'Load User', email, password: PASSWORD });
}

/** Runs once before the scenarios: a pool of existing users for the sign-in scenario. */
export function setup(): { users: Credentials[] } {
    const users: Credentials[] = [];
    for (let i = 0; i < PROFILE.loginPool; i++) {
        const email = `login-${RUN_ID}-${i}@example.test`;
        const response = signUp(email);
        if (response.status !== 201) {
            throw new Error(`setup: could not register ${email}: HTTP ${response.status}`);
        }
        users.push({ email, password: PASSWORD });
    }
    return { users };
}

export function register(): void {
    // unique across all virtual users and iterations of this run
    const email = `register-${RUN_ID}-${exec.scenario.iterationInTest}@example.test`;
    const response = signUp(email);
    check(response, { 'register: 201': (r) => r.status === 201 });
}

export function login(data: { users: Credentials[] }): void {
    const user = data.users[exec.scenario.iterationInTest % data.users.length];
    if (!user) {
        throw new Error('setup() returned no users');
    }
    const response = postJson('/api/auth/login', user);
    check(response, {
        'login: 200': (r) => r.status === 200,
        'login: session cookie': (r) => (r.headers['Set-Cookie'] ?? '').includes('sid='),
    });
}

export function handleSummary(data: Summary): Record<string, string> {
    return { stdout: textReport(data), ...allureResults(data, 'auth', 'allure-results') };
}
