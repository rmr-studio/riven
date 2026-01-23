# Phase 2: Supabase Adapter - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement SupabaseAuthAdapter class that implements AuthProvider interface using the existing Supabase client. Create provider factory that reads AUTH_PROVIDER env var and returns configured adapter instance. Adapter maps Supabase types to domain types and translates Supabase errors to AuthError.

</domain>

<decisions>
## Implementation Decisions

### Adapter instantiation
- Class-based implementation: `class SupabaseAuthAdapter implements AuthProvider`
- Internal singleton for Supabase client — adapter creates/manages its own client
- Eager initialization — client created on adapter construction (fail fast on missing env vars)
- Expose underlying client via getter for escape hatches when abstraction doesn't cover a need

### Factory behavior
- Env var: `AUTH_PROVIDER` (not NEXT_PUBLIC_)
- No default — throw descriptive error if AUTH_PROVIDER is not set (explicit configuration required)
- Factory caches adapter instance (singleton) — same instance returned on repeated calls
- Function name: `createAuthProvider()` — conventional factory naming despite singleton behavior

### Error translation
- Preserve original Supabase error as `cause` property on AuthError
- Unmapped errors get `AuthErrorCode.UNKNOWN` with original message preserved
- Rate limit errors get specific `AuthErrorCode.RATE_LIMITED` code for UI retry messaging
- Centralized `mapSupabaseError(error)` helper function — single place for all error mapping

### Type mapping
- `getSession()` returns `Session | null` — null when no session (matches Supabase behavior)
- Preserve user metadata in `User.metadata: Record<string, unknown>` field
- Explicit mapper functions: `mapSupabaseSession()`, `mapSupabaseUser()` — clear transformation, testable
- OAuth: `signInWithOAuth()` returns `{ url: string }` — caller controls navigation

### Claude's Discretion
- Internal client singleton implementation details
- Mapper function organization (single file vs separate)
- Exact error code mappings beyond RATE_LIMITED
- File organization within lib/auth/

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following codebase conventions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-supabase-adapter*
*Context gathered: 2026-01-23*
