export interface User {
    id: number;
    email: string;
    name: string;
}

export interface Credentials {
    email: string;
    password: string;
}

export interface RegisterInput extends Credentials {
    name: string;
}

export const CATEGORIES = ['food', 'transport', 'housing', 'health', 'fun', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface ExpenseInput {
    title: string;
    amountCents: number;
    category: Category;
    spentOn: string;
}

export interface Expense extends ExpenseInput {
    id: number;
    createdAt: string;
}

export interface ExpenseList {
    items: Expense[];
    totalCents: number;
}
