# Auth Abstraction Layer

## What This Is

A provider-agnostic authentication abstraction for the Riven client. Defines a domain-level auth interface with an adapter pattern, allowing the application to switch auth providers (Supabase, self-hosted, etc.) via environment configuration. The Supabase adapter is the first implementation.

## Core Value

Consuming code (`useAuth()`, Login/Register components) works unchanged regardless of which auth provider is configured — switching providers is a configuration change, not a code change.

## Requirements

### Validated

- Auth session management (login, logout, session persistence) — existing
- Email/password authentication — existing
- OAuth social provider authentication (Google, GitHub) — existing
- OTP email verification — existing
- Auth state change subscriptions — existing

### Active

- [ ] Define provider-agnostic auth domain interface
- [ ] Create Supabase adapter implementing the interface
- [ ] Create provider factory that reads AUTH_PROVIDER env var
- [ ] Refactor AuthProvider to use the factory pattern
- [ ] Ensure `useAuth()` hook API remains unchanged
- [ ] Abstract auth-related types (Session, User, AuthError) from Supabase
- [ ] Update Login/Register components to use abstracted interface

### Out of Scope

- Server-side auth abstraction (SSR client, server actions) — future milestone
- Additional auth provider adapters (self-hosted, Keycloak) — this establishes the pattern
- Login UI changes — components stay the same, just use abstracted interface
- New auth features (2FA, magic links) — focus is on abstraction, not new features

## Context

**Existing Architecture:**
- Riven uses feature-module architecture with domain-driven design
- Auth currently lives in `components/provider/auth-context.tsx` (context) and `components/feature-modules/authentication/` (components, utils, interfaces)
- Services use static class pattern with session validation
- ~30 places use `useAuth()` hook, 16 files import Supabase directly

**Current Coupling Points:**
- `AuthProvider` creates Supabase client directly
- `Session` and `User` types are from `@supabase/supabase-js`
- Login/Register components call Supabase auth methods directly
- `auth.util.ts` has Supabase-specific server actions (out of scope for now)

**Backend Integration:**
- Backend validates JWTs — provider config must match frontend
- Frontend provider issues tokens, backend just validates them

## Constraints

- **API Compatibility**: `useAuth()` hook signature cannot change — 30+ consumers depend on it
- **Tech Stack**: Must work within Next.js 15 App Router, React 19, TypeScript 5
- **Environment Config**: Auth provider determined by `AUTH_PROVIDER` environment variable
- **Client-Side Only**: Server-side auth abstraction deferred to future work

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Adapter pattern for providers | Allows swapping implementations without changing consuming code | — Pending |
| Factory with env var config | Simple, deployment-time configuration | — Pending |
| Client-side only scope | Reduce complexity, server-side can follow same pattern later | — Pending |

---
*Last updated: 2026-01-23 after initialization*
