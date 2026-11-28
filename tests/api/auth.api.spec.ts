import { buildUser } from '../../data/builders';
import { PROTECTED_CALLS } from '../../data/cases/protectedCalls';
import { INVALID_REGISTRATIONS, VALID_REGISTRATIONS } from '../../data/cases/registration';
import { EMPTY_CREDENTIALS, WRONG_CREDENTIALS } from '../../data/cases/signIn';
import { expect, test } from '../../fixtures';

test.describe('Auth API: registration', { tag: '@registration' }, () => {
    test('register creates a user and stores only a password hash', async ({
        anonApi,
        db,
        cleanup,
    }) => {
        const input = buildUser();

        const user = await test.step('register a new user', async () => {
            const created = await anonApi.auth.register(input);
            cleanup.add(() => db.users.deleteByEmail(input.email));
            return created;
        });

        await test.step('the response has the user without the password', () => {
            expect(user).toEqual({ id: expect.any(Number), email: input.email, name: input.name });
        });

        await test.step('the database stores only a password hash', async () => {
            const row = await db.users.findByEmail(input.email);
            expect(row?.id).toBe(user.id);
            expect(row?.password_hash).not.toContain(input.password);
            expect(row?.password_hash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
        });
    });

    test('register rejects an email that is already taken', async ({ anonApi, account }) => {
        await expect(anonApi.auth.register(account)).toFailWithApiError(
            409,
            'email_taken',
            'email'
        );
    });

    // data-driven: one test per row, each names the field the API must reject
    for (const { name, input, field } of INVALID_REGISTRATIONS) {
        test(`register rejects ${name}`, async ({ anonApi, db, cleanup }) => {
            const user = buildUser(input);
            // only matters if the API wrongly accepts the input: the user must not stay behind
            cleanup.add(() => db.users.deleteByEmail(user.email));

            await expect(anonApi.auth.register(user)).toFailWithApiError(400, 'validation', field);

            const row = await db.users.findByEmail(user.email);
            expect(row).toBeUndefined();
        });
    }

    // data-driven: the same boundaries from the allowed side, each row must be accepted as it is
    for (const { name, input } of VALID_REGISTRATIONS) {
        test(`register accepts ${name}`, async ({ anonApi, db, cleanup }) => {
            const user = buildUser(input);
            cleanup.add(() => db.users.deleteByEmail(user.email));

            const created = await anonApi.auth.register(user);

            expect(created).toEqual({ id: expect.any(Number), email: user.email, name: user.name });
        });
    }
});

test.describe('Auth API: sign-in', { tag: '@login' }, () => {
    // data-driven: every wrong or empty pair gets the same response, so the API never tells
    // which part was wrong and cannot be used to find registered emails
    for (const { name, credentials } of [...WRONG_CREDENTIALS, ...EMPTY_CREDENTIALS]) {
        test(`login rejects ${name}`, async ({ anonApi, account }) => {
            await expect(anonApi.auth.login(credentials(account))).toFailWithApiError(
                401,
                'invalid_credentials'
            );
        });
    }
});

test.describe('Auth API: session required', () => {
    // data-driven: one test per protected endpoint, called without a session; each row carries
    // the tag of what its endpoint works with
    for (const { endpoint, tag, call } of PROTECTED_CALLS) {
        // the rule reads only string literals; the ProtectedCallTag type checks this tag instead
        // eslint-disable-next-line playwright/valid-test-tags
        test(`${endpoint} requires a session`, { tag }, async ({ anonApi, api, expense }) => {
            await expect(call(anonApi, expense)).toFailWithApiError(401, 'unauthorized');

            // a rejected call must not have changed or deleted anything on the way
            const stored = await api.expenses.getById(expense.id);
            expect(stored).toEqual(expense);
        });
    }
});
