# Waitlist Email Pipeline

## What This Is

A confirmation email pipeline for the Riven landing page waitlist. When a user joins the waitlist (name + email), they receive an immediate confirmation email via Resend with a customisable React email template. Builds on the existing multi-step waitlist form, Supabase storage, and PostHog tracking already in place.

## Core Value

Every waitlist signup gets a confirmation email — reliably, immediately, with a clean branded experience.

## Requirements

### Validated

<!-- Existing capabilities confirmed in codebase -->

- ✓ Multi-step waitlist form with name/email collection — existing
- ✓ Supabase storage for waitlist submissions — existing
- ✓ Duplicate email detection (unique constraint) — existing
- ✓ PostHog analytics tracking on join/survey events — existing
- ✓ Toast notifications for user feedback — existing
- ✓ Zod validation for form inputs — existing
- ✓ React Query mutation hooks for waitlist operations — existing

### Active

<!-- New capabilities to build -->

- [ ] Resend integration with API key configuration
- [ ] React email template (simple: logo + "Hey {name}, you're on the waitlist")
- [ ] Server action to send confirmation email after successful join
- [ ] Hook into existing join mutation flow at step 2 (contact submission)
- [ ] Error handling — email failure should not block the waitlist join

### Out of Scope

- Survey completion emails — only sending on initial join
- Email verification / double opt-in — this is a waitlist confirmation, not auth
- Email analytics / open tracking — keep it simple
- Drip campaigns / follow-up sequences — single confirmation only
- Modifying the existing waitlist form UI or steps

## Context

- **Hosting:** VPS with Next.js standalone mode (`output: "standalone"`) — full server capabilities available
- **Existing flow:** Client-side Supabase insert via `useWaitlistJoinMutation()` in `hooks/use-waitlist-mutation.ts`
- **Form component:** `components/feature-modules/waitlist/components/waitlist-form.tsx` — 8-step form, email fires after step 2
- **Monorepo:** Part of a pnpm workspace with shared packages (`@riven/ui`, `@riven/hooks`, `@riven/utils`)
- **Email service:** Resend account with verified sending domain, API key ready
- **Template approach:** React Email for the template — renders to HTML server-side

## Constraints

- **Tech stack**: Resend + React Email — user's choice, domain already verified
- **Non-blocking**: Email send failure must not prevent successful waitlist join
- **Server-side only**: Resend API key must never be exposed to the client
- **Minimal disruption**: Existing waitlist form and mutation logic should change as little as possible

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Server action (not API route) for email | Simpler integration, no new endpoint to manage, works with existing Next.js setup | — Pending |
| Fire email on join step only (not survey completion) | User confirmed — immediate feedback matters, survey is optional | — Pending |
| Non-blocking email send | Waitlist join is the critical path; email is enhancement | — Pending |

---
*Last updated: 2026-02-26 after initialization*
