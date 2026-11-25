import { randomUUID } from 'node:crypto';
import type { ExpenseInput, RegisterInput } from '../api/types';
import type { ExpenseForm } from '../app/pages/interfaces/ExpensesPage';

/** Unique per call, so parallel workers and reruns never collide. */
export const unique = (prefix: string): string => `${prefix}-${randomUUID().slice(0, 8)}`;

/** An expense as the API takes it. */
export function buildExpense(overrides: Partial<ExpenseInput> = {}): ExpenseInput {
    return {
        title: unique('Lunch'),
        amountCents: 1250,
        category: 'food',
        spentOn: '2026-11-20',
        ...overrides,
    };
}

/** The same expense as a user types it into the form: the amount is text. */
export function buildExpenseForm(overrides: Partial<ExpenseForm> = {}): ExpenseForm {
    return {
        title: unique('Lunch'),
        amount: '12.50',
        category: 'food',
        spentOn: '2026-11-20',
        ...overrides,
    };
}

export function buildUser(overrides: Partial<RegisterInput> = {}): RegisterInput {
    const id = unique('user');
    return {
        name: 'Test User',
        email: `${id}@example.test`,
        password: 'Str0ng-Passw0rd',
        ...overrides,
    };
}
