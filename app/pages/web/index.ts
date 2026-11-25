import type { PageSet } from '../interfaces/PageSet';
import { WebExpensesPage } from './WebExpensesPage';
import { WebLoginPage } from './WebLoginPage';
import { WebRegisterPage } from './WebRegisterPage';

/** Every page object of the web screen type. */
export const webPages: PageSet = {
    login: WebLoginPage,
    register: WebRegisterPage,
    expenses: WebExpensesPage,
};
