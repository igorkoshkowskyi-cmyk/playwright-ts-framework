import type { Expense } from '../../api/types';
import { buildExpenseForm } from '../../data/builders';
import { expect, test } from '../../fixtures';
import { formatCents } from '../../utils/money';

// Signed in through storageState: the worker's account session from the setup project.
test.describe('Expenses', { tag: '@expenses' }, () => {
    // Every test starts on the page with one expense already listed. The expense is requested
    // here, not in the tests: a test's own fixtures are set up after beforeEach, so it would be
    // created after the page has loaded and never be shown.
    test.beforeEach(async ({ app, expense }) => {
        await app.expensesPage.openPage();
        await expect(app.expensesPage.item(expense.title)).toBeVisible();
    });

    test('adds an expense and stores it for the current user', async ({
        app,
        api,
        db,
        currentUser,
        cleanup,
    }) => {
        const form = buildExpenseForm({ amount: '12.50' });

        const response = await test.step('add an expense through the form', async () => {
            const addResponse = await app.expensesPage.add(form);
            expect(addResponse.status()).toBe(201);
            return addResponse;
        });

        const created = (await response.json()) as Expense;
        cleanup.add(() => api.expenses.delete(created.id));

        await test.step('the page sent JSON with the amount in cents', () => {
            const request = response.request();
            expect(request.headers()['content-type']).toContain('application/json');
            expect(request.postDataJSON()).toEqual({
                title: form.title,
                amountCents: 1250,
                category: form.category,
                spentOn: form.spentOn,
            });
        });

        await test.step('the expense is listed and stored for the current user', async () => {
            await expect(app.expensesPage.item(form.title)).toContainText('12.50');
            const row = await db.expenses.findById(created.id);
            expect(row).toMatchObject({
                user_id: currentUser.id,
                amount_cents: 1250,
                category: form.category,
                spent_on: form.spentOn,
            });
        });
    });

    test('deletes an expense', async ({ app, db, expense }) => {
        await test.step('delete the expense from the list', async () => {
            const response = await app.expensesPage.delete(expense.title);
            expect(response.status()).toBe(204);
        });

        await test.step('the expense is gone from the page and the database', async () => {
            await expect(app.expensesPage.item(expense.title)).toHaveCount(0);
            const row = await db.expenses.findById(expense.id);
            expect(row).toBeUndefined();
        });
    });

    test('total matches the sum stored in the database', async ({ app, db, currentUser }) => {
        const totalCents = await db.expenses.totalCentsFor(currentUser.id);

        await expect(app.expensesPage.total).toHaveText(formatCents(totalCents));
    });
});
