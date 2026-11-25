import type { JSONSchemaType } from 'ajv';
import { CATEGORIES, type ApiErrorBody, type Expense, type ExpenseList, type User } from './types';

// JSON Schemas of the API answers: the contract the tests hold the API to.
// JSONSchemaType<T> ties each schema to its TypeScript type, so a field added to the type but not
// to the schema, or the other way round, is a compile error. additionalProperties: false makes
// an unexpected field, such as a leaked password hash, fail the check.

export const userSchema: JSONSchemaType<User> = {
    type: 'object',
    properties: {
        id: { type: 'integer', minimum: 1 },
        email: { type: 'string', format: 'email' },
        name: { type: 'string', minLength: 1, maxLength: 50 },
    },
    required: ['id', 'email', 'name'],
    additionalProperties: false,
};

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

export const expenseListSchema: JSONSchemaType<ExpenseList> = {
    type: 'object',
    properties: {
        items: { type: 'array', items: expenseSchema },
        totalCents: { type: 'integer', minimum: 0 },
    },
    required: ['items', 'totalCents'],
    additionalProperties: false,
};

export const apiErrorSchema: JSONSchemaType<ApiErrorBody> = {
    type: 'object',
    properties: {
        error: {
            type: 'object',
            properties: {
                code: { type: 'string', minLength: 1 },
                message: { type: 'string', minLength: 1 },
                // nullable is how JSONSchemaType marks an optional property
                field: { type: 'string', nullable: true },
            },
            required: ['code', 'message'],
            additionalProperties: false,
        },
    },
    required: ['error'],
    additionalProperties: false,
};
