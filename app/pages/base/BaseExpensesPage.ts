import { expect, type Locator, type Page, type Response } from '@playwright/test';
import type { ExpenseForm, ExpensesPage } from '../interfaces/ExpensesPage';
import { BasePage } from './BasePage';

/**
 * Shared implementation of the expenses page. Locators describe one DOM and live here;
 * what differs per screen type (how to reach the form, the account menu and one expense)
 * is left abstract for the web, tablet and mobile classes.
 */
export abstract class BaseExpensesPage extends BasePage implements ExpensesPage {
    protected override readonly path = '/expenses';
    readonly menuToggle: Locator;
    readonly userName: Locator;
    readonly signOutButton: Locator;
    readonly newExpenseToggle: Locator;
    readonly form: Locator;
    readonly titleInput: Locator;
    readonly amountInput: Locator;
    readonly categorySelect: Locator;
    readonly dateInput: Locator;
    readonly submit: Locator;
    readonly error: Locator;
    readonly list: Locator;
    readonly emptyState: Locator;
    readonly table: Locator;
    readonly cards: Locator;
    readonly total: Locator;

    constructor(page: Page) {
        super(page);
        this.menuToggle = page.getByRole('button', { name: 'Menu' });
        this.userName = page.getByTestId('user-name');
        this.signOutButton = page.getByRole('button', { name: 'Sign out' });
        this.newExpenseToggle = page.getByRole('button', { name: 'New expense' });
        this.form = page.getByRole('form', { name: 'Add expense' });
        this.titleInput = page.getByLabel('Title');
        this.amountInput = page.getByLabel('Amount');
        this.categorySelect = page.getByLabel('Category');
        this.dateInput = page.getByLabel('Date');
        this.submit = page.getByRole('button', { name: 'Add expense' });
        this.error = page.getByRole('alert');
        this.list = page.getByRole('region', { name: 'Expense list' });
        this.emptyState = page.getByText('No expenses yet');
        this.table = page.getByRole('table', { name: 'Expenses' });
        this.cards = page.getByRole('list', { name: 'Expenses' });
        this.total = page.getByRole('status', { name: 'Total' });
    }

    abstract openForm(): Promise<void>;
    abstract openAccountMenu(): Promise<void>;
    abstract item(title: string): Locator;

    /**
     * Waits for the first list load. Without this guard a fast test can add an expense
     * before the initial list arrives, and the late list render would hide it.
     */
    override async open(): Promise<void> {
        await super.open();
        await expect(this.list).toHaveAttribute('aria-busy', 'false');
    }

    async fillForm(form: ExpenseForm): Promise<void> {
        await this.openForm();
        await this.titleInput.fill(form.title);
        await this.amountInput.fill(form.amount);
        await this.categorySelect.selectOption(form.category);
        await this.dateInput.fill(form.spentOn);
    }

    async add(form: ExpenseForm): Promise<Response> {
        await this.fillForm(form);
        return this.clickAndWaitForApi(this.submit, 'POST', '/api/expenses');
    }

    async delete(title: string): Promise<Response> {
        const deleteButton = this.item(title).getByRole('button', { name: `Delete ${title}` });
        // the page knows the title, not the id: any DELETE /api/expenses/:id
        return this.clickAndWaitForApi(deleteButton, 'DELETE', /^\/api\/expenses\/\d+$/);
    }

    async signOut(): Promise<void> {
        await this.openAccountMenu();
        await this.signOutButton.click();
    }

    // building blocks the screen types combine

    protected tableRow(title: string): Locator {
        return this.table.getByRole('row').filter({ hasText: title });
    }

    protected card(title: string): Locator {
        return this.cards.getByRole('listitem').filter({ hasText: title });
    }

    /** Opens a disclosure button unless it is already open. */
    protected async expand(toggle: Locator): Promise<void> {
        if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
            await toggle.click();
        }
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    }
}
