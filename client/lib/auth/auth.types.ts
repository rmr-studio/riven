/**
 * Provider-agnostic authentication domain types.
 * These types define the contract that all auth adapters must work with.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Authenticated session containing access token and user information.
 * Refresh token is intentionally omitted - adapters manage it internally.
 */
export interface Session {
    access_token: string;
    expires_at: number; // Unix timestamp in seconds
    user: User;
}

/**
 * Authenticated user with minimal required fields.
 * Provider-specific data lives in the metadata field.
 */
export interface User {
    id: string;
    email?: string;
    metadata: Record<string, unknown>; // Provider-specific data
}

// ============================================================================
// Credential Types (Discriminated Union)
// ============================================================================

/**
 * Email/password sign-in credentials.
 */
export type PasswordCredentials = {
    type: "password";
    email: string;
    password: string;
};

/**
 * OTP (one-time password) sign-in credentials.
 * Used when user receives a code via email.
 */
export type OtpCredentials = {
    type: "otp";
    email: string;
    token: string;
};

/**
 * Phone/password sign-in credentials.
 */
export type PhoneCredentials = {
    type: "phone";
    phone: string;
    password: string;
};

/**
 * Discriminated union of all sign-in credential types.
 * Use switch on `type` field for exhaustive handling.
 */
export type SignInCredentials = PasswordCredentials | OtpCredentials | PhoneCredentials;

/**
 * Sign-up credentials (password-only for now).
 */
export interface SignUpCredentials {
    email: string;
    password: string;
}

// ============================================================================
// Sign Up Result Types
// ============================================================================

/**
 * Confirmation method after sign up.
 * - 'otp': User enters a code from email (stays in-app)
 * - 'link': User clicks a confirmation link in email (redirect-based)
 */
export type ConfirmationType = "otp" | "link";

/**
 * Options for sign-up behavior.
 */
export interface SignUpOptions {
    /**
     * How the user should confirm their email.
     * Defaults to 'link' for backward compatibility.
     */
    confirmationType?: ConfirmationType;
}

/**
 * Result of a sign-up operation.
 * Discriminated union allows handling both immediate auth and confirmation flows.
 */
export type SignUpResult =
    | { status: "authenticated"; session: Session }
    | { status: "confirmation_required"; confirmationType: ConfirmationType };

// ============================================================================
// OAuth Types
// ============================================================================

/**
 * Supported OAuth providers.
 */
export enum OAuthProvider {
    Google = "google",
    GitHub = "github",
}

/**
 * Options for OAuth sign-in flow.
 */
export interface OAuthOptions {
    redirectTo?: string;
    scopes?: string[];
}

// ============================================================================
// OTP Verification Types
// ============================================================================

/**
 * Parameters for verifying an OTP code.
 */
export interface OtpVerificationParams {
    email: string;
    token: string;
    type: "signup" | "recovery" | "email_change";
}

/**
 * Parameters for resending an OTP code.
 */
export interface OtpResendParams {
    email: string;
    type: "signup" | "recovery" | "email_change";
}

// ============================================================================
// Auth State Change Types
// ============================================================================

/**
 * Events emitted when authentication state changes.
 */
export type AuthChangeEvent =
    | "INITIAL_SESSION"
    | "SIGNED_IN"
    | "SIGNED_OUT"
    | "TOKEN_REFRESHED"
    | "USER_UPDATED"
    | "PASSWORD_RECOVERY";

/**
 * Subscription handle for auth state change listeners.
 * Call unsubscribe() to stop receiving events.
 */
export interface AuthSubscription {
    unsubscribe: () => void;
}
