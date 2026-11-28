import type { JSONSchemaType } from 'ajv';
import type { ApiErrorBody } from '../types';

/** The one error shape of the whole API; toFailWithApiError checks every error answer with it. */
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
