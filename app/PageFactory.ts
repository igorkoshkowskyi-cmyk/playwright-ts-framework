import type { Page } from '@playwright/test';
import type { ExpensesPage } from './pages/interfaces/ExpensesPage';
import type { LoginPage } from './pages/interfaces/LoginPage';
import type { PageSet } from './pages/interfaces/PageSet';
import type { RegisterPage } from './pages/interfaces/RegisterPage';
import { mobilePages } from './pages/mobile';
import { tabletPages } from './pages/tablet';
import { webPages } from './pages/web';

export const DEVICES = ['web', 'tablet', 'mobile'] as const;
export type Device = (typeof DEVICES)[number];

// a Record over the union: a device without its page set is a compile error
const PAGE_SETS: Record<Device, PageSet> = {
    web: webPages,
    tablet: tabletPages,
    mobile: mobilePages,
};

/** Builds the page objects of one screen type; callers only see the page interfaces. */
export class PageFactory {
    private readonly pages: PageSet;

    constructor(
        private readonly page: Page,
        readonly device: Device
    ) {
        this.pages = PAGE_SETS[device];
    }

    loginPage(): LoginPage {
        return new this.pages.login(this.page);
    }

    registerPage(): RegisterPage {
        return new this.pages.register(this.page);
    }

    expensesPage(): ExpensesPage {
        return new this.pages.expenses(this.page);
    }
}
