/**
 * User-friendly error messages for authentication errors.
 * Maps AuthErrorCode values to displayable strings for UI components.
 */

import { AuthErrorCode } from "./auth-error";

/**
 * Mapping of AuthErrorCode to user-friendly messages.
 */
const ERROR_MESSAGES = {
    [AuthErrorCode.INVALID_CREDENTIALS]: "Invalid email or password. Please try again.",
    [AuthErrorCode.SESSION_EXPIRED]: "Your session has expired. Please sign in again.",
    [AuthErrorCode.USER_NOT_FOUND]: "No account found with this email.",
    [AuthErrorCode.EMAIL_NOT_CONFIRMED]: "Please check your email to confirm your account.",
    [AuthErrorCode.WEAK_PASSWORD]: "Password is too weak. Please choose a stronger password.",
    [AuthErrorCode.EMAIL_TAKEN]: "An account with this email already exists.",
    [AuthErrorCode.INVALID_TOKEN]: "The verification code is invalid or has expired.",
    [AuthErrorCode.RATE_LIMITED]: "Too many attempts. Please wait a moment and try again.",
    [AuthErrorCode.UNKNOWN_ERROR]: "An unexpected error occurred. Please try again.",
} as const;

/**
 * Get a user-friendly message for an authentication error code.
 *
 * @param code - The AuthErrorCode to get a message for
 * @returns A user-friendly error message string
 *
 * @example
 * ```typescript
 * import { getAuthErrorMessage, isAuthError } from '@/lib/auth';
 *
 * try {
 *     await authProvider.signIn(credentials);
 * } catch (error) {
 *     if (isAuthError(error)) {
 *         toast.error(getAuthErrorMessage(error.code));
 *     }
 * }
 * ```
 */
export function getAuthErrorMessage(code: AuthErrorCode): string {
    return ERROR_MESSAGES[code] ?? ERROR_MESSAGES[AuthErrorCode.UNKNOWN_ERROR];
}
