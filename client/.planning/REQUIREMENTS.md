# Requirements: Auth Abstraction Layer

**Defined:** 2026-01-23
**Core Value:** Consuming code works unchanged regardless of which auth provider is configured

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Interface

- [x] **INTF-01**: Auth provider interface defines session/user access (getSession, getUser, onAuthStateChange)
- [x] **INTF-02**: Auth provider interface defines auth actions (signIn, signUp, signOut, signInWithOAuth, verifyOtp, resendOtp)
- [x] **INTF-03**: Provider-agnostic types replace Supabase types (Session, User, AuthError)

### Adapter

- [x] **ADPT-01**: Supabase adapter implements auth provider interface with existing Supabase client
- [x] **ADPT-02**: Provider factory reads AUTH_PROVIDER env var and returns configured adapter

### Integration

- [x] **INTG-01**: AuthProvider refactored to use provider factory instead of direct Supabase client
- [x] **INTG-02**: useAuth() hook API unchanged (session, user, loading) — existing consumers work without modification
- [x] **INTG-03**: Login component uses abstracted auth interface
- [x] **INTG-04**: Register component uses abstracted auth interface

### Service Layer

- [x] **SRVC-01**: All service files use domain Session type instead of Supabase Session

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Server-Side

- **SRVR-01**: Server-side auth abstraction (SSR client)
- **SRVR-02**: Server actions use abstracted interface

### Additional Adapters

- **ADPT-03**: Self-hosted auth adapter implementation
- **ADPT-04**: Keycloak adapter implementation

## Out of Scope

| Feature | Reason |
|---------|--------|
| Server-side auth abstraction | Complexity — client-side first, server follows same pattern later |
| New auth features (2FA, magic links) | Focus is abstraction, not new capabilities |
| Login UI redesign | Components stay the same, just use abstracted interface |
| Additional provider adapters | Establishing pattern only — Supabase adapter proves it works |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INTF-01 | Phase 1 | Complete |
| INTF-02 | Phase 1 | Complete |
| INTF-03 | Phase 1 | Complete |
| ADPT-01 | Phase 2 | Complete |
| ADPT-02 | Phase 2 | Complete |
| INTG-01 | Phase 3 | Complete |
| INTG-02 | Phase 3 | Complete |
| INTG-03 | Phase 3 | Complete |
| INTG-04 | Phase 3 | Complete |
| SRVC-01 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0

---
*Requirements defined: 2026-01-23*
*Last updated: 2026-01-23 after Phase 4 completion*
