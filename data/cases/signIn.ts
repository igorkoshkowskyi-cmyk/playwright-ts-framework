import type { Credentials } from '../../api/types';

/** One row of a data-driven sign-in test: the case name and how to spoil the account's credentials. */
export interface CredentialsCase {
    name: string;
    credentials: (account: Credentials) => Credentials;
}

const UNKNOWN_EMAIL = 'nobody@example.test';
const WRONG_PASSWORD = 'Wrong-Passw0rd';

/** Filled in but wrong: the request reaches the server, which answers 401. */
export const WRONG_CREDENTIALS: readonly CredentialsCase[] = [
    {
        name: 'an unknown email',
        credentials: ({ password }) => ({ email: UNKNOWN_EMAIL, password }),
    },
    {
        name: 'a wrong password',
        credentials: ({ email }) => ({ email, password: WRONG_PASSWORD }),
    },
    {
        name: 'an unknown email and a wrong password',
        credentials: () => ({ email: UNKNOWN_EMAIL, password: WRONG_PASSWORD }),
    },
];

/** Left empty: the page stops these before any request; the API answers them with 401 too. */
export const EMPTY_CREDENTIALS: readonly CredentialsCase[] = [
    {
        name: 'an empty email',
        credentials: ({ password }) => ({ email: '', password }),
    },
    {
        name: 'an empty password',
        credentials: ({ email }) => ({ email, password: '' }),
    },
    {
        name: 'empty email and password',
        credentials: () => ({ email: '', password: '' }),
    },
];
