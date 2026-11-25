import type { APIRequestContext } from '@playwright/test';
import { AuthApi } from './services/AuthApi';
import { ExpensesApi } from './services/ExpensesApi';

/** API container: one entry point to every service, so tests never build URLs or parse JSON. */
export class ApiClient {
    readonly auth: AuthApi;
    readonly expenses: ExpensesApi;

    constructor(request: APIRequestContext) {
        this.auth = new AuthApi(request);
        this.expenses = new ExpensesApi(request);
    }
}
