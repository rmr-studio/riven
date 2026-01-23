# Phase 1: Interface & Types - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Define provider-agnostic auth interface and domain types that all adapters will implement. This is the contract — AuthProvider interface methods, Session/User types, error types. No implementation, no adapters, just the type definitions.

</domain>

<decisions>
## Implementation Decisions

### Method signatures
- Direct returns, not response wrappers — `signIn()` returns `Session | null`, errors thrown as exceptions
- Single method with discriminated union for credentials — `signIn({ type: 'password', ... })` with typed variants for password, OTP, phone
- Always async — `getSession(): Promise<Session | null>`, `getUser(): Promise<User | null>`

### Session/User types
- Session includes user reference — `access_token`, `expires_at`, `user`
- User is minimal — `id`, `email` as required fields
- Generic metadata field for extensions — `user.metadata: Record<string, unknown>` for provider-specific data
- Refresh token hidden in adapter — not exposed in Session type, adapter manages internally

### OAuth handling
- Enum for OAuth providers — `enum OAuthProvider { Google, GitHub }`
- Provider + options pattern — `signInWithOAuth(provider, { redirectTo?, scopes? })`
- Scopes parameter included — consumers can request specific permissions
- Initial providers: Google and GitHub

### Error modeling
- Include recovery hints — `error.hint: string | undefined` for UI display
- Auth-specific error codes — `INVALID_CREDENTIALS`, `SESSION_EXPIRED`, `USER_NOT_FOUND`, `EMAIL_NOT_CONFIRMED`
- Export type guard — `isAuthError(e): e is AuthError` for safe narrowing in catch blocks

### Claude's Discretion
- Subscription pattern for onAuthStateChange (unsubscribe function vs subscription object)
- Exact error class structure (simple subclass vs enum code approach)
- Any additional utility types needed for the interface

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-interface-types*
*Context gathered: 2026-01-23*
