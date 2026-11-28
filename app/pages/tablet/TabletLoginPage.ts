import type { Locator, Page, Response } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import type { LoginPage } from '../interfaces/LoginPage';

/** Sign-in page, 768 to 1023 px. */
export class TabletLoginPage extends BasePage implements LoginPage {
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

    async fillCredentials(email: string, password: string) {
        await this.email.fill(email);
        await this.password.fill(password);
    }

    async signIn(email: string, password: string): Promise<Response> {
        await this.fillCredentials(email, password);
        return this.clickAndWaitForApi(this.submit, 'POST', '/api/auth/login');
    }
}
