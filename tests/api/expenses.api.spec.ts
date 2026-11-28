import { buildExpense, buildUser } from '../../data/builders';
import { expect, test } from '../../fixtures';

test.describe('Expenses API', () => {
    test('create stores the expense for the current user', async ({
        api,
        db,
        currentUser,
        cleanup,
    }) => {
        const input = buildExpense();

        const created = await test.step('create an expense', async () => {
            const expense = await api.expenses.create(input);
            cleanup.add(() => api.expenses.delete(expense.id));
            return expense;
        });

        await test.step('the answer has the input, an id and a creation time', () => {
            expect(created).toEqual({
                ...input,
                id: expect.any(Number),
                createdAt: expect.any(String),
            });
        });

        await test.step('the row is stored for the current user', async () => {
            const row = await db.expenses.findById(created.id);
            expect(row).toEqual({
                id: created.id,
                user_id: currentUser.id,
                title: input.title,
                amount_cents: input.amountCents,
                category: input.category,
                spent_on: input.spentOn,
            });
        });
    });

    test('get by id returns the expense', async ({ api, expense }) => {
        const found = await api.expenses.getById(expense.id);

        expect(found).toEqual(expense);
    });

    test('update replaces the stored values', async ({ api, db, expense }) => {
        const changes = buildExpense({ title: `${expense.title}-upd`, amountCents: 999 });

        const updated = await test.step('update the expense', () =>
            api.expenses.update(expense.id, changes));

        await test.step('the answer and the database have the new values', async () => {
            expect(updated).toEqual({ ...changes, id: expense.id, createdAt: expense.createdAt });
            const row = await db.expenses.findById(expense.id);
            expect(row).toMatchObject({
                title: changes.title,
                amount_cents: 999,
            });
        });
    });

    test('delete removes the expense', async ({ api, db, expense }) => {
        await test.step('delete the expense', () => api.expenses.delete(expense.id));

        await test.step('the expense is gone from the API and the database', async () => {
            await expect(api.expenses.getById(expense.id)).toFailWithApiError(404, 'not_found');
            const row = await db.expenses.findById(expense.id);
            expect(row).toBeUndefined();
        });
    });

    test('create rejects a non-positive amount', async ({ api }) => {
        await expect(api.expenses.create(buildExpense({ amountCents: 0 }))).toFailWithApiError(
            400,
            'validation',
            'amountCents'
        );
    });

    test('another user cannot read the expense', async ({ anonApi, db, cleanup, expense }) => {
        await test.step('sign up as another user', async () => {
            const stranger = buildUser();
            // register signs anonApi in as the stranger
            await anonApi.auth.register(stranger);
            cleanup.add(() => db.users.deleteByEmail(stranger.email));
        });

        await test.step('the other user gets 404 for the expense', async () => {
            await expect(anonApi.expenses.getById(expense.id)).toFailWithApiError(404, 'not_found');
        });
    });
});
