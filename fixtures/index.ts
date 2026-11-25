import { mergeTests } from '@playwright/test';
import { test as apiTest } from './api';
import { test as appTest } from './app';

/** The one test object every spec imports: accounts, API, DB, cleanup and page objects. */
export const test = mergeTests(apiTest, appTest);
export { expect } from '@playwright/test';
