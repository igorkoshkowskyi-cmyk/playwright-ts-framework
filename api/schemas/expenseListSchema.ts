import type { JSONSchemaType } from 'ajv';
import type { ExpenseList } from '../types';
import { expenseSchema } from './expenseSchema';

/** The list of the current user's expenses and their total, each item held to expenseSchema. */
export const expenseListSchema: JSONSchemaType<ExpenseList> = {
    type: 'object',
    properties: {
        items: { type: 'array', items: expenseSchema },
        totalCents: { type: 'integer', minimum: 0 },
    },
    required: ['items', 'totalCents'],
    additionalProperties: false,
};
