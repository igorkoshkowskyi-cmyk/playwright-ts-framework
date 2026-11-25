import { buildUser } from '../../data/builders';
import { EMPTY_CREDENTIALS, WRONG_CREDENTIALS } from '../../data/cases/signIn';
import { expect, test } from '../../fixtures';

// these tests are about getting a session, so they start without one
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Sign in', () => {
    test.beforeEach(async ({ app }) => {
        await app.loginPage.open();
    });

    test('user signs in and lands on their expenses', async ({ app, account, page }) => {
        await test.step('sign in with valid credentials', async () => {
            const response = await app.loginPage.signIn(account.email, account.password);
            expect(response.status()).toBe(200);
        });

        await test.step('the expenses page opens for this user', async () => {
            await expect(page).toHaveURL(/\/expenses$/);
            await app.expensesPage.openAccountMenu();
            await expect(app.expensesPage.userName).toHaveText(account.name);
        });
    });

    // data-driven: one test per row of data/cases/signIn.ts, each rejected by the server
    for (const { name, credentials } of WRONG_CREDENTIALS) {
        test(`${name} shows an error and creates no session`, async ({ app, account, context }) => {
            const { email, password } = credentials(account);

            await test.step('sign in, the server answers 401', async () => {
                const response = await app.loginPage.signIn(email, password);
                expect(response.status()).toBe(401);
            });

            await test.step('an error is shown and no session cookie is set', async () => {
                await expect(app.loginPage.error).toHaveText('Invalid email or password');
                const cookieNames = (await context.cookies()).map((c) => c.name);
                expect(cookieNames).not.toContain('sid');
            });
        });
    }

    // data-driven: the form itself stops each row, so nothing reaches the server
    for (const { name, credentials } of EMPTY_CREDENTIALS) {
        test(`${name} is stopped by the form without a request`, async ({
            app,
            account,
            apiCalls,
        }) => {
            const { email, password } = credentials(account);

            await test.step('submit the form', async () => {
                await app.loginPage.fill(email, password);
                await app.loginPage.submit.click();
            });

            await test.step('an error is shown and no sign-in request is sent', async () => {
                await expect(app.loginPage.error).toHaveText('Email and password are required');
                expect(apiCalls).not.toContain('POST /api/auth/login');
            });
        });
    }
});

test.describe('Registration', () => {
    test.beforeEach(async ({ app }) => {
        await app.registerPage.open();
    });

    test('new user registers and is stored in the database', async ({ app, db, cleanup, page }) => {
        const user = buildUser();

        await test.step('register through the form', async () => {
            const response = await app.registerPage.register(user);
            cleanup.add(() => db.users.deleteByEmail(user.email));
            expect(response.status()).toBe(201);
        });

        await test.step('the expenses page opens for the new user', async () => {
            await expect(page).toHaveURL(/\/expenses$/);
            await app.expensesPage.openAccountMenu();
            await expect(app.expensesPage.userName).toHaveText(user.name);
        });

        await test.step('the user is stored in the database', async () => {
            const row = await db.users.findByEmail(user.email);
            expect(row).toMatchObject({ name: user.name });
        });
    });
});
