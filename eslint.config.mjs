import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import playwright from 'eslint-plugin-playwright';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const unusedVars = ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }];

export default defineConfig([
    globalIgnores([
        'playwright-report/**',
        'blob-report/**',
        'test-results/**',
        'allure-results/**',
        'allure-report/**',
        'playwright/.auth/**',
    ]),
    eslint.configs.recommended,
    {
        files: ['**/*.ts'],
        extends: [tseslint.configs.recommended],
        rules: { '@typescript-eslint/no-unused-vars': unusedVars },
    },
    {
        files: ['*.mjs'],
        languageOptions: { globals: globals.node },
        rules: { 'no-unused-vars': unusedVars },
    },
    // k6 scripts run in the k6 runtime, not in Node
    {
        files: ['perf/**/*.ts'],
        languageOptions: { globals: { __ENV: 'readonly', __VU: 'readonly', __ITER: 'readonly' } },
    },
    {
        files: ['tests/**/*.ts'],
        extends: [playwright.configs['flat/recommended']],
    },
    prettier,
]);
