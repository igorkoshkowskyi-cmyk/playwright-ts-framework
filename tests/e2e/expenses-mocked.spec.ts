import { buildExpenseForm } from '../../data/builders';
import { expect, test } from '../../fixtures';

// Front-end behaviour on answers the real backend cannot easily give: page.route replaces them.
// Nothing here reaches the database, so the real end-to-end flows live in expenses.spec.ts.
// No beforeEach that opens the page: a mock of the first list load must be set before it.
test.describe('Expenses: mocked backend', () => {
    test('keeps the form and shows an error when saving fails', async ({ app, page }) => {
        await page.route('**/api/expenses', (route) =>
            route.request().method() === 'POST'
                ? route.fulfill({
                      status: 500,
                      json: { error: { code: 'internal', message: 'Something went wrong' } },
                  })
                : route.fallback()
        );
        await app.expensesPage.openPage();
        const form = buildExpenseForm();

        await test.step('submit the form, the server answers 500', async () => {
            const response = await app.expensesPage.add(form);
            expect(response.status()).toBe(500);
        });

        await test.step('an error is shown and the input is kept', async () => {
            await expect(app.expensesPage.error).toHaveText(
                'Could not save the expense. Try again.'
            );
            await expect(app.expensesPage.titleInput).toHaveValue(form.title);
            await expect(app.expensesPage.item(form.title)).toHaveCount(0);
        });
    });

    test('shows the empty state for an empty list', async ({ app, page }) => {
        await page.route('**/api/expenses', (route) =>
            route.request().method() === 'GET'
                ? route.fulfill({ json: { items: [], totalCents: 0 } })
                : route.fallback()
        );

        await app.expensesPage.openPage();

        await expect(app.expensesPage.emptyState).toBeVisible();
        await expect(app.expensesPage.total).toHaveText('0.00');
    });

    test('does not call the API when the amount is invalid', async ({ app, apiCalls }) => {
        await app.expensesPage.openPage();

        await test.step('submit the form with a zero amount', async () => {
            await app.expensesPage.fillForm(buildExpenseForm({ amount: '0' }));
            await app.expensesPage.submit.click();
        });

        await test.step('an error is shown and no request is sent', async () => {
            await expect(app.expensesPage.error).toHaveText('Enter an amount greater than 0');
            expect(apiCalls).not.toContain('POST /api/expenses');
        });
    });
});
