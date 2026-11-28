import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import playwright from 'eslint-plugin-playwright';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Local rule: comments must be in English (Cyrillic in a comment is an error).
const commentsInEnglish = {
    rules: {
        'comments-in-english': {
            meta: { type: 'suggestion', messages: { cyrillic: 'Write comments in English.' } },
            create(context) {
                return {
                    Program() {
                        for (const comment of context.sourceCode.getAllComments()) {
                            if (/[Ѐ-ӿ]/.test(comment.value)) {
                                context.report({ loc: comment.loc, messageId: 'cyrillic' });
                            }
                        }
                    },
                };
            },
        },
    },
};

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

    // Applies to every file, including this config and allurerc.mjs.
    {
        plugins: { local: commentsInEnglish },
        rules: { 'local/comments-in-english': 'error' },
    },

    {
        files: ['*.mjs'],
        extends: [eslint.configs.recommended],
        languageOptions: { globals: globals.node },
        rules: { 'no-unused-vars': unusedVars },
    },

    // Type-aware rules for every TypeScript source: each file is checked with its own tsconfig
    // (the root one, or perf/tsconfig.json for the k6 scripts).
    {
        files: ['**/*.ts'],
        extends: [
            eslint.configs.recommended,
            tseslint.configs.strictTypeChecked,
            tseslint.configs.stylisticTypeChecked,
        ],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': unusedVars,
            '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
            '@typescript-eslint/naming-convention': [
                'error',
                { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
                // module constants and lookup tables: BASE_URL, PAGE_SETS, WRONG_CREDENTIALS
                {
                    selector: 'variable',
                    modifiers: ['const', 'global'],
                    format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
                },
                { selector: 'typeLike', format: ['PascalCase'] },
                { selector: 'enumMember', format: ['PascalCase'] },
                { selector: 'import', format: ['camelCase', 'PascalCase'] },
                // names dictated by others: database columns (user_id), HTTP headers, k6 metrics,
                // and k6 check names, which are labels: { 'login: 200': (r) => ... }
                { selector: ['objectLiteralProperty', 'objectLiteralMethod'], format: null },
                { selector: 'typeProperty', format: null },
            ],
        },
    },

    // Playwright rules for everything that runs in Playwright; k6 scripts in perf/ do not.
    {
        files: ['**/*.ts'],
        ignores: ['perf/**'],
        extends: [playwright.configs['flat/recommended']],
        rules: {
            // the async custom matcher from fixtures/expect.ts must be awaited like built-in ones
            'playwright/missing-playwright-await': [
                'error',
                { customMatchers: ['toFailWithApiError'] },
            ],
        },
    },

    // k6 scripts run in the k6 runtime, not in Node
    {
        files: ['perf/**/*.ts'],
        languageOptions: { globals: { __ENV: 'readonly', __VU: 'readonly', __ITER: 'readonly' } },
    },

    eslintConfigPrettier, // must stay last: disables style rules that conflict with Prettier
]);
