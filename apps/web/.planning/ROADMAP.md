# Roadmap: Waitlist Email Pipeline

## Overview

Three phases that deliver a confirmation email to every waitlist signup — reliably, immediately, and without touching the critical join path until the email pipeline is independently verified. Infrastructure goes in first (packages + env validation), then the email template and server action are built and tested in isolation, then the action is wired into the existing mutation hook as a fire-and-forget side effect.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Infrastructure** - Install packages, validate API key at startup, document secret
- [ ] **Phase 2: Email Template + Server Action** - Build branded email template and `sendConfirmationEmail` server action
- [ ] **Phase 3: Integration** - Wire server action into existing join mutation as fire-and-forget

## Phase Details

### Phase 1: Infrastructure
**Goal**: Project is ready to write Resend code — SDK installed, API key validated at startup, secrets hygiene enforced
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03
**Success Criteria** (what must be TRUE):
  1. `resend` and `@react-email/components` are resolvable imports in `apps/web`
  2. `next build` fails with a clear Zod validation error if `RESEND_API_KEY` is absent from the environment
  3. `.env.example` contains a `RESEND_API_KEY` placeholder so new developers know the variable exists
**Plans:** 1 plan
Plans:
- [x] 01-01-PLAN.md — Install packages, add RESEND_API_KEY env validation + TypeScript types + .env.example placeholder

### Phase 2: Email Template + Server Action
**Goal**: A working `sendConfirmationEmail(name, email)` server action exists and can be called and tested independently before it touches the existing mutation hook
**Depends on**: Phase 1
**Requirements**: TMPL-01, TMPL-02, TMPL-03, TMPL-04, TMPL-05, TMPL-06, ACTN-01, ACTN-02, ACTN-03
**Success Criteria** (what must be TRUE):
  1. A test email sent via the server action arrives in an inbox showing a personalised greeting ("Hey {name}"), Riven branding, and pre-header preview text
  2. The email renders correctly on mobile (single-column, readable text, no horizontal scroll)
  3. The `from` address matches the verified Resend domain and is not rejected with a 403
  4. `next build` succeeds with no `'use client'` contamination in the `emails/` directory
**Plans**: TBD

### Phase 3: Integration
**Goal**: Every waitlist signup at step 2 (contact submission) triggers a confirmation email as a non-blocking side effect — the join still succeeds even if the email fails
**Depends on**: Phase 2
**Requirements**: INTG-01, INTG-02, INTG-03
**Success Criteria** (what must be TRUE):
  1. Submitting the waitlist form in dev causes a confirmation email to arrive in the registered inbox
  2. Temporarily invalidating the API key causes the join to succeed (form advances to next step, no error shown to user) while the email silently fails
  3. The email fires after step 2 (contact submission), not after the optional survey steps
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Infrastructure | 1/1 | Complete | 2026-02-27 |
| 2. Email Template + Server Action | 0/TBD | Not started | - |
| 3. Integration | 0/TBD | Not started | - |
