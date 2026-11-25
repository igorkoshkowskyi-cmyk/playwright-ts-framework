import { expect, test } from '../../fixtures';

// Tests tagged with a device run only in that device's project (grepInvert in the config).
// Untagged tests run on every device through the same page object methods.
test.describe('Responsive layout', () => {
    // every test starts on the page with one expense listed, as a row or a card of this layout
    test.beforeEach(async ({ app, expense }) => {
        await app.expensesPage.open();
        await expect(app.expensesPage.item(expense.title)).toBeVisible();
    });

    test(
        'web shows the form and the account area, expenses as a table',
        { tag: '@web' },
        async ({ app }) => {
            const expenses = app.expensesPage;

            await expect(expenses.form).toBeVisible();
            await expect(expenses.newExpenseToggle).toBeHidden();
            await expect(expenses.userName).toBeVisible();
            await expect(expenses.menuToggle).toBeHidden();
            await expect(expenses.table).toBeVisible();
            await expect(expenses.cards).toBeHidden();
        }
    );

    test(
        'tablet opens the form with New expense, expenses as a table',
        { tag: '@tablet' },
        async ({ app }) => {
            const expenses = app.expensesPage;

            await test.step('the form opens with New expense', async () => {
                await expect(expenses.form).toBeHidden();
                await expenses.openForm();
                await expect(expenses.form).toBeVisible();
            });

            await test.step('the account area and the table are on screen', async () => {
                await expect(expenses.userName).toBeVisible();
                await expect(expenses.table).toBeVisible();
                await expect(expenses.cards).toBeHidden();
            });
        }
    );

    test(
        'mobile shows expenses as cards and the account area in the menu',
        { tag: '@mobile' },
        async ({ app, account }) => {
            const expenses = app.expensesPage;

            await test.step('expenses are cards, the account area is hidden', async () => {
                await expect(expenses.cards).toBeVisible();
                await expect(expenses.table).toBeHidden();
                await expect(expenses.userName).toBeHidden();
            });

            await test.step('the menu shows the account area', async () => {
                await expenses.openAccountMenu();
                await expect(expenses.userName).toHaveText(account.name);
            });
        }
    );

    test('user signs out from any layout', async ({ app, page }) => {
        await app.expensesPage.signOut();

        await expect(page).toHaveURL(/\/login$/);
    });
});
