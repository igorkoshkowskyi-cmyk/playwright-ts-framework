import type { Locator, Response } from '@playwright/test';
import type { Category } from '../../../api/types';

/** What a user types into the form: the amount is text, as in the input. */
export interface ExpenseForm {
    title: string;
    amount: string;
    category: Category;
    spentOn: string;
}

/** The expenses page as tests see it, on any screen size. */
export interface ExpensesPage {
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

    /** Opens the page and waits until the first list load is rendered. */
    openPage(): Promise<void>;

    /** Makes the add form usable in this layout. */
    openForm(): Promise<void>;

    /** Shows the user name and the sign-out button in this layout. */
    openAccountMenu(): Promise<void>;

    /** One expense as this layout shows it: a table row or a card. */
    item(title: string): Locator;

    fillForm(form: ExpenseForm): Promise<void>;

    /** Fills and submits the form, returns the API response to the create call. */
    add(form: ExpenseForm): Promise<Response>;

    delete(title: string): Promise<Response>;
    signOut(): Promise<void>;
}
