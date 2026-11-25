import type { Locator, Page, Response } from '@playwright/test';
import type { RegisterInput } from '../../../api/types';
import type { RegisterPage } from '../interfaces/RegisterPage';
import { BasePage } from './BasePage';

/** Shared implementation of the registration page; the device classes extend it. */
export abstract class BaseRegisterPage extends BasePage implements RegisterPage {
    protected override readonly path = '/register';
    readonly name: Locator;
    readonly email: Locator;
    readonly password: Locator;
    readonly submit: Locator;
    readonly error: Locator;

    constructor(page: Page) {
        super(page);
        this.name = page.getByLabel('Name');
        this.email = page.getByLabel('Email');
        this.password = page.getByLabel('Password');
        this.submit = page.getByRole('button', { name: 'Create account' });
        this.error = page.getByRole('alert');
    }

    async fill(user: RegisterInput): Promise<void> {
        await this.name.fill(user.name);
        await this.email.fill(user.email);
        await this.password.fill(user.password);
    }

    async register(user: RegisterInput): Promise<Response> {
        await this.fill(user);
        return this.clickAndWaitForApi(this.submit, 'POST', '/api/auth/register');
    }
}
