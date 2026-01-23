---
phase: 02-supabase-adapter
plan: 01
subsystem: auth
tags: [supabase, auth-adapter, factory-pattern, type-mapping, error-handling]

# Dependency graph
requires:
  - phase: 01-interface-types
    provides: AuthProvider interface, Session/User types, AuthError class
provides:
  - SupabaseAuthAdapter implementing all 9 AuthProvider methods
  - Type mappers for Supabase -> domain type transformation
  - Error mapper for Supabase -> AuthError translation
  - Provider factory with env var configuration
affects: [03-integration, consuming-code, existing-auth-context]

# Tech tracking
tech-stack:
  added: [] # Uses existing @supabase/ssr and @supabase/supabase-js
  patterns:
    - Adapter pattern for auth provider abstraction
    - Factory pattern with singleton caching for provider instantiation
    - Centralized error mapping with cause preservation
    - Explicit type mapper functions for Supabase -> domain transformation

key-files:
  created:
    - lib/auth/adapters/supabase/supabase-adapter.ts
    - lib/auth/adapters/supabase/mappers.ts
    - lib/auth/adapters/supabase/error-mapper.ts
    - lib/auth/factory.ts
  modified:
    - lib/auth/auth-error.ts
    - lib/auth/index.ts

key-decisions:
  - "Added RATE_LIMITED to AuthErrorCode for explicit rate limit handling"
  - "Added cause property to AuthError for preserving original errors"
  - "Route 'recovery' OTP resend to resetPasswordForEmail (Supabase doesn't support recovery in resend)"
  - "Keep mappers and error-mapper internal to adapter (not exported from barrel)"

patterns-established:
  - "Adapter files: supabase-adapter.ts implements interface, mappers.ts handles type transformation, error-mapper.ts handles error translation"
  - "Type mappers: explicit functions (mapSupabaseSession, mapSupabaseUser) rather than inline transformation"
  - "Error mapping: centralized ERROR_CODE_MAP constant with fallback to UNKNOWN_ERROR"
  - "Factory: singleton caching with explicit env var requirement (no defaults)"

# Metrics
duration: 4min
completed: 2026-01-23
---

# Phase 2 Plan 1: Supabase Adapter Summary

**SupabaseAuthAdapter implementing all 9 AuthProvider methods with type mappers, error translation, and factory instantiation**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-23T05:11:18Z
- **Completed:** 2026-01-23T05:15:13Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- SupabaseAuthAdapter class implementing full AuthProvider interface
- Type mappers translating Supabase Session/User to domain types
- Error mapper with 13 Supabase error codes mapped to AuthErrorCode
- Provider factory with AUTH_PROVIDER env var configuration
- RATE_LIMITED error code added for explicit rate limit handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Create mappers and error handling** - `b3e95e9` (feat)
2. **Task 2: Implement SupabaseAuthAdapter class** - `96c22cb` (feat)
3. **Task 3: Create factory and update exports** - `d2e4b49` (feat)

## Files Created/Modified

- `lib/auth/adapters/supabase/supabase-adapter.ts` - SupabaseAuthAdapter class with all 9 methods
- `lib/auth/adapters/supabase/mappers.ts` - mapSupabaseSession, mapSupabaseUser, mapAuthChangeEvent
- `lib/auth/adapters/supabase/error-mapper.ts` - mapSupabaseError with ERROR_CODE_MAP
- `lib/auth/factory.ts` - createAuthProvider() with singleton caching
- `lib/auth/auth-error.ts` - Added RATE_LIMITED and cause property
- `lib/auth/index.ts` - Updated barrel to export factory and adapter

## Decisions Made

1. **Added cause property to AuthError** - Needed to preserve original Supabase errors for debugging. Standard Error.cause is ES2022+ so added explicit property for compatibility.

2. **Route recovery OTP to resetPasswordForEmail** - Supabase's `resend()` doesn't support "recovery" type. The adapter routes recovery requests to `resetPasswordForEmail()` instead.

3. **Keep mappers internal** - mappers.ts and error-mapper.ts are not exported from barrel - they're internal adapter implementation details.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SupabaseClient import location**
- **Found during:** Task 2 (SupabaseAuthAdapter implementation)
- **Issue:** `SupabaseClient` is not exported from `@supabase/ssr`, only from `@supabase/supabase-js`
- **Fix:** Split imports: `createBrowserClient` from `@supabase/ssr`, `SupabaseClient` from `@supabase/supabase-js`
- **Files modified:** lib/auth/adapters/supabase/supabase-adapter.ts
- **Verification:** Type check passes
- **Committed in:** 96c22cb

**2. [Rule 3 - Blocking] Supabase resend doesn't support "recovery" type**
- **Found during:** Task 2 (resendOtp implementation)
- **Issue:** Plan specified using `resend()` for all OTP types, but Supabase's `ResendParams` only accepts `"signup"` or `"email_change"`, not `"recovery"`
- **Fix:** Added conditional routing - "recovery" type uses `resetPasswordForEmail()`, others use `resend()`
- **Files modified:** lib/auth/adapters/supabase/supabase-adapter.ts
- **Verification:** Type check passes
- **Committed in:** 96c22cb

---

**Total deviations:** 2 auto-fixed (2 blocking issues)
**Impact on plan:** Both auto-fixes necessary for compilation. No scope creep.

## Issues Encountered

None - standard implementation with documented Supabase SDK patterns.

## User Setup Required

None - no external service configuration required. Existing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars are used.

## Next Phase Readiness

**Ready for Phase 3 (Integration):**
- SupabaseAuthAdapter ready for consumption
- Factory can instantiate adapter when AUTH_PROVIDER=supabase
- All domain types properly mapped

**Integration notes:**
- Consuming code should use `createAuthProvider()` from `@/lib/auth`
- Direct `SupabaseAuthAdapter` instantiation available for testing
- `supabaseClient` getter provides escape hatch for Supabase-specific features

---
*Phase: 02-supabase-adapter*
*Completed: 2026-01-23*
