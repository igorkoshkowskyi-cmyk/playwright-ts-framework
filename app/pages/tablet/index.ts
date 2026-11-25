import type { PageSet } from '../interfaces/PageSet';
import { TabletExpensesPage } from './TabletExpensesPage';
import { TabletLoginPage } from './TabletLoginPage';
import { TabletRegisterPage } from './TabletRegisterPage';

/** Every page object of the tablet screen type. */
export const tabletPages: PageSet = {
    login: TabletLoginPage,
    register: TabletRegisterPage,
    expenses: TabletExpensesPage,
};
