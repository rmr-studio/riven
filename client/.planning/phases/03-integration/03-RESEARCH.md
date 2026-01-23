# Phase 3: Integration - Research

**Researched:** 2026-01-23
**Domain:** React Context integration, auth provider abstraction, component refactoring
**Confidence:** HIGH

## Summary

This phase integrates the auth abstraction layer (from Phases 1-2) into the existing codebase. The primary work involves refactoring `AuthProvider` context to use the factory pattern, extending `useAuth()` hook to expose auth methods, and updating all authentication components to use the abstracted interface.

The codebase has 30+ consumers of `useAuth()` that access `{ session, user, loading }` and some that also access `client` for auth operations. The key challenge is maintaining the exact same hook API for session/user access while adding auth action methods. Components that use `client.auth.signOut()` etc. must be migrated to use hook-provided methods.

**Primary recommendation:** Refactor AuthProvider to instantiate provider via factory, expose all auth methods through useAuth(), and update Login/Register/logout components to use hook methods instead of direct Supabase calls.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Context | 19.x | Global auth state distribution | Built-in, zero dependencies, codebase standard |
| `@/lib/auth` | N/A | Auth abstraction layer (Phases 1-2) | Custom, already built |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | (existing) | Toast notifications | Error display during auth actions |

### No New Dependencies

This phase uses only existing codebase patterns and the auth abstraction from Phases 1-2. No new npm packages required.

## Architecture Patterns

### Current AuthProvider Structure (to be refactored)
```typescript
// components/provider/auth-context.tsx (CURRENT)
import { createClient } from "@/lib/util/supabase/client";
import { Session } from "@supabase/supabase-js";

interface AuthContextType {
    session: Session | null;
    user: Session["user"] | null;
    client?: ReturnType<typeof createClient>;  // SUPABASE LEAK
    loading: boolean;
}

export function AuthProvider({ children }) {
    const client = useMemo(() => createClient(), []);
    // ... uses client.auth.onAuthStateChange directly
}

export function useAuth() {
    return useContext(AuthContext);
}
```

### Target AuthProvider Structure
```typescript
// components/provider/auth-context.tsx (TARGET)
import { createAuthProvider, AuthProvider as IAuthProvider, Session, User } from "@/lib/auth";

interface AuthContextType {
    // Session/user access (UNCHANGED API)
    session: Session | null;
    user: User | null;
    loading: boolean;

    // Auth actions (NEW - exposed through hook)
    signIn: IAuthProvider["signIn"];
    signUp: IAuthProvider["signUp"];
    signOut: IAuthProvider["signOut"];
    signInWithOAuth: IAuthProvider["signInWithOAuth"];
    verifyOtp: IAuthProvider["verifyOtp"];
    resendOtp: IAuthProvider["resendOtp"];
}

export function AuthProvider({ children }) {
    const provider = useMemo(() => createAuthProvider(), []);
    // ... uses provider.onAuthStateChange
}
```

### Pattern 1: Provider Factory Integration
**What:** Replace direct Supabase client creation with provider factory
**When to use:** AuthProvider initialization
**Example:**
```typescript
// OLD
const client = useMemo(() => createClient(), []);

// NEW
const provider = useMemo(() => createAuthProvider(), []);
```

### Pattern 2: Hook Method Exposure
**What:** Expose provider methods through useAuth() hook
**When to use:** Any component needing auth actions (login, logout, etc.)
**Example:**
```typescript
// Hook exposes methods
export function useAuth() {
    return useContext(AuthContext);
}

// Component usage
const { signIn, signOut, session } = useAuth();

// Call method directly
await signOut();
```

### Pattern 3: Error Handling in Components
**What:** Catch AuthError from hook methods, display user-friendly messages
**When to use:** All auth action calls (signIn, signUp, etc.)
**Example:**
```typescript
import { isAuthError, AuthErrorCode } from "@/lib/auth";
import { getAuthErrorMessage } from "@/lib/auth/error-messages"; // NEW

try {
    await signIn(credentials);
} catch (error) {
    if (isAuthError(error)) {
        toast.error(getAuthErrorMessage(error.code));
    }
}
```

### Anti-Patterns to Avoid
- **Direct Supabase imports in components:** After migration, no component should import from `@supabase/*` or `@/lib/util/supabase/client`
- **Accessing `client` from useAuth():** The `client` property will be removed - use exposed methods instead
- **Creating new Supabase clients in components:** Components should only get auth via useAuth()

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error message mapping | Inline switch statements in components | Centralized `getAuthErrorMessage()` util | Single source of truth, consistent UX |
| Auth state subscription | Manual Supabase event handling | Provider's `onAuthStateChange` | Already handles event mapping |
| Session refresh | Manual token refresh logic | Provider handles internally | Supabase adapter manages refresh |

**Key insight:** The AuthProvider interface and SupabaseAuthAdapter already handle all complexity. Components just call methods and catch errors.

## Common Pitfalls

### Pitfall 1: Breaking useAuth() Return Type
**What goes wrong:** Adding new fields changes the hook's type, causing TypeScript errors in existing consumers
**Why it happens:** TypeScript infers stricter types when interface changes
**How to avoid:** Add optional fields or ensure backward compatibility
**Warning signs:** TypeScript errors in unmodified files after AuthProvider changes

### Pitfall 2: Forgetting Loading State During Auth Actions
**What goes wrong:** UI doesn't show loading state during signIn/signUp, feels unresponsive
**Why it happens:** Auth actions are async but component doesn't track pending state
**How to avoid:** Each component manages its own `isSubmitting` state for button loading
**Warning signs:** Form submits but no visual feedback

### Pitfall 3: Session Type Mismatch
**What goes wrong:** Existing consumers expect Supabase `Session` type, but provider returns domain `Session` type
**Why it happens:** Different type definitions between Supabase SDK and auth abstraction
**How to avoid:** Domain `Session` has same structure - `access_token`, `expires_at`, `user`
**Warning signs:** TypeScript errors about missing properties on session

### Pitfall 4: OAuth Redirect URL Hardcoding
**What goes wrong:** OAuth flows break in different environments
**Why it happens:** Components hardcode `process.env.NEXT_PUBLIC_HOSTED_URL`
**How to avoid:** Use OAuthOptions.redirectTo parameter, keep existing env var pattern
**Warning signs:** OAuth works locally but fails in production

### Pitfall 5: Not Removing `client` Usage
**What goes wrong:** Components still try to access `client` property after refactor
**Why it happens:** Incomplete migration, some usages missed
**How to avoid:** Remove `client` from context type, TypeScript will catch all usages
**Warning signs:** Runtime errors about undefined `client`

## Code Examples

Verified patterns from existing codebase and auth abstraction:

### Refactored AuthProvider
```typescript
"use client";

import { createAuthProvider, AuthProvider as IAuthProvider, Session, User, AuthChangeEvent } from "@/lib/auth";
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;

    // Auth methods
    signIn: IAuthProvider["signIn"];
    signUp: IAuthProvider["signUp"];
    signOut: IAuthProvider["signOut"];
    signInWithOAuth: IAuthProvider["signInWithOAuth"];
    verifyOtp: IAuthProvider["verifyOtp"];
    resendOtp: IAuthProvider["resendOtp"];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const provider = useMemo(() => createAuthProvider(), []);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        const subscription = provider.onAuthStateChange((event, newSession) => {
            setLoading(false);
            if (!newSession) {
                setSession(null);
                return;
            }
            // Only update session if user ID has changed
            if (newSession.user.id !== session?.user.id) {
                setSession(newSession);
            }
        });

        return () => subscription.unsubscribe();
    }, [provider]);

    const value: AuthContextType = useMemo(() => ({
        session,
        user: session?.user ?? null,
        loading,
        signIn: provider.signIn.bind(provider),
        signUp: provider.signUp.bind(provider),
        signOut: provider.signOut.bind(provider),
        signInWithOAuth: provider.signInWithOAuth.bind(provider),
        verifyOtp: provider.verifyOtp.bind(provider),
        resendOtp: provider.resendOtp.bind(provider),
    }), [session, loading, provider]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
```

### Error Message Utility
```typescript
// lib/auth/error-messages.ts
import { AuthErrorCode } from "./auth-error";

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
    [AuthErrorCode.INVALID_CREDENTIALS]: "Invalid email or password. Please try again.",
    [AuthErrorCode.SESSION_EXPIRED]: "Your session has expired. Please sign in again.",
    [AuthErrorCode.USER_NOT_FOUND]: "No account found with this email.",
    [AuthErrorCode.EMAIL_NOT_CONFIRMED]: "Please check your email to confirm your account.",
    [AuthErrorCode.WEAK_PASSWORD]: "Password is too weak. Please choose a stronger password.",
    [AuthErrorCode.EMAIL_TAKEN]: "An account with this email already exists.",
    [AuthErrorCode.INVALID_TOKEN]: "The verification code is invalid or has expired.",
    [AuthErrorCode.RATE_LIMITED]: "Too many attempts. Please wait a moment and try again.",
    [AuthErrorCode.UNKNOWN_ERROR]: "An unexpected error occurred. Please try again.",
};

export function getAuthErrorMessage(code: AuthErrorCode): string {
    return ERROR_MESSAGES[code] ?? ERROR_MESSAGES[AuthErrorCode.UNKNOWN_ERROR];
}
```

### Login Component Migration
```typescript
// BEFORE (components/feature-modules/authentication/components/Login.tsx)
const client = createClient();
const loginWithEmailPasswordCredentials = async (credentials) => {
    const { error } = await client.auth.signInWithPassword({ email, password });
    return { ok: error === null, error };
};

// AFTER
import { useAuth } from "@/components/provider/auth-context";
import { isAuthError } from "@/lib/auth";
import { getAuthErrorMessage } from "@/lib/auth/error-messages";

const LoginForm: FC = () => {
    const { signIn } = useAuth();
    const router = useRouter();

    const handleLoginSubmission = async (values: Login) => {
        try {
            await signIn({ type: "password", email: values.email, password: values.password });
            toast.success("Logged in successfully");
            router.push("/dashboard");
        } catch (error) {
            if (isAuthError(error)) {
                toast.error(getAuthErrorMessage(error.code));
            } else {
                toast.error("An unexpected error occurred");
            }
        }
    };
    // ...
};
```

### Logout Component Migration
```typescript
// BEFORE (avatar-dropdown.tsx)
const { client } = useAuth();
const handleLogout = async () => {
    if (!client) return;
    await client.auth.signOut();
    router.push("/");
};

// AFTER
const { signOut } = useAuth();
const handleLogout = async () => {
    try {
        await signOut();
        router.push("/");
    } catch (error) {
        if (isAuthError(error)) {
            toast.error(getAuthErrorMessage(error.code));
        }
    }
};
```

### OAuth Migration
```typescript
// BEFORE
const authenticateWithSocialProvider = async (provider: SocialProviders) => {
    const { data } = await client.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_HOSTED_URL}api/auth/token/callback`,
            queryParams: { access_type: "offline", prompt: "consent" },
        },
    });
    if (data.url) window.location.href = data.url;
};

// AFTER
import { OAuthProvider } from "@/lib/auth";

const { signInWithOAuth } = useAuth();

const authenticateWithSocialProvider = async (provider: OAuthProvider) => {
    try {
        await signInWithOAuth(provider, {
            redirectTo: `${process.env.NEXT_PUBLIC_HOSTED_URL}api/auth/token/callback`,
        });
        // Note: signInWithOAuth handles the redirect internally
    } catch (error) {
        if (isAuthError(error)) {
            toast.error(getAuthErrorMessage(error.code));
        }
    }
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct Supabase client in components | Auth abstraction via hook | This phase | All auth components updated |
| `client` exposed in context | Methods exposed, client hidden | This phase | Breaking change for `client` users |
| Supabase Session/User types | Domain Session/User types | This phase | Type compatibility maintained |

**Deprecated/outdated:**
- `client` property on useAuth() - replaced with method exposure
- Direct `@supabase/supabase-js` imports in auth components - use `@/lib/auth`
- `createClient()` usage in auth components - use `useAuth()` hook

## Component Inventory

Components requiring refactoring (identified from grep analysis):

### Must Refactor (use `client` from useAuth or create Supabase client)
| File | Current Usage | Migration |
|------|---------------|-----------|
| `components/provider/auth-context.tsx` | `createClient()`, Supabase types | Use factory, domain types |
| `components/feature-modules/authentication/components/Login.tsx` | `createClient()` | Use `useAuth().signIn` |
| `components/feature-modules/authentication/components/Register.tsx` | `createClient()` | Use `useAuth().signUp/verifyOtp/resendOtp` |
| `components/feature-modules/user/components/avatar-dropdown.tsx` | `useAuth().client.auth.signOut()` | Use `useAuth().signOut` |
| `components/feature-modules/onboarding/components/OnboardForm.tsx` | `useAuth().client` (null check only) | Remove `client` usage |
| `components/feature-modules/workspace/components/new-workspace.tsx` | `useAuth().client` (null check only) | Remove `client` usage |
| `components/feature-modules/workspace/components/edit-workspace.tsx` | `useAuth().client` (null check only) | Remove `client` usage |

### No Changes Needed (only use session/user/loading)
- All entity hooks (14 files)
- All block hooks (6 files)
- All workspace hooks (4 files)
- UI components (navbar, etc.)

### Out of Scope (server-side)
| File | Reason |
|------|--------|
| `app/api/auth/token/callback/route.ts` | Server route, uses SSR client |
| `components/feature-modules/authentication/util/auth.util.ts` | Server actions, uses SSR client |

**Note:** Server-side auth is explicitly out of scope per CONTEXT.md decision "Client-side only scope."

## Interface Type Mapping

Existing components use these types (need mapping):

| Existing Type | Location | Domain Type | Mapping |
|--------------|----------|-------------|---------|
| `Session` (Supabase) | `@supabase/supabase-js` | `Session` (domain) | Compatible structure |
| `Session["user"]` | Derived | `User` (domain) | Compatible structure |
| `AuthError` (Supabase) | `@supabase/supabase-js` | `AuthError` (domain) | Different class, use `isAuthError` |
| `SocialProviders` | auth.interface.ts | `OAuthProvider` | Enum, different values |

**Type compatibility notes:**
- Domain `Session` has `access_token`, `expires_at`, `user` - compatible with existing usage
- Domain `User` has `id`, `email`, `metadata` - existing code accesses `session.user.id` which works
- `OAuthProvider` enum only has Google/GitHub, existing `SocialProviders` includes facebook/linkedin (update components)

## Open Questions

Things that couldn't be fully resolved:

1. **ThirdPartyAuth component provider list**
   - What we know: Current SocialProviders type includes "facebook", "linkedin" but OAuthProvider only has Google, GitHub
   - What's unclear: Should we add more providers to OAuthProvider or update UI to show only Google?
   - Recommendation: Currently only Google button is rendered in UI, so no change needed. Document limitation.

2. **Obfuscated user detection in signUp**
   - What we know: Supabase adapter already handles this, throws EMAIL_TAKEN
   - What's unclear: Existing Register component has custom `isUserObfuscated` check
   - Recommendation: Remove custom check, rely on adapter's error handling

## Sources

### Primary (HIGH confidence)
- `/home/jared/dev/worktrees/riven-sh-auth/client/lib/auth/` - All Phase 1-2 implemented files
- `/home/jared/dev/worktrees/riven-sh-auth/client/components/provider/auth-context.tsx` - Current AuthProvider
- `/home/jared/dev/worktrees/riven-sh-auth/client/components/feature-modules/authentication/` - Existing auth components

### Secondary (MEDIUM confidence)
- `.planning/phases/03-integration/03-CONTEXT.md` - User decisions for this phase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - using existing codebase patterns
- Architecture: HIGH - clear transformation from current to target state
- Pitfalls: HIGH - identified from actual codebase analysis
- Component inventory: HIGH - exhaustive grep analysis of useAuth and Supabase imports

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable patterns)
