# Requirements: Riven Landing Page

**Defined:** 2026-01-18
**Core Value:** Communicate that Riven lets you build a CRM that fits your business — and capture waitlist signups

## v1 Requirements

Requirements for initial landing page release.

### Hero Section

- [ ] **HERO-01**: Bold headline communicates value prop in 8 words or fewer
- [ ] **HERO-02**: Subheadline clarifies who it's for and what problem it solves
- [ ] **HERO-03**: Email capture form with single field + submit button
- [ ] **HERO-04**: Form validates email format before submission
- [ ] **HERO-05**: Form shows loading state during submission
- [ ] **HERO-06**: Form shows success state after submission
- [ ] **HERO-07**: Form shows error state if submission fails
- [ ] **HERO-08**: Product visual or mockup establishes tangibility

### Pain Points Section

- [ ] **PAIN-01**: Section header introduces the problem space
- [ ] **PAIN-02**: 3-4 specific pain points about rigid CRMs
- [ ] **PAIN-03**: Pain points resonate with founders/small teams audience

### Features Section

- [ ] **FEAT-01**: Section presents 3-4 key Riven capabilities
- [ ] **FEAT-02**: Each feature shows benefit, not just description
- [ ] **FEAT-03**: Features include: custom entity model, workflow automation, non-linear pipelines, templates
- [ ] **FEAT-04**: Visual elements (icons or graphics) accompany features

### Final CTA Section

- [ ] **CTA-01**: Secondary waitlist form at page bottom
- [ ] **CTA-02**: Reinforcement headline for visitors who scrolled
- [ ] **CTA-03**: Reuses WaitlistForm component from hero

### Technical Infrastructure

- [ ] **TECH-01**: TanStack Query provider configured in layout
- [ ] **TECH-02**: Waitlist mutation hook with loading/success/error states
- [ ] **TECH-03**: React Hook Form + Zod for form validation
- [ ] **TECH-04**: Sonner toast notifications for feedback
- [ ] **TECH-05**: Dependencies installed matching /client versions

### Responsive Design

- [ ] **RESP-01**: Mobile-first design approach
- [ ] **RESP-02**: Hero CTA visible without scrolling on mobile
- [ ] **RESP-03**: Form inputs have 48px minimum touch targets
- [ ] **RESP-04**: Features stack to single column on mobile
- [ ] **RESP-05**: Typography scales appropriately across breakpoints

### Branding

- [ ] **BRAND-01**: Color palette established (bold, not corporate)
- [ ] **BRAND-02**: Typography hierarchy defined (headline, body, supporting)
- [ ] **BRAND-03**: Logo or wordmark present
- [ ] **BRAND-04**: Visual style is anti-enterprise, founder-friendly

### Footer

- [ ] **FOOT-01**: Copyright notice
- [ ] **FOOT-02**: Contact email link
- [ ] **FOOT-03**: Logo/wordmark

## v2 Requirements

Deferred to future iteration.

### Enhancements

- **ANI-01**: Scroll-triggered animations with Framer Motion
- **ANI-02**: Staggered entrance effects for feature cards
- **PROOF-01**: Waitlist count display ("Join X founders")
- **PROOF-02**: Founder credentials or background
- **REF-01**: Referral system for waitlist position
- **PERF-01**: Vercel Analytics integration
- **META-01**: Open Graph meta tags for social sharing

## Out of Scope

Explicitly excluded from this project.

| Feature | Reason |
|---------|--------|
| Pricing section | Product not priced yet; creates objections |
| Login/signup flows | Pre-launch, no product to log into |
| Blog/content pages | Scope creep; single page focus |
| Multiple competing CTAs | Dilutes conversion focus |
| Complex multi-field forms | Every field reduces conversion 10-20% |
| Backend waitlist endpoint | User wiring separately |
| Email confirmation flow | Depends on backend scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HERO-01 | Phase 1 | Pending |
| HERO-02 | Phase 1 | Pending |
| HERO-03 | Phase 1 | Pending |
| HERO-04 | Phase 1 | Pending |
| HERO-05 | Phase 1 | Pending |
| HERO-06 | Phase 1 | Pending |
| HERO-07 | Phase 1 | Pending |
| HERO-08 | Phase 1 | Pending |
| PAIN-01 | Phase 2 | Pending |
| PAIN-02 | Phase 2 | Pending |
| PAIN-03 | Phase 2 | Pending |
| FEAT-01 | Phase 2 | Pending |
| FEAT-02 | Phase 2 | Pending |
| FEAT-03 | Phase 2 | Pending |
| FEAT-04 | Phase 2 | Pending |
| CTA-01 | Phase 2 | Pending |
| CTA-02 | Phase 2 | Pending |
| CTA-03 | Phase 2 | Pending |
| TECH-01 | Phase 1 | Pending |
| TECH-02 | Phase 1 | Pending |
| TECH-03 | Phase 1 | Pending |
| TECH-04 | Phase 1 | Pending |
| TECH-05 | Phase 1 | Pending |
| RESP-01 | Phase 3 | Pending |
| RESP-02 | Phase 3 | Pending |
| RESP-03 | Phase 3 | Pending |
| RESP-04 | Phase 3 | Pending |
| RESP-05 | Phase 3 | Pending |
| BRAND-01 | Phase 1 | Pending |
| BRAND-02 | Phase 1 | Pending |
| BRAND-03 | Phase 3 | Pending |
| BRAND-04 | Phase 1 | Pending |
| FOOT-01 | Phase 3 | Pending |
| FOOT-02 | Phase 3 | Pending |
| FOOT-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-18*
*Last updated: 2026-01-18 after initial definition*
