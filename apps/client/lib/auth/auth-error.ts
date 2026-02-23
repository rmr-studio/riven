/**
 * Authentication error handling.
 * Provides typed error codes and a type guard for safe error narrowing.
 */

/**
 * Enumeration of authentication-specific error codes.
 * Adapters map provider errors to these codes for consistent handling.
 */
export enum AuthErrorCode {
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    SESSION_EXPIRED = "SESSION_EXPIRED",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    EMAIL_NOT_CONFIRMED = "EMAIL_NOT_CONFIRMED",
    WEAK_PASSWORD = "WEAK_PASSWORD",
    EMAIL_TAKEN = "EMAIL_TAKEN",
    INVALID_TOKEN = "INVALID_TOKEN",
    RATE_LIMITED = "RATE_LIMITED",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Custom error class for authentication failures.
 * Extends Error with a typed code and optional hint for UI display.
 *
 * @example
 * ```typescript
 * throw new AuthError(
 *     "Invalid email or password",
 *     AuthErrorCode.INVALID_CREDENTIALS,
 *     "Check your credentials and try again"
 * );
 * ```
 */
export class AuthError extends Error {
    /**
     * The original error that caused this AuthError.
     * Useful for debugging and preserving error context.
     */
    public cause?: unknown;

    constructor(
        message: string,
        public readonly code: AuthErrorCode,
        public readonly hint?: string
    ) {
        super(message);
        this.name = "AuthError";
        // Fix prototype chain for instanceof checks in ES5 environments
        Object.setPrototypeOf(this, AuthError.prototype);
    }
}

/**
 * Type guard to check if an unknown error is an AuthError.
 * Enables safe error narrowing in catch blocks.
 *
 * @example
 * ```typescript
 * try {
 *     await authProvider.signIn(credentials);
 * } catch (error) {
 *     if (isAuthError(error)) {
 *         // error is AuthError here
 *         console.log(error.code, error.hint);
 *     }
 * }
 * ```
 */
export function isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError;
}
