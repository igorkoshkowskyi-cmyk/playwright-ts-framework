import { buildUser } from '../../data/builders';
import { expect, test } from '../../fixtures';

test.describe('Auth API', () => {
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

        await test.step('the answer has the user without the password', async () => {
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
        await expect(anonApi.auth.register(account)).rejects.toMatchObject({
            status: 409,
            code: 'email_taken',
        });
    });

    test('login rejects a wrong password', async ({ anonApi, account }) => {
        await expect(
            anonApi.auth.login({ email: account.email, password: 'wrong-password' })
        ).rejects.toMatchObject({ status: 401, code: 'invalid_credentials' });
    });

    test('login sets an HttpOnly session cookie', async ({ playwright, account }) => {
        // raw context without a session: this test is about headers the service layer hides
        const request = await playwright.request.newContext({
            storageState: { cookies: [], origins: [] },
        });

        const response = await test.step('sign in with a raw request', async () => {
            const answer = await request.post('/api/auth/login', {
                data: { email: account.email, password: account.password },
            });
            await expect(answer).toBeOK();
            return answer;
        });

        await test.step('the session cookie is HttpOnly and SameSite=Lax', async () => {
            const cookie = response.headers()['set-cookie'] ?? '';
            expect(cookie).toContain('sid=');
            expect(cookie).toContain('HttpOnly');
            expect(cookie).toContain('SameSite=Lax');
        });

        await request.dispose();
    });

    test('profile requires a session', async ({ anonApi }) => {
        await expect(anonApi.auth.currentUser()).rejects.toMatchObject({
            status: 401,
            code: 'unauthorized',
        });
    });
});
