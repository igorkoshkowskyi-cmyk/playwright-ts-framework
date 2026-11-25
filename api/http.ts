import type { APIResponse } from '@playwright/test';

interface ErrorBody {
    error?: { code?: string; message?: string; field?: string };
}

/** A non-2xx answer, with the fields tests assert on: status, code and the invalid field. */
export class ApiError extends Error {
    override readonly name = 'ApiError';

    constructor(
        readonly status: number,
        readonly code: string | undefined,
        readonly field: string | undefined,
        detail: string
    ) {
        super(`HTTP ${status} ${code ?? 'unknown'}: ${detail}`);
    }
}

/** Returns the parsed body of a 2xx response, or throws ApiError. */
export async function unwrap<T>(response: APIResponse): Promise<T> {
    if (response.status() === 204) {
        return undefined as T;
    }
    const body: unknown = await response.json().catch(() => undefined);
    if (!response.ok()) {
        const error = (body as ErrorBody | undefined)?.error;
        throw new ApiError(
            response.status(),
            error?.code,
            error?.field,
            error?.message ?? response.statusText()
        );
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
