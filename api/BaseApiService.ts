import type { APIRequestContext } from '@playwright/test';
import { unwrap } from './http';

/** CRUD over one REST resource: POST /resource, GET, PUT and DELETE /resource/:id. */
export abstract class BaseApiService<TInput, TEntity extends { id: number }> {
    protected constructor(
        protected readonly request: APIRequestContext,
        protected readonly basePath: string
    ) {}

    async create(input: TInput): Promise<TEntity> {
        return unwrap<TEntity>(await this.request.post(this.basePath, { data: input }));
    }

    async getById(id: number): Promise<TEntity> {
        return unwrap<TEntity>(await this.request.get(`${this.basePath}/${id}`));
    }

    async update(id: number, input: TInput): Promise<TEntity> {
        return unwrap<TEntity>(await this.request.put(`${this.basePath}/${id}`, { data: input }));
    }

    async delete(id: number) {
        // 204 No Content: only the status matters, unwrap throws ApiError on anything else
        await unwrap(await this.request.delete(`${this.basePath}/${id}`));
    }
}
