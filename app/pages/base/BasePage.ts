import { expect, type Locator, type Page, type Response } from '@playwright/test';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Helpers any page object can use. It holds no locators and no page-specific steps: what a page
 * has and does lives in its screen class, so each screen can differ freely.
 */
export abstract class BasePage {
    protected abstract readonly path: string;

    constructor(readonly page: Page) {}

    async open(): Promise<void> {
        // the forms are plain HTML: no need to wait for images and fonts
        await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
    }

    /**
     * Clicks and returns the API answer the click causes, so the test can check the status
     * and the request the page sent. `path` is the exact URL path or a pattern for it.
     */
    protected async clickAndWaitForApi(
        target: Locator,
        method: HttpMethod,
        path: string | RegExp
    ): Promise<Response> {
        const isExpectedCall = (response: Response): boolean => {
            const { pathname } = new URL(response.url());
            const pathMatches = typeof path === 'string' ? pathname === path : path.test(pathname);
            return pathMatches && response.request().method() === method;
        };
        // The wait is subscribed before the click, so a fast answer is not missed.
        // If the click fails, Promise.all rejects at once and the wait is not left hanging.
        const [response] = await Promise.all([
            this.page.waitForResponse(isExpectedCall),
            target.click(),
        ]);
        return response;
    }

    /** Opens a disclosure button unless it is already open. */
    protected async expand(toggle: Locator): Promise<void> {
        if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
            await toggle.click();
        }
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    }
}
