---
phase: 01-interface-types
plan: 01
subsystem: authentication
tags: [typescript, interfaces, types, discriminated-unions, error-handling]

dependency-graph:
  requires: []
  provides: [AuthProvider interface, Session/User types, SignInCredentials, AuthError]
  affects: [02-supabase-adapter, 03-context-provider]

tech-stack:
  added: []
  patterns: [discriminated-unions, type-guards, class-based-errors, barrel-exports]

key-files:
  created:
    - lib/auth/auth.types.ts
    - lib/auth/auth-error.ts
    - lib/auth/auth-provider.interface.ts
    - lib/auth/index.ts
  modified: []

decisions:
  - id: async-only
    choice: All methods return Promise<T>
    rationale: Consistent API regardless of implementation, adapters can make network calls

metrics:
  duration: ~3 minutes
  completed: 2026-01-23
---

# Phase 1 Plan 1: Auth Interface & Types Summary

**One-liner:** Provider-agnostic AuthProvider interface with discriminated SignInCredentials and AuthError class for typed error handling.

## What Was Built

### lib/auth/auth.types.ts
Core domain types for authentication:
- `Session` - access token, expiry timestamp, user reference
- `User` - id, email, metadata (provider-specific data bucket)
- `SignInCredentials` - discriminated union (password | otp | phone)
- `SignUpCredentials` - email/password registration
- `OAuthProvider` enum (Google, GitHub)
- `OAuthOptions`, `OtpVerificationParams`, `OtpResendParams`
- `AuthChangeEvent` union and `AuthSubscription` interface

### lib/auth/auth-error.ts
Auth-specific error handling:
- `AuthErrorCode` enum with 8 error codes (INVALID_CREDENTIALS, SESSION_EXPIRED, etc.)
- `AuthError` class extending Error with code and optional hint
- `isAuthError()` type guard for safe error narrowing
- Object.setPrototypeOf fix for instanceof checks

### lib/auth/auth-provider.interface.ts
The contract all adapters implement:
- `getSession()`, `getUser()`, `onAuthStateChange()` - session access
- `signIn()`, `signUp()`, `signOut()` - core auth actions
- `signInWithOAuth()` - OAuth provider flow
- `verifyOtp()`, `resendOtp()` - OTP verification
- JSDoc documenting that action methods throw AuthError

### lib/auth/index.ts
Barrel export for single import point:
```typescript
import { AuthProvider, Session, AuthError, isAuthError } from '@/lib/auth';
```

## Patterns Established

1. **Discriminated Unions** - SignInCredentials uses `type` field for exhaustive switch handling
2. **Type Guards** - isAuthError() follows existing isResponseError() pattern
3. **Class-Based Errors** - AuthError mirrors ResponseError approach with enum codes
4. **Barrel Exports** - Single entry point for auth module, `export type` for interfaces

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Method signatures | Direct returns + exceptions | Cleaner API, standard JS error handling |
| Async consistency | All methods return Promise | Adapters can make network calls without interface changes |
| Refresh token | Hidden in adapter | Not exposed in Session type, adapter manages internally |
| OAuth providers | Enum not string union | Type safety, autocomplete, matches codebase conventions |
| Error hints | Optional string field | UI-friendly recovery suggestions |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All checks passed:
- `npx tsc --noEmit lib/auth/index.ts` - clean
- No `@supabase` imports in lib/auth/
- 9 methods on AuthProvider interface
- Discriminated union narrowing verified

## Next Phase Readiness

Phase 2 (Supabase Adapter) can now:
- Import `AuthProvider` interface to implement
- Import domain types for method signatures
- Import `AuthError` and `AuthErrorCode` for error mapping
- All types are provider-agnostic, no Supabase leakage

```typescript
// Phase 2 will create:
class SupabaseAuthAdapter implements AuthProvider {
    async signIn(credentials: SignInCredentials): Promise<Session> {
        // Map Supabase calls to interface
    }
}
```
