import type { Locator } from '@playwright/test';
import { BaseExpensesPage } from '../base/BaseExpensesPage';

/** Expenses page, 1024 px and wider: the form and the account area are always on screen, expenses in a table. */
export class WebExpensesPage extends BaseExpensesPage {
    override async openForm(): Promise<void> {
        // always visible on this screen
    }

    override async openAccountMenu(): Promise<void> {
        // always visible on this screen
    }

    override item(title: string): Locator {
        return this.tableRow(title);
    }
}
