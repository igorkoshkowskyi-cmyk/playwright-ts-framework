import type { JSONSchemaType } from 'ajv';
import type { User } from '../types';

/** The user as the API returns it: never with a password or its hash. */
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
