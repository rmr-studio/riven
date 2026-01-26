/**
 * Supabase error to AuthError translation.
 * Centralizes all error mapping logic for consistent error handling throughout the adapter.
 */

import { isAuthError as isSupabaseAuthError } from '@supabase/supabase-js';
import { AuthError, AuthErrorCode } from '../../auth-error';

/**
 * Maps Supabase error codes to AuthErrorCode.
 * Based on Supabase SDK error-codes.d.ts and official documentation.
 */
const ERROR_CODE_MAP: Record<string, AuthErrorCode> = {
  // Credentials errors
  invalid_credentials: AuthErrorCode.INVALID_CREDENTIALS,

  // Session errors
  session_expired: AuthErrorCode.SESSION_EXPIRED,
  session_not_found: AuthErrorCode.SESSION_EXPIRED,
  refresh_token_not_found: AuthErrorCode.SESSION_EXPIRED,
  refresh_token_already_used: AuthErrorCode.SESSION_EXPIRED,

  // User errors
  user_not_found: AuthErrorCode.USER_NOT_FOUND,

  // Email confirmation
  email_not_confirmed: AuthErrorCode.EMAIL_NOT_CONFIRMED,

  // Password errors
  weak_password: AuthErrorCode.WEAK_PASSWORD,

  // Registration errors
  email_exists: AuthErrorCode.EMAIL_TAKEN,
  user_already_exists: AuthErrorCode.EMAIL_TAKEN,

  // Token errors
  bad_jwt: AuthErrorCode.INVALID_TOKEN,
  otp_expired: AuthErrorCode.INVALID_TOKEN,
  flow_state_expired: AuthErrorCode.INVALID_TOKEN,
  bad_code_verifier: AuthErrorCode.INVALID_TOKEN,

  // Rate limit errors
  over_request_rate_limit: AuthErrorCode.RATE_LIMITED,
  over_email_send_rate_limit: AuthErrorCode.RATE_LIMITED,
  over_sms_send_rate_limit: AuthErrorCode.RATE_LIMITED,
};

/**
 * Maps a Supabase error to an AuthError.
 * Preserves the original error as the `cause` property for debugging.
 *
 * @param error - The error from Supabase SDK (can be any type)
 * @returns An AuthError with appropriate code and hint
 */
export function mapSupabaseError(error: unknown): AuthError {
  // Handle Supabase AuthError
  if (isSupabaseAuthError(error)) {
    const code = error.code ?? '';
    const mappedCode = ERROR_CODE_MAP[code] ?? AuthErrorCode.UNKNOWN_ERROR;

    const authError = new AuthError(error.message, mappedCode, getHintForCode(mappedCode));

    // Preserve original error for debugging
    authError.cause = error;

    return authError;
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    const authError = new AuthError(error.message, AuthErrorCode.UNKNOWN_ERROR);
    authError.cause = error;
    return authError;
  }

  // Handle unknown error types
  return new AuthError('An unknown authentication error occurred', AuthErrorCode.UNKNOWN_ERROR);
}

/**
 * Returns a user-friendly hint for common error codes.
 *
 * @param code - The AuthErrorCode
 * @returns A hint string or undefined if no hint is available
 */
function getHintForCode(code: AuthErrorCode): string | undefined {
  switch (code) {
    case AuthErrorCode.INVALID_CREDENTIALS:
      return 'Check your email and password';
    case AuthErrorCode.EMAIL_NOT_CONFIRMED:
      return 'Please verify your email address';
    case AuthErrorCode.WEAK_PASSWORD:
      return 'Password does not meet strength requirements';
    case AuthErrorCode.EMAIL_TAKEN:
      return 'An account with this email already exists';
    case AuthErrorCode.SESSION_EXPIRED:
      return 'Please sign in again';
    case AuthErrorCode.RATE_LIMITED:
      return 'Too many requests. Please wait and try again';
    case AuthErrorCode.INVALID_TOKEN:
      return 'The code is invalid or has expired';
    default:
      return undefined;
  }
}
