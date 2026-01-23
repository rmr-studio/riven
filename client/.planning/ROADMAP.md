# Roadmap: Auth Abstraction Layer

## Overview

This roadmap delivers a provider-agnostic authentication abstraction for Riven. Phase 1 defines the domain interface and types. Phase 2 implements the Supabase adapter and provider factory. Phase 3 integrates the abstraction into AuthProvider and auth components, ensuring `useAuth()` consumers work unchanged. Phase 4 completes the migration by updating all service layer files to use domain types.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Interface & Types** - Define provider-agnostic auth contract and domain types
- [x] **Phase 2: Supabase Adapter** - Implement adapter and provider factory
- [x] **Phase 3: Integration** - Refactor AuthProvider and auth components to use abstraction
- [x] **Phase 4: Service Layer Migration** - Migrate service files from Supabase Session to domain type

## Phase Details

### Phase 1: Interface & Types
**Goal**: Provider-agnostic auth interface and types exist as the foundation for all adapters
**Depends on**: Nothing (first phase)
**Requirements**: INTF-01, INTF-02, INTF-03
**Success Criteria** (what must be TRUE):
  1. AuthProvider interface defines session/user access methods (getSession, getUser, onAuthStateChange)
  2. AuthProvider interface defines auth action methods (signIn, signUp, signOut, signInWithOAuth, verifyOtp, resendOtp)
  3. Provider-agnostic Session, User, and AuthError types exist and are importable
  4. Types do not import from @supabase/supabase-js
**Plans:** 1 plan

Plans:
- [x] 01-01-PLAN.md — Define auth provider interface and domain types

### Phase 2: Supabase Adapter
**Goal**: Supabase adapter implements the interface, and factory returns it based on env config
**Depends on**: Phase 1
**Requirements**: ADPT-01, ADPT-02
**Success Criteria** (what must be TRUE):
  1. SupabaseAuthAdapter class implements AuthProvider interface using existing Supabase client
  2. Provider factory reads AUTH_PROVIDER env var and returns configured adapter instance
  3. Factory throws descriptive error if unknown provider configured
**Plans:** 1 plan

Plans:
- [x] 02-01-PLAN.md — Implement Supabase adapter and provider factory

### Phase 3: Integration
**Goal**: Existing auth consumers use the abstraction layer without API changes
**Depends on**: Phase 2
**Requirements**: INTG-01, INTG-02, INTG-03, INTG-04
**Success Criteria** (what must be TRUE):
  1. AuthProvider uses provider factory instead of direct Supabase client instantiation
  2. useAuth() hook returns same API (session, user, loading) — existing 30+ consumers work unchanged
  3. Login component uses abstracted auth interface (no direct Supabase imports)
  4. Register component uses abstracted auth interface (no direct Supabase imports)
  5. Application builds and runs with AUTH_PROVIDER=supabase configuration
**Plans:** 2 plans

Plans:
- [x] 03-01-PLAN.md — Refactor AuthProvider to use factory pattern and expose auth methods
- [x] 03-02-PLAN.md — Update Login and Register components to use abstracted interface

### Phase 4: Service Layer Migration
**Goal**: No service files import from @supabase/supabase-js — all use domain Session type
**Depends on**: Phase 1 (domain types)
**Requirements**: SRVC-01
**Success Criteria** (what must be TRUE):
  1. All *.service.ts files use Session from @/lib/auth instead of @supabase/supabase-js
  2. No files outside lib/auth/adapters/ import from @supabase/supabase-js
  3. Application builds successfully with migrated imports
**Plans:** 1 plan

Plans:
- [x] 04-01-PLAN.md — Migrate service layer files to domain Session type

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Interface & Types | 1/1 | Complete | 2026-01-23 |
| 2. Supabase Adapter | 1/1 | Complete | 2026-01-23 |
| 3. Integration | 2/2 | Complete | 2026-01-23 |
| 4. Service Layer Migration | 1/1 | Complete | 2026-01-23 |

---
*Roadmap created: 2026-01-23*
*Phase 1 planned: 2026-01-23*
*Phase 2 planned: 2026-01-23*
*Phase 3 planned: 2026-01-23*
*Phase 3 complete: 2026-01-23*
*Phase 4 planned: 2026-01-23*
*Phase 4 complete: 2026-01-23*
