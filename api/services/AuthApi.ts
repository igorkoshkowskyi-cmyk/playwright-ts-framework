import type { APIRequestContext } from '@playwright/test';
import { ApiError, unwrap } from '../http';
import type { Credentials, RegisterInput, User } from '../types';

export class AuthApi {
    constructor(private readonly request: APIRequestContext) {}

    /** Creates the user and signs the context in: the session cookie stays in the context. */
    async register(input: RegisterInput): Promise<User> {
        return unwrap<User>(await this.request.post('/api/auth/register', { data: input }));
    }

    async login({ email, password }: Credentials): Promise<User> {
        return unwrap<User>(
            await this.request.post('/api/auth/login', { data: { email, password } })
        );
    }

    async logout() {
        await unwrap(await this.request.post('/api/auth/logout'));
    }

    async currentUser(): Promise<User> {
        return unwrap<User>(await this.request.get('/api/me'));
    }

    /** Find-or-create for test accounts: a taken email means the account already exists. */
    async ensureRegistered(input: RegisterInput) {
        try {
            await this.register(input);
        } catch (error) {
            if (!(error instanceof ApiError && error.status === 409)) {
                throw error;
            }
        }
    }
}
