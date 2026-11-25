import type { Page } from '@playwright/test';
import type { ExpensesPage } from './ExpensesPage';
import type { LoginPage } from './LoginPage';
import type { RegisterPage } from './RegisterPage';

type PageClass<T> = new (page: Page) => T;

/** The page objects of one screen type: each device folder exports one PageSet. */
export interface PageSet {
    login: PageClass<LoginPage>;
    register: PageClass<RegisterPage>;
    expenses: PageClass<ExpensesPage>;
}
