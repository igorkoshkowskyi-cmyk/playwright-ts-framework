import type { Locator } from '@playwright/test';
import { BaseExpensesPage } from '../base/BaseExpensesPage';

/** Expenses page, 768 to 1023 px: the form opens with "New expense", expenses in a table. */
export class TabletExpensesPage extends BaseExpensesPage {
    override async openForm(): Promise<void> {
        await this.expand(this.newExpenseToggle);
    }

    override async openAccountMenu(): Promise<void> {
        // always visible on this screen
    }

    override item(title: string): Locator {
        return this.tableRow(title);
    }
}
