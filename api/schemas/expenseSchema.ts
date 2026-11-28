import type { JSONSchemaType } from 'ajv';
import { CATEGORIES, type Expense } from '../types';

/** One expense: the amount in whole cents, the day as YYYY-MM-DD, the creation time as ISO. */
export const expenseSchema: JSONSchemaType<Expense> = {
    type: 'object',
    properties: {
        id: { type: 'integer', minimum: 1 },
        title: { type: 'string', minLength: 1, maxLength: 100 },
        amountCents: { type: 'integer', minimum: 1 },
        category: { type: 'string', enum: CATEGORIES },
        spentOn: { type: 'string', format: 'date' },
        createdAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'title', 'amountCents', 'category', 'spentOn', 'createdAt'],
    additionalProperties: false,
};
