import { expect as baseExpect } from '@playwright/test';
import Ajv, { type SchemaObject } from 'ajv';
import addFormats from 'ajv-formats';
import { ApiError } from '../api/http';
import { apiErrorSchema } from '../api/schemas';

// One validator for the whole run: ajv compiles a schema once and caches it by the schema object.
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/** Every mismatch between the value and the schema, one per line; undefined when it matches. */
function schemaMismatches(schema: SchemaObject, value: unknown): string | undefined {
    const validate = ajv.compile(schema);
    if (validate(value)) {
        return undefined;
    }
    return ajv.errorsText(validate.errors, { dataVar: 'value', separator: '\n' });
}

type Outcome = { failed: false; value: unknown } | { failed: true; error: unknown };

const settle = (call: Promise<unknown>): Promise<Outcome> =>
    call.then(
        (value) => ({ failed: false, value }),
        (error: unknown) => ({ failed: true, error })
    );

const describeError = (status: number, code: string | undefined, field: string | undefined) =>
    `HTTP ${status} ${code ?? '(no code)'}${field === undefined ? '' : `, field "${field}"`}`;

/** Why the settled call is not the expected API error; undefined when it is. */
function apiErrorMismatch(
    outcome: Outcome,
    status: number,
    code: string,
    field: string | undefined
): string | undefined {
    if (!outcome.failed) {
        return `The call succeeded with ${JSON.stringify(outcome.value)}`;
    }
    const { error } = outcome;
    if (!(error instanceof ApiError)) {
        return `The call failed without an API response: ${String(error)}`;
    }
    const fieldMatches = field === undefined || error.field === field;
    if (error.status !== status || error.code !== code || !fieldMatches) {
        return `Received: ${describeError(error.status, error.code, error.field)}`;
    }
    const bodyMismatches = schemaMismatches(apiErrorSchema, error.body);
    return bodyMismatches === undefined
        ? undefined
        : `The error body breaks the error schema:\n${bodyMismatches}`;
}

/** Playwright's expect plus matchers for API responses. Specs get it from fixtures/index.ts. */
export const expect = baseExpect.extend({
    /**
     * The value has exactly the shape of the JSON Schema. On failure the message lists every
     * mismatch, for example `value/amountCents must be integer`.
     */
    toMatchSchema(received: unknown, schema: SchemaObject) {
        const mismatches = schemaMismatches(schema, received);
        const pass = mismatches === undefined;
        const hint = this.utils.matcherHint('toMatchSchema', 'value', 'schema', {
            isNot: this.isNot,
        });
        const message = () =>
            pass
                ? `${hint}\n\nExpected the value not to match the schema.`
                : `${hint}\n\n${mismatches}\n\nReceived: ${this.utils.printReceived(received)}`;
        return { pass, message, name: 'toMatchSchema' };
    },

    /**
     * The API call fails with this status and error code, and with this invalid field when one is
     * given. The error body must also match the common error schema, so every negative test checks
     * the error contract on the way.
     *
     *     await expect(api.auth.register(user)).toFailWithApiError(400, 'validation', 'email');
     */
    async toFailWithApiError(
        received: Promise<unknown>,
        status: number,
        code: string,
        field?: string
    ) {
        const mismatch = apiErrorMismatch(await settle(received), status, code, field);
        const pass = mismatch === undefined;
        const expected = describeError(status, code, field);
        const hint = this.utils.matcherHint('toFailWithApiError', 'call', 'error', {
            isNot: this.isNot,
        });
        const message = () =>
            pass
                ? `${hint}\n\nExpected the call not to fail with ${expected}`
                : `${hint}\n\nExpected: ${expected}\n${mismatch}`;
        return { pass, message, name: 'toFailWithApiError', expected };
    },
});
