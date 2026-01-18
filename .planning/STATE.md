# Project State: Riven Landing Page

## Project Reference

**Core Value:** Communicate that Riven lets you build a CRM that fits your business instead of forcing your business to fit the CRM - and capture emails from founders who want early access.

**Current Focus:** Phase 1 - Hero + Infrastructure

## Current Position

```
Phase: 1 of 3 (Hero + Infrastructure)
Plan: 3 of 4 complete
Status: In progress
Progress: [###.......] 30%
```

**Next Action:** Execute plan 01-04 (Hero section composition)

## Phase Summary

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 1 | Hero + Infrastructure | In Progress | 3/4 plans |
| 2 | Content Sections | Pending | 0/? |
| 3 | Polish + Production | Pending | 0/? |

## Performance Metrics

| Metric | Value |
|--------|-------|
| Total Requirements | 33 |
| Completed | ~12 |
| Completion Rate | ~36% |
| Current Phase | 1 |
| Plans Executed | 3 |

## Accumulated Context

### Key Decisions

| Decision | Rationale | Phase |
|----------|-----------|-------|
| 3-phase structure | Quick depth + natural boundaries (hero/content/polish) | Roadmap |
| Form infrastructure in Phase 1 | Critical path - form must work before content sections matter | Roadmap |
| Branding core in Phase 1 | Color palette and typography needed for all subsequent work | Roadmap |
| Bold purple primary (262 83% 58%) | Anti-corporate identity, distinctive brand color | 01-01 |
| shadcn/ui naming conventions | Future component compatibility | 01-01 |
| No dark mode in v1 | Out of scope for MVP | 01-01 |
| useState for QueryClient | SSR best practice, not useMemo | 01-02 |
| Sonner bottom-center | Standard toast position with richColors | 01-02 |
| Button lg size h-12 | Prominent CTA sizing for hero | 01-02 |
| onBlur validation mode | Better UX than onChange (noisy) or onSubmit (late) | 01-03 |
| Form replacement on success | Confirmation message instead of form reset | 01-03 |
| API stub approach | Per PROJECT.md scope, user wires actual backend | 01-03 |

### Technical Decisions

| Decision | Rationale | Plan |
|----------|-----------|------|
| cn() utility pattern | Tailwind class composition via clsx + tailwind-merge | 01-01 |
| Tailwind v4 @theme inline | CSS variable integration for design tokens | 01-01 |
| HSL color values | Consistent with shadcn/ui, easy manipulation | 01-01 |
| forwardRef pattern | Required for all UI components (form integration) | 01-02 |
| cva for variants | class-variance-authority for Button variants | 01-02 |
| Provider pattern | use client directive for context providers | 01-02 |
| zodResolver pattern | React Hook Form + Zod integration for validation | 01-03 |
| useRef for toast ID | Enables loading -> success/error toast transition | 01-03 |
| isSuccess state replacement | Replaces form with confirmation on success | 01-03 |

### TODOs

- [x] Plan Phase 1
- [ ] Execute Phase 1 (3/4 plans complete)
- [ ] Plan Phase 2
- [ ] Execute Phase 2
- [ ] Plan Phase 3
- [ ] Execute Phase 3

### Blockers

(None)

### Warnings

(None)

## Session Continuity

**Last Session:** 2026-01-18
**Last Action:** Completed 01-03-PLAN.md (WaitlistForm component)

**Context for Next Session:**
- Plan 01-03 complete: Full form infrastructure ready
- Zod schema at landing/lib/validations.ts
- API endpoint at landing/app/api/waitlist/route.ts (stub)
- Mutation hook at landing/hooks/use-waitlist-mutation.ts
- WaitlistForm at landing/components/waitlist-form.tsx
- Next: 01-04 (Hero section) will compose WaitlistForm with headline/subline
- All form states working: validation errors, loading spinner, success confirmation, error toast

---
*State initialized: 2026-01-18*
*Last updated: 2026-01-18*
