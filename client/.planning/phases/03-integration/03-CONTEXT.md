# Phase 3: Integration - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Refactor AuthProvider and all auth-related components to use the abstraction layer instead of direct Supabase calls. Existing `useAuth()` consumers (30+ components) must continue working unchanged — same API, same behavior.

</domain>

<decisions>
## Implementation Decisions

### Migration approach
- All-at-once migration in a single PR (AuthProvider + all auth components together)
- No fallback mechanism — clean cut to abstraction
- Remove all @supabase imports from auth files (AuthProvider, Login, Register, etc.)
- AUTH_PROVIDER env var must be set — throw error if missing (fail fast, misconfiguration is a bug)

### Loading state behavior
- Keep existing loading pattern — maintain current UX during initial auth load
- No API changes to useAuth() — keep `{ session, user, loading }` exactly as-is
- Component-level loading for auth actions — each component manages its own isSubmitting state
- Instant updates on auth state transitions

### Error handling
- Throw AuthError directly from provider methods — components catch and handle by error code
- Keep existing error display behavior in components (match current Login/Register UX)
- User-friendly error messages — map AuthError codes to friendly messages
- Centralized error message util — one function maps all AuthError codes to user messages

### Component refactoring scope
- Refactor ALL auth-related components (not just Login/Register) — includes password reset, OTP verification, OAuth callbacks, etc.
- Components get auth methods through useAuth() hook — single source for session, user, AND auth actions
- useAuth() exposes all AuthProvider methods (signIn, signUp, signOut, signInWithOAuth, verifyOtp, resendOtp, resetPassword)
- Leave non-auth-action consumers untouched — if a component only uses session/user, no changes needed

### Claude's Discretion
- Exact implementation of error message mapping util
- How to identify all auth-related components that need refactoring
- Internal structure of AuthProvider state management

</decisions>

<specifics>
## Specific Ideas

- useAuth() becomes the single entry point for all auth operations — components never call provider factory directly
- Error messages should be user-friendly but the underlying AuthError code remains accessible for programmatic handling

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-integration*
*Context gathered: 2026-01-23*
