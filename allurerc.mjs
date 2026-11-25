import { defineConfig } from 'allure';

export default defineConfig({
    name: 'Expense tracker: API, E2E and load tests',
    output: './allure-report',
    historyPath: './allure-history.jsonl',
});
