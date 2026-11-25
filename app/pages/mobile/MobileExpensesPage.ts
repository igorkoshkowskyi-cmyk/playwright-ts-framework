import type { Locator } from '@playwright/test';
import { BaseExpensesPage } from '../base/BaseExpensesPage';

/** Expenses page, below 768 px: the form opens with "New expense", expenses are cards, the account area is in "Menu". */
export class MobileExpensesPage extends BaseExpensesPage {
    override async openForm(): Promise<void> {
        await this.expand(this.newExpenseToggle);
    }

    override async openAccountMenu(): Promise<void> {
        await this.expand(this.menuToggle);
    }

    override item(title: string): Locator {
        return this.card(title);
    }
}
