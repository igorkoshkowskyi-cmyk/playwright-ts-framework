import type { Page } from '@playwright/test';
import { PageFactory, type Device } from './PageFactory';
import type { ExpensesPage } from './pages/interfaces/ExpensesPage';
import type { LoginPage } from './pages/interfaces/LoginPage';
import type { RegisterPage } from './pages/interfaces/RegisterPage';

/**
 * The one page object tests use. It takes the device of the running project
 * (e2e-web, e2e-tablet, e2e-mobile) and holds that screen type's pages behind their
 * interfaces, so a spec runs unchanged on every screen size.
 */
export class App {
    readonly loginPage: LoginPage;
    readonly registerPage: RegisterPage;
    readonly expensesPage: ExpensesPage;

    constructor(page: Page, device: Device) {
        const pages = new PageFactory(page, device);
        this.loginPage = pages.loginPage();
        this.registerPage = pages.registerPage();
        this.expensesPage = pages.expensesPage();
    }
}
