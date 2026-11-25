import type { Locator, Page, Response } from '@playwright/test';
import type { LoginPage } from '../interfaces/LoginPage';
import { BasePage } from './BasePage';

/** Shared implementation of the sign-in page; the device classes extend it. */
export abstract class BaseLoginPage extends BasePage implements LoginPage {
    protected override readonly path = '/login';
    readonly email: Locator;
    readonly password: Locator;
    readonly submit: Locator;
    readonly error: Locator;

    constructor(page: Page) {
        super(page);
        this.email = page.getByLabel('Email');
        this.password = page.getByLabel('Password');
        this.submit = page.getByRole('button', { name: 'Sign in' });
        this.error = page.getByRole('alert');
    }

    async signIn(email: string, password: string): Promise<Response> {
        await this.email.fill(email);
        await this.password.fill(password);
        return this.clickAndWaitForApi(this.submit, 'POST', '/api/auth/login');
    }
}
