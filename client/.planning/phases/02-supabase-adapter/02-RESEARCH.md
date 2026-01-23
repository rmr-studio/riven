# Phase 2: Supabase Adapter - Research

**Researched:** 2026-01-23
**Domain:** Supabase Auth SDK, Adapter Pattern, Factory Pattern
**Confidence:** HIGH

## Summary

This phase implements a SupabaseAuthAdapter class that wraps the existing Supabase client to conform to the AuthProvider interface defined in Phase 1. The research focuses on mapping Supabase's auth types to our domain types, translating Supabase error codes to AuthErrorCode, and implementing a factory with environment variable configuration.

The codebase already uses `@supabase/supabase-js` v2.50.0 with `@supabase/ssr` v0.6.1. The existing auth patterns in `components/feature-modules/authentication/` demonstrate real usage that the adapter must support. The Supabase SDK provides comprehensive TypeScript types and error codes that can be mapped directly to our domain types.

**Primary recommendation:** Implement the adapter as a class with internal singleton client, explicit mapper functions for type translation, and a centralized error mapper that preserves original errors as `cause`.

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.50.0 | Supabase client SDK | Already in use throughout codebase |
| @supabase/ssr | 0.6.1 | SSR-compatible client creation | Already used for `createBrowserClient` |

### No Additional Dependencies Required

The adapter implementation uses only existing dependencies. No new packages needed.

## Architecture Patterns

### Recommended File Structure

```
lib/auth/
├── index.ts                      # Barrel export (exists)
├── auth.types.ts                 # Domain types (exists)
├── auth-error.ts                 # AuthError class (exists)
├── auth-provider.interface.ts    # AuthProvider interface (exists)
├── adapters/
│   └── supabase/
│       ├── supabase-adapter.ts   # SupabaseAuthAdapter class
│       ├── mappers.ts            # Type mapping functions
│       └── error-mapper.ts       # Error code translation
└── factory.ts                    # createAuthProvider() factory
```

### Pattern 1: Adapter Class with Internal Client Singleton

**What:** Adapter creates and manages its own Supabase client instance internally.

**When to use:** When adapter needs full control over client lifecycle and configuration.

**Implementation:**

```typescript
// lib/auth/adapters/supabase/supabase-adapter.ts
import { createBrowserClient, SupabaseClient } from "@supabase/ssr";
import { AuthProvider } from "../../auth-provider.interface";
import { Session, User, SignInCredentials } from "../../auth.types";
import { mapSupabaseSession, mapSupabaseUser } from "./mappers";
import { mapSupabaseError } from "./error-mapper";

export class SupabaseAuthAdapter implements AuthProvider {
    private readonly client: SupabaseClient;

    constructor() {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key) {
            throw new Error(
                "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
            );
        }

        this.client = createBrowserClient(url, key, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
            },
        });
    }

    /**
     * Expose underlying client for escape hatches.
     * Use sparingly - prefer interface methods.
     */
    get supabaseClient(): SupabaseClient {
        return this.client;
    }

    // ... interface method implementations
}
```

**Why this pattern:**
- Encapsulates client creation - adapter owns its dependencies
- Fail-fast on missing env vars at construction time
- Exposes escape hatch via getter for edge cases
- Matches CONTEXT.md decision: "internal singleton for Supabase client"

### Pattern 2: Type Mapper Functions

**What:** Explicit functions that transform Supabase types to domain types.

**When to use:** Every method that returns domain types from Supabase responses.

**Implementation:**

```typescript
// lib/auth/adapters/supabase/mappers.ts
import { Session as SupabaseSession, User as SupabaseUser } from "@supabase/supabase-js";
import { Session, User } from "../../auth.types";

/**
 * Maps Supabase Session to domain Session.
 * Omits refresh_token (managed internally by adapter).
 */
export function mapSupabaseSession(supabaseSession: SupabaseSession): Session {
    return {
        access_token: supabaseSession.access_token,
        expires_at: supabaseSession.expires_at ?? Math.floor(Date.now() / 1000) + supabaseSession.expires_in,
        user: mapSupabaseUser(supabaseSession.user),
    };
}

/**
 * Maps Supabase User to domain User.
 * Preserves user_metadata as metadata field.
 */
export function mapSupabaseUser(supabaseUser: SupabaseUser): User {
    return {
        id: supabaseUser.id,
        email: supabaseUser.email ?? "",
        metadata: supabaseUser.user_metadata ?? {},
    };
}
```

**Why this pattern:**
- Testable in isolation
- Single point of transformation
- Explicit about what's mapped and what's omitted
- Matches CONTEXT.md decision: "Explicit mapper functions"

### Pattern 3: Centralized Error Mapper

**What:** Single function that translates all Supabase errors to AuthError.

**When to use:** In every catch block or error check in adapter methods.

**Implementation:**

```typescript
// lib/auth/adapters/supabase/error-mapper.ts
import { AuthError as SupabaseAuthError, isAuthError as isSupabaseAuthError } from "@supabase/supabase-js";
import { AuthError, AuthErrorCode } from "../../auth-error";

/**
 * Maps Supabase error codes to AuthErrorCode.
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
};

/**
 * Maps a Supabase error to AuthError.
 * Preserves original error as cause property.
 */
export function mapSupabaseError(error: unknown): AuthError {
    // Handle Supabase AuthError
    if (isSupabaseAuthError(error)) {
        const code = error.code ?? "";
        const mappedCode = ERROR_CODE_MAP[code] ?? AuthErrorCode.UNKNOWN_ERROR;

        const authError = new AuthError(
            error.message,
            mappedCode,
            getHintForCode(mappedCode)
        );

        // Preserve original error
        authError.cause = error;

        return authError;
    }

    // Handle generic errors
    if (error instanceof Error) {
        const authError = new AuthError(
            error.message,
            AuthErrorCode.UNKNOWN_ERROR
        );
        authError.cause = error;
        return authError;
    }

    // Handle unknown
    return new AuthError(
        "An unknown authentication error occurred",
        AuthErrorCode.UNKNOWN_ERROR
    );
}

function getHintForCode(code: AuthErrorCode): string | undefined {
    switch (code) {
        case AuthErrorCode.INVALID_CREDENTIALS:
            return "Check your email and password";
        case AuthErrorCode.EMAIL_NOT_CONFIRMED:
            return "Please verify your email address";
        case AuthErrorCode.WEAK_PASSWORD:
            return "Password does not meet strength requirements";
        case AuthErrorCode.EMAIL_TAKEN:
            return "An account with this email already exists";
        case AuthErrorCode.SESSION_EXPIRED:
            return "Please sign in again";
        default:
            return undefined;
    }
}
```

**Why this pattern:**
- Single source of truth for error translation
- Preserves original error for debugging
- Provides user-friendly hints
- Matches CONTEXT.md decisions

### Pattern 4: Factory with Singleton Caching

**What:** Factory function that creates and caches the auth provider instance.

**When to use:** Entry point for obtaining auth provider throughout the application.

**Implementation:**

```typescript
// lib/auth/factory.ts
import { AuthProvider } from "./auth-provider.interface";
import { SupabaseAuthAdapter } from "./adapters/supabase/supabase-adapter";

let cachedProvider: AuthProvider | null = null;

/**
 * Creates or returns the cached auth provider instance.
 *
 * Reads AUTH_PROVIDER env var to determine which adapter to use.
 * Currently supports: "supabase"
 *
 * @throws Error if AUTH_PROVIDER is not set or is unknown
 */
export function createAuthProvider(): AuthProvider {
    if (cachedProvider) {
        return cachedProvider;
    }

    const providerType = process.env.AUTH_PROVIDER;

    if (!providerType) {
        throw new Error(
            "AUTH_PROVIDER environment variable is not set. " +
            "Please set it to one of: supabase"
        );
    }

    switch (providerType) {
        case "supabase":
            cachedProvider = new SupabaseAuthAdapter();
            break;
        default:
            throw new Error(
                `Unknown auth provider: "${providerType}". ` +
                `Supported providers: supabase`
            );
    }

    return cachedProvider;
}
```

**Why this pattern:**
- Explicit env var requirement (no default)
- Descriptive errors guide configuration
- Singleton caching prevents multiple clients
- Easy to extend with new providers

### Anti-Patterns to Avoid

- **Direct Supabase type exposure:** Never return Supabase types from adapter methods. Always map to domain types.

- **Silent error swallowing:** Never catch errors without rethrowing as AuthError. The interface contract requires throwing.

- **Async onAuthStateChange callback:** Supabase docs warn against async callbacks. Use synchronous callbacks that schedule async work via setTimeout.

- **Trusting getSession on server:** For server contexts, getUser() should be used for security. This phase is client-only, but document the distinction.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth redirect flow | Custom redirect logic | `signInWithOAuth` + let Supabase handle | Complex PKCE/state management |
| Token refresh | Manual refresh logic | Supabase `autoRefreshToken: true` | Handles edge cases, race conditions |
| Session persistence | Custom storage | Supabase default browser storage | Secure, handles cross-tab sync |
| Rate limit detection | String matching | `error.code === 'over_request_rate_limit'` | Official error codes are stable |

**Key insight:** Supabase SDK handles the complex auth flows internally. The adapter's job is translation, not reimplementation.

## Common Pitfalls

### Pitfall 1: Supabase Session vs Domain Session Type Mismatch

**What goes wrong:** Supabase Session has `expires_at?: number` (optional) while domain Session requires `expires_at: number`.

**Why it happens:** Supabase may return session without expires_at in some edge cases.

**How to avoid:** Calculate from `expires_in` if `expires_at` is missing:
```typescript
expires_at: supabaseSession.expires_at ??
    Math.floor(Date.now() / 1000) + supabaseSession.expires_in
```

**Warning signs:** TypeScript error when directly assigning Supabase session to domain Session.

### Pitfall 2: Supabase User Email is Optional

**What goes wrong:** Supabase User has `email?: string` but domain User requires `email: string`.

**Why it happens:** Supabase supports phone-only auth where email may be absent.

**How to avoid:** Default to empty string or throw if email is required:
```typescript
email: supabaseUser.email ?? ""
```

**Warning signs:** Runtime errors accessing email property on undefined.

### Pitfall 3: OAuth Returns URL, Not Session

**What goes wrong:** Expecting `signInWithOAuth` to return a session immediately.

**Why it happens:** OAuth requires redirect flow; session is established after callback.

**How to avoid:** Interface returns `Promise<void>` because session comes via `onAuthStateChange` after redirect:
```typescript
async signInWithOAuth(provider: OAuthProvider, options?: OAuthOptions): Promise<void> {
    const { data, error } = await this.client.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: options?.redirectTo,
            scopes: options?.scopes?.join(" "),
        },
    });

    if (error) throw mapSupabaseError(error);

    // Browser will redirect to data.url
    if (data.url) {
        window.location.href = data.url;
    }
}
```

**Warning signs:** Tests expecting session return from OAuth method.

### Pitfall 4: Discriminated Union Credential Handling

**What goes wrong:** Forgetting to handle all SignInCredentials variants.

**Why it happens:** TypeScript doesn't enforce exhaustive switch unless configured.

**How to avoid:** Use exhaustive switch with type narrowing:
```typescript
async signIn(credentials: SignInCredentials): Promise<Session> {
    let result;

    switch (credentials.type) {
        case "password":
            result = await this.client.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            });
            break;
        case "otp":
            result = await this.client.auth.verifyOtp({
                email: credentials.email,
                token: credentials.token,
                type: "email",
            });
            break;
        case "phone":
            result = await this.client.auth.signInWithPassword({
                phone: credentials.phone,
                password: credentials.password,
            });
            break;
        default:
            // Exhaustive check
            const _exhaustive: never = credentials;
            throw new Error(`Unhandled credential type: ${_exhaustive}`);
    }

    if (result.error) throw mapSupabaseError(result.error);
    if (!result.data.session) {
        throw new AuthError("No session returned", AuthErrorCode.UNKNOWN_ERROR);
    }

    return mapSupabaseSession(result.data.session);
}
```

**Warning signs:** Runtime "unhandled credential type" errors.

### Pitfall 5: Auth State Change Event Mapping

**What goes wrong:** Supabase emits `INITIAL_SESSION` and `MFA_CHALLENGE_VERIFIED` but domain only has 5 events.

**Why it happens:** Domain AuthChangeEvent is a subset of Supabase events.

**How to avoid:** Map or filter events:
```typescript
onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
): AuthSubscription {
    const { data } = this.client.auth.onAuthStateChange((supabaseEvent, supabaseSession) => {
        // Map Supabase event to domain event (filter unsupported)
        const domainEvent = mapAuthChangeEvent(supabaseEvent);
        if (!domainEvent) return; // Skip unmapped events

        const session = supabaseSession ? mapSupabaseSession(supabaseSession) : null;
        callback(domainEvent, session);
    });

    return { unsubscribe: data.subscription.unsubscribe };
}

function mapAuthChangeEvent(event: string): AuthChangeEvent | null {
    switch (event) {
        case "SIGNED_IN": return "SIGNED_IN";
        case "SIGNED_OUT": return "SIGNED_OUT";
        case "TOKEN_REFRESHED": return "TOKEN_REFRESHED";
        case "USER_UPDATED": return "USER_UPDATED";
        case "PASSWORD_RECOVERY": return "PASSWORD_RECOVERY";
        default: return null; // INITIAL_SESSION, MFA events filtered
    }
}
```

**Warning signs:** TypeScript errors on event assignment.

### Pitfall 6: Rate Limit Error Code Missing from AuthErrorCode

**What goes wrong:** CONTEXT.md mentions RATE_LIMITED but AuthErrorCode enum doesn't include it.

**Why it happens:** Phase 1 AuthErrorCode was defined before discussing rate limiting.

**How to avoid:** Either add RATE_LIMITED to AuthErrorCode enum OR map rate limit errors to UNKNOWN_ERROR. Per CONTEXT.md decision, add RATE_LIMITED:
```typescript
// Need to update auth-error.ts to add:
export enum AuthErrorCode {
    // ... existing codes
    RATE_LIMITED = "RATE_LIMITED",
}

// Then in error-mapper.ts:
const ERROR_CODE_MAP: Record<string, AuthErrorCode> = {
    // ... existing mappings
    over_request_rate_limit: AuthErrorCode.RATE_LIMITED,
    over_email_send_rate_limit: AuthErrorCode.RATE_LIMITED,
    over_sms_send_rate_limit: AuthErrorCode.RATE_LIMITED,
};
```

**Warning signs:** Rate limit errors showing as UNKNOWN_ERROR.

## Code Examples

### Complete signIn Implementation

```typescript
// Source: Supabase official types + codebase patterns
async signIn(credentials: SignInCredentials): Promise<Session> {
    let result: AuthTokenResponsePassword;

    switch (credentials.type) {
        case "password":
            result = await this.client.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            });
            break;
        case "otp":
            result = await this.client.auth.verifyOtp({
                email: credentials.email,
                token: credentials.token,
                type: "email",
            });
            break;
        case "phone":
            result = await this.client.auth.signInWithPassword({
                phone: credentials.phone,
                password: credentials.password,
            });
            break;
        default:
            const _exhaustive: never = credentials;
            throw new Error(`Unhandled credential type: ${_exhaustive}`);
    }

    if (result.error) {
        throw mapSupabaseError(result.error);
    }

    if (!result.data.session) {
        throw new AuthError(
            "Authentication succeeded but no session was returned",
            AuthErrorCode.UNKNOWN_ERROR
        );
    }

    return mapSupabaseSession(result.data.session);
}
```

### Complete signUp Implementation

```typescript
// Source: Existing Register.tsx pattern
async signUp(credentials: SignUpCredentials): Promise<Session> {
    const { data, error } = await this.client.auth.signUp({
        email: credentials.email,
        password: credentials.password,
    });

    if (error) {
        throw mapSupabaseError(error);
    }

    // Check for obfuscated user (email already exists)
    // Supabase returns empty user_metadata for existing emails
    if (!data.user || Object.keys(data.user.user_metadata).length === 0) {
        throw new AuthError(
            "An account with this email already exists",
            AuthErrorCode.EMAIL_TAKEN,
            "Try signing in instead"
        );
    }

    // Note: Session may be null if email confirmation is required
    if (!data.session) {
        throw new AuthError(
            "Account created. Please check your email to confirm.",
            AuthErrorCode.EMAIL_NOT_CONFIRMED,
            "A confirmation email has been sent"
        );
    }

    return mapSupabaseSession(data.session);
}
```

### Complete verifyOtp Implementation

```typescript
// Source: Supabase official types
async verifyOtp(params: OtpVerificationParams): Promise<Session> {
    const { data, error } = await this.client.auth.verifyOtp({
        email: params.email,
        token: params.token,
        type: params.type, // 'signup' | 'recovery' | 'email_change'
    });

    if (error) {
        throw mapSupabaseError(error);
    }

    if (!data.session) {
        throw new AuthError(
            "OTP verification succeeded but no session was returned",
            AuthErrorCode.UNKNOWN_ERROR
        );
    }

    return mapSupabaseSession(data.session);
}
```

### Complete resendOtp Implementation

```typescript
// Source: Existing Register.tsx pattern
async resendOtp(params: OtpResendParams): Promise<void> {
    const { error } = await this.client.auth.resend({
        type: params.type, // 'signup' | 'recovery' | 'email_change'
        email: params.email,
    });

    if (error) {
        throw mapSupabaseError(error);
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `signInWithPassword` returns error message only | Returns `error.code` for stable error handling | Supabase v2+ | Use code, not message for error identification |
| Check `error.message` for rate limits | Check `error.code === 'over_request_rate_limit'` | Supabase v2+ | More reliable error handling |
| Manual session refresh | `autoRefreshToken: true` in client options | Long-standing | SDK handles automatically |
| `createClient` from supabase-js | `createBrowserClient` from @supabase/ssr | SSR support | Better Next.js integration |

**Deprecated/outdated:**
- `signup` OTP type is deprecated, use `email` instead
- `magiclink` OTP type is deprecated, use `email` instead
- `getSession()` should not be trusted on server (use `getUser()`)

## Open Questions

1. **Email confirmation flow handling**
   - What we know: signUp may return null session when email confirmation is required
   - What's unclear: Should adapter throw or return a special value?
   - Recommendation: Throw `EMAIL_NOT_CONFIRMED` error with helpful hint. UI handles this.

2. **RATE_LIMITED error code**
   - What we know: CONTEXT.md specified this should exist
   - What's unclear: Not in current AuthErrorCode enum from Phase 1
   - Recommendation: Add RATE_LIMITED to AuthErrorCode in this phase's implementation

## Sources

### Primary (HIGH confidence)
- **Supabase SDK types** (`node_modules/@supabase/auth-js/dist/module/lib/types.d.ts`) - Session, User, response types
- **Supabase error codes** (`node_modules/@supabase/auth-js/dist/module/lib/error-codes.d.ts`) - Complete error code list
- **Supabase error classes** (`node_modules/@supabase/auth-js/dist/module/lib/errors.d.ts`) - AuthError class hierarchy
- **Existing codebase** (`lib/util/supabase/client.ts`, `components/feature-modules/authentication/`) - Current usage patterns

### Secondary (MEDIUM confidence)
- [Supabase Error Codes Documentation](https://supabase.com/docs/guides/auth/debugging/error-codes) - Official error code reference
- [Supabase signInWithPassword API](https://supabase.com/docs/reference/javascript/auth-signinwithpassword) - API signature
- [Supabase onAuthStateChange API](https://supabase.com/docs/reference/javascript/auth-onauthstatechange) - Event callback API
- [Supabase verifyOtp API](https://supabase.com/docs/reference/javascript/auth-verifyotp) - OTP verification types
- [Supabase signInWithOAuth API](https://supabase.com/docs/reference/javascript/auth-signinwithoauth) - OAuth flow

### Tertiary (LOW confidence)
- None - all findings verified against SDK types or official docs

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH - Using existing dependencies, verified in package.json
- Architecture: HIGH - Based on CONTEXT.md decisions and codebase patterns
- Type Mapping: HIGH - Verified against SDK type definitions
- Error Mapping: HIGH - Verified against SDK error codes
- Pitfalls: HIGH - Derived from SDK types and existing codebase usage

**Research date:** 2026-01-23
**Valid until:** 60 days (stable Supabase SDK)
