# Roadmap: Riven Landing Page

**Created:** 2026-01-18
**Depth:** Quick (3 phases)
**Coverage:** 33/33 v1 requirements mapped

## Overview

This roadmap delivers a pre-launch landing page for Riven that communicates the value proposition and captures waitlist signups. Phase 1 establishes the critical conversion path (hero + form + infrastructure). Phase 2 builds supporting content sections that reinforce the value prop. Phase 3 polishes for production with responsive design, branding completion, and footer.

## Phases

### Phase 1: Hero + Infrastructure

**Goal:** Visitors can submit their email to join the waitlist from a compelling hero section.

**Dependencies:** None (foundation phase)

**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md - Install dependencies and establish design system
- [x] 01-02-PLAN.md - Set up providers and UI primitives (Button, Input)
- [x] 01-03-PLAN.md - Build form infrastructure (validation, API, mutation, WaitlistForm)
- [x] 01-04-PLAN.md - Create Hero section and compose landing page

**Requirements:**
- HERO-01: Bold headline communicates value prop in 8 words or fewer
- HERO-02: Subheadline clarifies who it's for and what problem it solves
- HERO-03: Email capture form with single field + submit button
- HERO-04: Form validates email format before submission
- HERO-05: Form shows loading state during submission
- HERO-06: Form shows success state after submission
- HERO-07: Form shows error state if submission fails
- HERO-08: Product visual or mockup establishes tangibility
- TECH-01: TanStack Query provider configured in layout
- TECH-02: Waitlist mutation hook with loading/success/error states
- TECH-03: React Hook Form + Zod for form validation
- TECH-04: Sonner toast notifications for feedback
- TECH-05: Dependencies installed matching /client versions
- BRAND-01: Color palette established (bold, not corporate)
- BRAND-02: Typography hierarchy defined (headline, body, supporting)
- BRAND-04: Visual style is anti-enterprise, founder-friendly

**Success Criteria:**
1. Visitor sees hero with bold headline and understands what Riven does within 5 seconds
2. Visitor can enter email address and submit form with single click
3. Form shows clear loading spinner during submission, then success message or error toast
4. Page uses consistent color palette and typography that feels bold/disruptive

---

### Phase 2: Content Sections

**Goal:** Visitors who scroll understand the problem Riven solves and its key capabilities.

**Dependencies:** Phase 1 (hero and form component exist for reuse)

**Plans:** 3 plans

Plans:
- [ ] 02-01-PLAN.md - Create Pain Points section with CRM frustrations
- [ ] 02-02-PLAN.md - Create Features section with benefit-focused cards and icons
- [ ] 02-03-PLAN.md - Create Final CTA section with WaitlistForm reuse

**Requirements:**
- PAIN-01: Section header introduces the problem space
- PAIN-02: 3-4 specific pain points about rigid CRMs
- PAIN-03: Pain points resonate with founders/small teams audience
- FEAT-01: Section presents 3-4 key Riven capabilities
- FEAT-02: Each feature shows benefit, not just description
- FEAT-03: Features include: custom entity model, workflow automation, non-linear pipelines, templates
- FEAT-04: Visual elements (icons or graphics) accompany features
- CTA-01: Secondary waitlist form at page bottom
- CTA-02: Reinforcement headline for visitors who scrolled
- CTA-03: Reuses WaitlistForm component from hero

**Success Criteria:**
1. Visitor scrolling past hero sees 3-4 pain points that articulate CRM frustrations they recognize
2. Visitor sees 3-4 features with clear benefits (not just descriptions) and visual icons
3. Visitor who reaches page bottom finds secondary CTA with working waitlist form

---

### Phase 3: Polish + Production

**Goal:** Page is responsive, branded, and production-ready.

**Dependencies:** Phase 2 (all sections exist to polish)

**Requirements:**
- RESP-01: Mobile-first design approach
- RESP-02: Hero CTA visible without scrolling on mobile
- RESP-03: Form inputs have 48px minimum touch targets
- RESP-04: Features stack to single column on mobile
- RESP-05: Typography scales appropriately across breakpoints
- BRAND-03: Logo or wordmark present
- FOOT-01: Copyright notice
- FOOT-02: Contact email link
- FOOT-03: Logo/wordmark

**Success Criteria:**
1. On mobile (320px-768px), hero CTA is visible without scrolling and all touch targets are easily tappable
2. Features section stacks to single column on mobile with readable typography
3. Footer displays logo, copyright, and contact email
4. Logo/wordmark appears in header and footer

---

## Progress

| Phase | Status | Requirements | Completed |
|-------|--------|--------------|-----------|
| 1 - Hero + Infrastructure | Complete | 16 | 16 |
| 2 - Content Sections | Planned | 10 | 0 |
| 3 - Polish + Production | Not Started | 9 | 0 |

**Total:** 16/33 requirements complete

---
*Roadmap created: 2026-01-18*
*Last updated: 2026-01-18*
