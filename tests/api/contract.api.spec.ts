import { expenseListSchema, expenseSchema, userSchema } from '../../api/schemas';
import { buildExpense, buildUser } from '../../data/builders';
import { expect, test } from '../../fixtures';

// Contract checks: each answer has exactly the shape of its JSON Schema in api/schemas.ts, with
// no missing, extra or mistyped field. Error answers are held to the error schema as well: every
// negative test checks it through toFailWithApiError.
test.describe('API contract', () => {
    test(
        'POST /api/auth/register answers with a user',
        { tag: '@registration' },
        async ({ anonApi, db, cleanup }) => {
            const input = buildUser();

            const user = await anonApi.auth.register(input);
            cleanup.add(() => db.users.deleteByEmail(input.email));

            expect(user).toMatchSchema(userSchema);
        }
    );

    test(
        'POST /api/auth/login answers with a user',
        { tag: '@login' },
        async ({ anonApi, account }) => {
            const user = await anonApi.auth.login(account);

            expect(user).toMatchSchema(userSchema);
        }
    );

    test('GET /api/me answers with a user', { tag: '@login' }, async ({ api }) => {
        const user = await api.auth.currentUser();

        expect(user).toMatchSchema(userSchema);
    });

    test(
        'POST /api/expenses answers with an expense',
        { tag: '@expenses' },
        async ({ api, cleanup }) => {
            const created = await api.expenses.create(buildExpense());
            cleanup.add(() => api.expenses.delete(created.id));

            expect(created).toMatchSchema(expenseSchema);
        }
    );

    test(
        'GET /api/expenses/:id answers with an expense',
        { tag: '@expenses' },
        async ({ api, expense }) => {
            const found = await api.expenses.getById(expense.id);

            expect(found).toMatchSchema(expenseSchema);
        }
    );

    test(
        'PUT /api/expenses/:id answers with an expense',
        { tag: '@expenses' },
        async ({ api, expense }) => {
            const updated = await api.expenses.update(expense.id, buildExpense());

            expect(updated).toMatchSchema(expenseSchema);
        }
    );

    test(
        'GET /api/expenses answers with the items and their total',
        { tag: '@expenses' },
        async ({ api, expense }) => {
            const list = await api.expenses.list();

            // the list is not empty, so the schema of its items is checked too
            expect(list.items.map((item) => item.id)).toContain(expense.id);
            expect(list).toMatchSchema(expenseListSchema);
        }
    );
});
