import type { PageSet } from '../interfaces/PageSet';
import { MobileExpensesPage } from './MobileExpensesPage';
import { MobileLoginPage } from './MobileLoginPage';
import { MobileRegisterPage } from './MobileRegisterPage';

/** Every page object of the mobile screen type. */
export const mobilePages: PageSet = {
    login: MobileLoginPage,
    register: MobileRegisterPage,
    expenses: MobileExpensesPage,
};
