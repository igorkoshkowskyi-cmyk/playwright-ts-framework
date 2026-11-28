import type { Locator, Response } from '@playwright/test';
import type { RegisterInput } from '../../../api/types';

/** The registration page as tests see it, on any screen size. */
export interface RegisterPage {
    readonly name: Locator;
    readonly email: Locator;
    readonly password: Locator;
    readonly submit: Locator;
    readonly error: Locator;

    openPage(): Promise<void>;
    fillRegisterData(user: RegisterInput): Promise<void>;

    /** Submits the form and returns the API answer. */
    register(user: RegisterInput): Promise<Response>;
}
