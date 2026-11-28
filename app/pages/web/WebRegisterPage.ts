import type { Locator, Page, Response } from '@playwright/test';
import type { RegisterInput } from '../../../api/types';
import { BasePage } from '../base/BasePage';
import type { RegisterPage } from '../interfaces/RegisterPage';

/** Registration page, 1024 px and wider. */
export class WebRegisterPage extends BasePage implements RegisterPage {
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

    async fillRegisterData(user: RegisterInput) {
        await this.name.fill(user.name);
        await this.email.fill(user.email);
        await this.password.fill(user.password);
    }

    async register(user: RegisterInput): Promise<Response> {
        await this.fillRegisterData(user);
        return this.clickAndWaitForApi(this.submit, 'POST', '/api/auth/register');
    }
}
