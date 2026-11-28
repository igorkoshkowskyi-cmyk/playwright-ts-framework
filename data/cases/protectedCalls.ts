import type { ApiClient } from '../../api/ApiClient';
import type { Expense } from '../../api/types';
import { buildExpense } from '../builders';

/**
 * What a call works with: an expense, or the signed-in user's profile, which belongs to sign-in.
 * ESLint cannot see a tag in a variable, so this type checks it instead.
 */
export type ProtectedCallTag = '@expenses' | '@login';

/** One row of a data-driven access test: an endpoint, its tag and how to call it. */
export interface ProtectedCall {
    endpoint: string;
    tag: ProtectedCallTag;
    call: (api: ApiClient, expense: Expense) => Promise<unknown>;
}

/**
 * The calls that take an expense id. They target a real expense of the worker's account, so a
 * refusal proves the access check, not a missing record: 401 without a session, 404 for a
 * signed-in user who does not own the expense.
 */
export const EXPENSE_BY_ID_CALLS: readonly ProtectedCall[] = [
    {
        endpoint: 'GET /api/expenses/:id',
        tag: '@expenses',
        call: (api, { id }) => api.expenses.getById(id),
    },
    {
        endpoint: 'PUT /api/expenses/:id',
        tag: '@expenses',
        call: (api, { id }) => api.expenses.update(id, buildExpense()),
    },
    {
        endpoint: 'DELETE /api/expenses/:id',
        tag: '@expenses',
        call: (api, { id }) => api.expenses.delete(id),
    },
];

/** Every endpoint behind the session. */
export const PROTECTED_CALLS: readonly ProtectedCall[] = [
    { endpoint: 'GET /api/me', tag: '@login', call: (api) => api.auth.currentUser() },
    { endpoint: 'GET /api/expenses', tag: '@expenses', call: (api) => api.expenses.list() },
    {
        endpoint: 'POST /api/expenses',
        tag: '@expenses',
        call: (api) => api.expenses.create(buildExpense()),
    },
    ...EXPENSE_BY_ID_CALLS,
];
