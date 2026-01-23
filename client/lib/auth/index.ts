/**
 * Auth module barrel export.
 * Import all auth types from this single entry point.
 *
 * @example
 * ```typescript
 * import {
 *     AuthProvider,
 *     createAuthProvider,
 *     Session,
 *     User,
 *     SignInCredentials,
 *     AuthError,
 *     AuthErrorCode,
 *     isAuthError,
 * } from '@/lib/auth';
 * ```
 */

// Domain types
export * from "./auth.types";
export * from "./auth-error";
export type { AuthProvider } from "./auth-provider.interface";

// Factory
export { createAuthProvider } from "./factory";

// Adapters (for direct instantiation when needed)
export { SupabaseAuthAdapter } from "./adapters/supabase/supabase-adapter";
