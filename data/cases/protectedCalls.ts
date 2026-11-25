import type { ApiClient } from '../../api/ApiClient';
import type { Expense } from '../../api/types';
import { buildExpense } from '../builders';

/** One row of a data-driven access test: an endpoint and how to call it with a given client. */
export interface ProtectedCall {
    endpoint: string;
    call: (api: ApiClient, expense: Expense) => Promise<unknown>;
}

/**
 * Every endpoint behind the session. The :id calls target a real expense of the worker's
 * account, so a 401 proves the session check, not a missing record.
 */
export const PROTECTED_CALLS: readonly ProtectedCall[] = [
    { endpoint: 'GET /api/me', call: (api) => api.auth.currentUser() },
    { endpoint: 'GET /api/expenses', call: (api) => api.expenses.list() },
    { endpoint: 'POST /api/expenses', call: (api) => api.expenses.create(buildExpense()) },
    { endpoint: 'GET /api/expenses/:id', call: (api, { id }) => api.expenses.getById(id) },
    {
        endpoint: 'PUT /api/expenses/:id',
        call: (api, { id }) => api.expenses.update(id, buildExpense()),
    },
    { endpoint: 'DELETE /api/expenses/:id', call: (api, { id }) => api.expenses.delete(id) },
];
