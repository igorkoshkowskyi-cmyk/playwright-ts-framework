/** Same formatting as the app: 1250 cents -> "12.50". */
export const formatCents = (cents: number): string => (cents / 100).toFixed(2);
