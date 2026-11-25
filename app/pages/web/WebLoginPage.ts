import type { Locator, Page, Response } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import type { LoginPage } from '../interfaces/LoginPage';

/** Sign-in page, 1024 px and wider. */
export class WebLoginPage extends BasePage implements LoginPage {
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

    async fill(email: string, password: string): Promise<void> {
        await this.email.fill(email);
        await this.password.fill(password);
    }

    async signIn(email: string, password: string): Promise<Response> {
        await this.fill(email, password);
        return this.clickAndWaitForApi(this.submit, 'POST', '/api/auth/login');
    }
}
