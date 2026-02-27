# Requirements: Waitlist Email Pipeline

**Defined:** 2026-02-26
**Core Value:** Every waitlist signup gets a confirmation email — reliably, immediately, with a clean branded experience.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: `resend` and `@react-email/components` packages installed
- [x] **INFRA-02**: `RESEND_API_KEY` added to `lib/env.ts` Zod schema as server-only variable
- [x] **INFRA-03**: `.env.example` updated with `RESEND_API_KEY` placeholder

### Email Template

- [x] **TMPL-01**: React Email template with personalised greeting ("Hey {name}") and waitlist confirmation copy
- [x] **TMPL-02**: Template includes Riven branding (logo/wordmark via CDN)
- [x] **TMPL-03**: Template includes `<Preview>` pre-header text
- [x] **TMPL-04**: Template is mobile-responsive
- [x] **TMPL-05**: Template lives in dedicated `emails/` directory (not `components/`)
- [x] **TMPL-06**: Template includes custom imagery hosted on CDN (absolute URLs, not local paths)

### Server Action

- [x] **ACTN-01**: Server action sends email via Resend with `react` prop (JSX directly)
- [x] **ACTN-02**: Resend client instantiated at module scope for fail-fast validation
- [x] **ACTN-03**: Branded sender identity (verified domain)

### Integration

- [ ] **INTG-01**: Server action called from existing join mutation `onSuccess` callback
- [ ] **INTG-02**: Email send is non-blocking — failure does not prevent waitlist join
- [ ] **INTG-03**: Email fires at step 2 (contact submission), not after survey

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhancement

- **ENHN-01**: Dark mode email support via `@media (prefers-color-scheme: dark)`
- **ENHN-02**: PostHog event for email send success/failure
- **ENHN-03**: Reply-to header set to team inbox

## Out of Scope

| Feature | Reason |
|---------|--------|
| Double opt-in / email verification | This is a waitlist, not auth — cuts list size 20-40% |
| Open tracking / pixel tracking | Apple Mail blocks it, Gmail proxies it — misleading data |
| Drip / follow-up sequences | Entire product surface — single confirmation only |
| Referral / share links | Requires token generation, tracking table, position logic |
| A/B testing subject lines | Overkill for single transactional confirmation |
| Retry UI for failed sends | Email failures are invisible by design (non-blocking) |
| Waitlist position in email | Adds DB query per signup for marginal value |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| TMPL-01 | Phase 2 | Complete |
| TMPL-02 | Phase 2 | Complete |
| TMPL-03 | Phase 2 | Complete |
| TMPL-04 | Phase 2 | Complete |
| TMPL-05 | Phase 2 | Complete |
| TMPL-06 | Phase 2 | Complete |
| ACTN-01 | Phase 2 | Complete |
| ACTN-02 | Phase 2 | Complete |
| ACTN-03 | Phase 2 | Complete |
| INTG-01 | Phase 3 | Pending |
| INTG-02 | Phase 3 | Pending |
| INTG-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-02-26*
*Last updated: 2026-02-27 after Phase 1 completion (INFRA-01, INFRA-02, INFRA-03 complete)*
