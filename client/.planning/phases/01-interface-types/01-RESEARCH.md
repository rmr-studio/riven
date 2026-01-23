# Phase 1: Interface & Types - Research

**Researched:** 2026-01-23
**Domain:** TypeScript auth interface design, discriminated unions, error modeling
**Confidence:** HIGH

## Summary

This research investigates patterns for designing a provider-agnostic authentication interface in TypeScript. The established approach uses discriminated unions for credential variants, class-based errors with enum codes, and subscription objects with unsubscribe methods for auth state changes.

The codebase already has strong conventions for interface design (feature module pattern with `interface/` directories), error handling (`ResponseError` pattern in `lib/util/error/`), and type guards (`isResponseError` pattern). The auth abstraction should follow these existing patterns while introducing auth-specific types.

**Primary recommendation:** Define the auth interface in `lib/auth/` as a new shared module (not a feature module) since it will be consumed by both the provider and adapter layers. Use discriminated unions for credential types, a custom `AuthError` class with enum codes, and return a subscription object with `unsubscribe()` method for auth state changes.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x | Type definitions | Already in use; strict mode enabled |
| None (pure types) | N/A | Interface-only phase | No runtime dependencies needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | N/A | N/A | This phase defines types only |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Class-based error | Error interface | Classes enable `instanceof` checks and prototype chain; preferred |
| String union for codes | Enum | Both work; enum chosen per user decision for OAuthProvider, apply consistently |

**Installation:**
```bash
# No installation needed - pure TypeScript types
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
└── auth/                           # NEW: Auth abstraction module
    ├── auth-provider.interface.ts  # AuthProvider interface
    ├── auth.types.ts               # Session, User, Credentials types
    ├── auth-error.ts               # AuthError class and error codes
    └── index.ts                    # Barrel export
```

**Rationale:** Place in `lib/auth/` rather than `components/feature-modules/authentication/` because:
1. The interface is infrastructure, not a UI feature
2. It will be consumed by adapters in `lib/` and providers in `components/`
3. Follows existing pattern of `lib/util/` for shared infrastructure
4. Avoids circular dependencies with feature modules

### Pattern 1: Discriminated Union for Credentials
**What:** Use a `type` discriminant field to distinguish credential variants
**When to use:** Always for `signIn()` and `signUp()` credential objects
**Example:**
```typescript
// Source: TypeScript Handbook - Discriminated Unions
// https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html

type PasswordCredentials = {
    type: 'password';
    email: string;
    password: string;
};

type OtpCredentials = {
    type: 'otp';
    email: string;
    token: string;
};

type PhoneCredentials = {
    type: 'phone';
    phone: string;
    password: string;
};

type SignInCredentials = PasswordCredentials | OtpCredentials | PhoneCredentials;

// Usage with exhaustive checking
function signIn(credentials: SignInCredentials): Promise<Session | null> {
    switch (credentials.type) {
        case 'password':
            // TypeScript knows: credentials.email, credentials.password
            return handlePasswordSignIn(credentials);
        case 'otp':
            // TypeScript knows: credentials.email, credentials.token
            return handleOtpSignIn(credentials);
        case 'phone':
            // TypeScript knows: credentials.phone, credentials.password
            return handlePhoneSignIn(credentials);
        default:
            // Exhaustiveness check
            const _exhaustive: never = credentials;
            throw new Error(`Unknown credential type: ${_exhaustive}`);
    }
}
```

### Pattern 2: Subscription Object for Auth State Changes
**What:** Return an object with `unsubscribe()` method, not a raw function
**When to use:** For `onAuthStateChange()` return type
**Example:**
```typescript
// Source: Supabase onAuthStateChange pattern
// https://supabase.com/docs/reference/javascript/auth-onauthstatechange

interface AuthSubscription {
    unsubscribe: () => void;
}

interface AuthProvider {
    onAuthStateChange(
        callback: (event: AuthChangeEvent, session: Session | null) => void
    ): AuthSubscription;
}

// Usage
const subscription = authProvider.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
});

// Cleanup
subscription.unsubscribe();
```

**Rationale:** This mirrors Supabase's existing pattern (`client.auth.onAuthStateChange()` returns `{ data: { subscription } }` where subscription has `unsubscribe()`), making adapter implementation straightforward.

### Pattern 3: Class-Based Error with Enum Code
**What:** Custom error class extending Error with code property and type guard
**When to use:** For all auth errors thrown by the interface
**Example:**
```typescript
// Source: TypeScript custom errors best practices
// https://medium.com/@Nelsonalfonso/understanding-custom-errors-in-typescript-a-complete-guide-f47a1df9354c

enum AuthErrorCode {
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

class AuthError extends Error {
    constructor(
        message: string,
        public readonly code: AuthErrorCode,
        public readonly hint?: string
    ) {
        super(message);
        this.name = 'AuthError';
        // Fix prototype chain for instanceof checks
        Object.setPrototypeOf(this, AuthError.prototype);
    }
}

// Type guard
function isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError;
}
```

### Pattern 4: Async-Only Methods
**What:** All interface methods return Promises, even for potentially synchronous operations
**When to use:** For all AuthProvider methods
**Example:**
```typescript
interface AuthProvider {
    // Even if session is cached, return Promise for consistency
    getSession(): Promise<Session | null>;
    getUser(): Promise<User | null>;

    // Auth actions are inherently async
    signIn(credentials: SignInCredentials): Promise<Session>;
    signOut(): Promise<void>;
}
```

**Rationale:** Per user decision, always async. This ensures:
1. Consistent API regardless of implementation
2. Adapters can make network calls without interface changes
3. Callers always handle the same way (`await` or `.then()`)

### Anti-Patterns to Avoid
- **Response wrappers:** Don't use `{ data, error }` pattern. Direct returns with exceptions per user decision.
- **Sync methods:** Don't make any methods synchronous. Always `Promise<T>`.
- **Exposing refresh tokens:** Don't include `refresh_token` in Session type. Adapter manages internally.
- **Generic error codes:** Don't use HTTP status codes or generic strings. Use auth-specific enum codes.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Exhaustiveness checking | Manual if/else chains | `never` type assertion in switch default | Compiler catches missing cases |
| Type narrowing | Type assertions (`as`) | Type guards (`is`) | Runtime safety, follows codebase convention |
| Error normalization | Ad-hoc error handling | `AuthError` class with `isAuthError` guard | Consistent pattern, matches existing `ResponseError` |
| OAuth provider list | String literals | `enum OAuthProvider` | Type safety, autocomplete, follows user decision |

**Key insight:** The codebase already has patterns for these problems (`isResponseError`, `ResponseError`, enum usage in `lib/types/types.ts`). Apply the same patterns to auth types.

## Common Pitfalls

### Pitfall 1: Forgetting Prototype Chain Fix for Custom Errors
**What goes wrong:** `instanceof AuthError` returns false when error is thrown
**Why it happens:** TypeScript class extends don't automatically fix prototype chain when transpiling to ES5
**How to avoid:** Always call `Object.setPrototypeOf(this, AuthError.prototype)` in constructor
**Warning signs:** Type guard returns true but `instanceof` returns false

### Pitfall 2: Inconsistent Async/Sync Method Mix
**What goes wrong:** Some methods sync, some async, callers confused
**Why it happens:** Temptation to make `getSession()` sync if caching
**How to avoid:** All methods return `Promise<T>` per user decision
**Warning signs:** Interface has mix of `T` and `Promise<T>` return types

### Pitfall 3: Leaky Abstractions in Type Definitions
**What goes wrong:** Types expose provider-specific details (e.g., Supabase's `aal1`/`aal2`)
**Why it happens:** Copying types directly from Supabase instead of designing abstraction
**How to avoid:** Design minimal types that capture the concept, not the implementation
**Warning signs:** Types import from `@supabase/*`, types have provider-specific fields

### Pitfall 4: Missing Exhaustiveness Check
**What goes wrong:** New credential type added but not handled in adapter
**Why it happens:** No `never` assertion in switch default
**How to avoid:** Always include `default: const _: never = value; throw new Error(...)`
**Warning signs:** Switch statement without default case on discriminated union

### Pitfall 5: Optional vs Nullable Confusion
**What goes wrong:** `email?: string` vs `email: string | null` used inconsistently
**Why it happens:** Different semantic meanings not considered
**How to avoid:** Use `| null` for "present but empty", `?` for "may not exist"
**Warning signs:** Mixed use of `?` and `| null` in same interface

## Code Examples

Verified patterns from official sources and codebase conventions:

### Complete AuthProvider Interface
```typescript
// Following codebase conventions from CONVENTIONS.md

/**
 * Provider-agnostic authentication interface.
 * Adapters implement this to normalize different auth backends.
 */
interface AuthProvider {
    // Session/user access
    getSession(): Promise<Session | null>;
    getUser(): Promise<User | null>;
    onAuthStateChange(
        callback: (event: AuthChangeEvent, session: Session | null) => void
    ): AuthSubscription;

    // Auth actions - throw AuthError on failure
    signIn(credentials: SignInCredentials): Promise<Session>;
    signUp(credentials: SignUpCredentials): Promise<Session>;
    signOut(): Promise<void>;
    signInWithOAuth(
        provider: OAuthProvider,
        options?: OAuthOptions
    ): Promise<void>;
    verifyOtp(params: OtpVerificationParams): Promise<Session>;
    resendOtp(params: OtpResendParams): Promise<void>;
}
```

### Session and User Types
```typescript
// Minimal, provider-agnostic types per user decisions

interface Session {
    access_token: string;
    expires_at: number;  // Unix timestamp
    user: User;
}

interface User {
    id: string;
    email: string;
    metadata: Record<string, unknown>;  // Provider-specific data
}
```

### AuthError with Type Guard
```typescript
// Following existing error patterns from lib/util/error/error.util.ts

enum AuthErrorCode {
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

class AuthError extends Error {
    constructor(
        message: string,
        public readonly code: AuthErrorCode,
        public readonly hint?: string
    ) {
        super(message);
        this.name = 'AuthError';
        Object.setPrototypeOf(this, AuthError.prototype);
    }
}

function isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError;
}
```

### Discriminated Union with Exhaustiveness
```typescript
// Source: TypeScript Handbook + codebase conventions

type PasswordCredentials = {
    type: 'password';
    email: string;
    password: string;
};

type OtpCredentials = {
    type: 'otp';
    email: string;
    token: string;
};

type PhoneCredentials = {
    type: 'phone';
    phone: string;
    password: string;
};

type SignInCredentials = PasswordCredentials | OtpCredentials | PhoneCredentials;

// Exhaustive guard function (reusable across codebase)
function assertNever(value: never, message: string): never {
    throw new Error(message);
}
```

### OAuth Types
```typescript
// Following user decision for enum

enum OAuthProvider {
    Google = 'google',
    GitHub = 'github',
}

interface OAuthOptions {
    redirectTo?: string;
    scopes?: string[];
}
```

### Auth State Change Event
```typescript
// Simplified from Supabase's AuthChangeEvent

type AuthChangeEvent =
    | 'SIGNED_IN'
    | 'SIGNED_OUT'
    | 'TOKEN_REFRESHED'
    | 'USER_UPDATED'
    | 'PASSWORD_RECOVERY';

interface AuthSubscription {
    unsubscribe: () => void;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Response wrappers `{ data, error }` | Direct returns + exceptions | User decision | Cleaner API, standard JS error handling |
| `sync` methods for cached data | Always `Promise<T>` | User decision | Consistent interface, future-proof |
| String literals for providers | `enum OAuthProvider` | User decision | Type safety, IDE autocomplete |
| Generic error messages | Enum codes + hint field | User decision | Actionable errors, UI-friendly hints |

**Current (not deprecated):**
- Discriminated unions for variants (TypeScript best practice)
- Class-based custom errors with `Object.setPrototypeOf` fix
- Type guards over type assertions
- `never` type for exhaustiveness checking

## Open Questions

Things that couldn't be fully resolved:

1. **`expires_at` format: Unix timestamp vs ISO string**
   - What we know: Unix timestamp (number) is more common in JWT/auth contexts
   - What's unclear: Whether existing Supabase session uses timestamp or Date
   - Recommendation: Use `number` (Unix timestamp in seconds) for consistency with JWT `exp` claim

2. **Exact AuthChangeEvent values needed**
   - What we know: Supabase has INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, PASSWORD_RECOVERY, MFA_CHALLENGE_VERIFIED
   - What's unclear: Which events the abstraction needs vs provider-specific
   - Recommendation: Start with core events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, PASSWORD_RECOVERY), add others as needed

3. **SignUp credential types - same as SignIn?**
   - What we know: User decision says `signUp(credentials)` parallel to `signIn`
   - What's unclear: Whether phone signup exists, OTP signup semantics
   - Recommendation: Start with password-only `SignUpCredentials`, expand if needed

## Sources

### Primary (HIGH confidence)
- TypeScript Handbook - Discriminated Unions: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
- Supabase onAuthStateChange docs: https://supabase.com/docs/reference/javascript/auth-onauthstatechange
- Supabase signInWithPassword docs: https://supabase.com/docs/reference/javascript/auth-signinwithpassword
- Codebase CONVENTIONS.md - Error handling patterns
- Codebase error.util.ts - ResponseError and isResponseError pattern

### Secondary (MEDIUM confidence)
- Medium article on TypeScript custom errors: https://medium.com/@Nelsonalfonso/understanding-custom-errors-in-typescript-a-complete-guide-f47a1df9354c
- Auth.js Adapter interface: https://authjs.dev/reference/core/adapters

### Tertiary (LOW confidence)
- WebSearch results on auth abstraction patterns (not verified with primary sources)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Pure TypeScript, no external dependencies
- Architecture: HIGH - Follows existing codebase conventions
- Pitfalls: HIGH - Based on documented TypeScript best practices
- Code examples: HIGH - Verified against TypeScript docs and codebase patterns

**Research date:** 2026-01-23
**Valid until:** 60 days (stable domain, no fast-moving dependencies)
