import type { RegisterInput } from '../../api/types';

/** One row of a data-driven registration test: what to spoil and which field the API must name. */
export interface InvalidRegistration {
    name: string;
    input: Partial<RegisterInput>;
    field: keyof RegisterInput;
}

/**
 * Boundary values of the registration rules: a name of 1 to 50 characters, a valid email,
 * a password of at least 8 characters.
 */
export const INVALID_REGISTRATIONS: readonly InvalidRegistration[] = [
    { name: 'an empty name', input: { name: '' }, field: 'name' },
    { name: 'a name of 51 characters', input: { name: 'n'.repeat(51) }, field: 'name' },
    { name: 'an email without @', input: { email: 'not-an-email' }, field: 'email' },
    { name: 'a password of 7 characters', input: { password: 'Pass-07' }, field: 'password' },
];
