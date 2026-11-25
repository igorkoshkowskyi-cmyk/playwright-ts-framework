import type { APIResponse } from '@playwright/test';

// What can be read safely from any error answer, even one that breaks the contract;
// the contract itself is ApiErrorBody in types.ts and apiErrorSchema in schemas.ts.
interface LooseErrorBody {
    error?: { code?: string; message?: string; field?: string };
}

/**
 * A non-2xx answer, with the fields tests assert on: status, code and the invalid field.
 * The parsed body is kept as well, so a test can check it against the error schema.
 */
export class ApiError extends Error {
    override readonly name = 'ApiError';
    readonly code: string | undefined;
    readonly field: string | undefined;

    constructor(
        readonly status: number,
        readonly body: unknown,
        statusText: string
    ) {
        const error = (body as LooseErrorBody | undefined)?.error;
        super(`HTTP ${status} ${error?.code ?? 'unknown'}: ${error?.message ?? statusText}`);
        this.code = error?.code;
        this.field = error?.field;
    }
}

/** Returns the parsed body of a 2xx response, or throws ApiError. */
export async function unwrap<T>(response: APIResponse): Promise<T> {
    if (response.status() === 204) {
        return undefined as T;
    }
    const body: unknown = await response.json().catch(() => undefined);
    if (!response.ok()) {
        throw new ApiError(response.status(), body, response.statusText());
    }
    return body as T;
}

/** Cleanup helper: deleting something that is already gone is fine, any other error is not. */
export async function ignoreNotFound(action: Promise<unknown>): Promise<void> {
    try {
        await action;
    } catch (error) {
        if (!(error instanceof ApiError && error.status === 404)) {
            throw error;
        }
    }
}
