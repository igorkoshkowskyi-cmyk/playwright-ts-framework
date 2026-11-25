// Values come from the environment: the workflow sets them in CI, playwright.config.ts loads .env
// locally. A missing value fails at the point of use with a message that says what to do.

export function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not set: copy .env.example to .env, or set it in CI.`);
    }
    return value;
}

export function requirePort(name: string): number {
    const port = Number(requireEnv(name));
    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
        throw new Error(`${name} must be a port number, got "${process.env[name]}".`);
    }
    return port;
}
