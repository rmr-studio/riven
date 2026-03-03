---
phase: 03-integration
plan: 01
subsystem: ui
tags: [email, resend, posthog, react-hook-form, next.js, server-action]

# Dependency graph
requires:
  - phase: 02-email-template-server-action
    provides: sendConfirmationEmail server action and WaitlistConfirmation email template
provides:
  - Non-blocking confirmation email wired into waitlist form join flow
  - PostHog email_send_failed event for silent failure observability
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fire-and-forget server action call using .catch() chained to unresolved promise (no await, no void)"
    - "PostHog failure capture with error message only (no PII) as observability for silent async operations"

key-files:
  created: []
  modified:
    - apps/web/components/feature-modules/waitlist/components/waitlist-form.tsx

key-decisions:
  - "Non-blocking call via .catch() (not void or await): intercepts Next.js runtime rejections without blocking the join flow"
  - "Email fires in handleJoin's per-call onSuccess, not in the hook or handleSurveySubmit — fires at step 2, never at survey completion"
  - "No UI mention of email delivery anywhere — email is a silent bonus, join success UX unaffected by email outcome"
  - "Only err.message captured in PostHog (no email address) — no PII in analytics"

patterns-established:
  - "Per-call onSuccess override pattern: hook stays generic, form-level handler owns side effects with in-scope variables"
  - "Silent async side-effect pattern: fire-and-forget with .catch() for PostHog observability, no UI feedback"

requirements-completed: [INTG-01, INTG-02, INTG-03]

# Metrics
duration: 2min
completed: 2026-02-27
---

# Phase 3 Plan 01: Integration Summary

**Fire-and-forget confirmation email wired into waitlist join via sendConfirmationEmail().catch() in handleJoin's per-call onSuccess**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-27T09:17:26Z
- **Completed:** 2026-02-27T09:18:23Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Imported `sendConfirmationEmail` from `@/app/actions/send-confirmation-email` into waitlist form
- Wired email call inside `handleJoin`'s per-call `onSuccess`, after successful Supabase insert
- Email is non-blocking: uses `.catch()` pattern so runtime failures don't surface to user
- PostHog captures `email_send_failed` with `err.message` only (no PII) for silent failure observability
- Build and TypeScript type-check pass with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire sendConfirmationEmail into handleJoin onSuccess** - `da5b9d7df` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `apps/web/components/feature-modules/waitlist/components/waitlist-form.tsx` - Added import and non-blocking email call in handleJoin's onSuccess

## Decisions Made

- Used `.catch()` over `void`: The server action never throws for Resend API failures (returns `{ success: false }`), but if the Next.js runtime itself fails to invoke the action, the promise rejects. `.catch()` catches that case and logs to PostHog; `void` alone would leave an unhandled rejection.
- Email call placed in per-call `onSuccess`, not in the `useWaitlistJoinMutation` hook — keeps the hook generic, email logic stays at the call site where `name` and `email` are in scope.
- No `await` on `sendConfirmationEmail` — join step transition is immediate, email delivery doesn't block UX.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Email pipeline fully wired: signup -> Supabase insert -> confirmation email (non-blocking)
- Integration complete. Phase 3 is the final phase in this project.
- Pending: Upload PNG logo files to cdn.riven.software/images/email/ (logo.png at 240x80, logo-icon.png at 48x48) before testing real emails in production.

---
*Phase: 03-integration*
*Completed: 2026-02-27*
