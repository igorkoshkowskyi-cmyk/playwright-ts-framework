import type { Locator, Response } from '@playwright/test';

/** The sign-in page as tests see it, on any screen size. */
export interface LoginPage {
    readonly email: Locator;
    readonly password: Locator;
    readonly submit: Locator;
    readonly error: Locator;

    open(): Promise<void>;

    /** Types the credentials without submitting: for checks of what the form itself does. */
    fill(email: string, password: string): Promise<void>;

    /** Fills and submits the form, returns the API answer: the test decides what success means. */
    signIn(email: string, password: string): Promise<Response>;
}
