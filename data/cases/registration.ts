import type { RegisterInput } from '../../api/types';

// The registration rules: a name of 1 to 50 characters, a valid email, a password of at least
// 8 characters. Each boundary is checked from both sides: the nearest value that must be
// rejected and the nearest one that must be accepted.

/** One row of a data-driven registration test: what to spoil and which field the API must name. */
export interface InvalidRegistration {
    name: string;
    input: Partial<RegisterInput>;
    field: keyof RegisterInput;
}

/** Just outside the rules: each row must be rejected on its own field. */
export const INVALID_REGISTRATIONS: readonly InvalidRegistration[] = [
    { name: 'an empty name', input: { name: '' }, field: 'name' },
    { name: 'a name of 51 characters', input: { name: 'n'.repeat(51) }, field: 'name' },
    { name: 'an email without @', input: { email: 'not-an-email' }, field: 'email' },
    { name: 'a password of 7 characters', input: { password: 'Pass-07' }, field: 'password' },
];

/** One row of a data-driven registration test: a value the API must accept. */
export interface ValidRegistration {
    name: string;
    input: Partial<RegisterInput>;
}

/** Just inside the rules: the shortest and the longest name, the shortest password. */
export const VALID_REGISTRATIONS: readonly ValidRegistration[] = [
    { name: 'a name of 1 character', input: { name: 'n' } },
    { name: 'a name of 50 characters', input: { name: 'n'.repeat(50) } },
    { name: 'a password of 8 characters', input: { password: 'Pass-008' } },
];
