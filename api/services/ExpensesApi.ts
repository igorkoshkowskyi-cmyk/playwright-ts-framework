import type { APIRequestContext } from '@playwright/test';
import { BaseApiService } from '../BaseApiService';
import { unwrap } from '../http';
import type { Expense, ExpenseInput, ExpenseList } from '../types';

export class ExpensesApi extends BaseApiService<ExpenseInput, Expense> {
    constructor(request: APIRequestContext) {
        super(request, '/api/expenses');
    }

    async list(): Promise<ExpenseList> {
        return unwrap<ExpenseList>(await this.request.get(this.basePath));
    }
}
