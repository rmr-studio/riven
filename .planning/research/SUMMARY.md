# Project Research Summary

**Project:** Riven Landing Page (Pre-launch SaaS)
**Domain:** Pre-launch waitlist landing page for B2B SaaS CRM platform
**Researched:** 2026-01-18
**Confidence:** HIGH (stack verified against codebase) / MEDIUM (conversion patterns from training data)

## Executive Summary

Riven's pre-launch landing page is a well-scoped project with low technical risk. The technology stack mirrors the existing `/client` application (React 19, Next.js 16, TanStack Query, React Hook Form, Framer Motion), meaning all libraries are already proven compatible and patterns are documented. The primary challenge is not technical but communicative: translating a complex product (custom entities, non-linear pipelines, workflow automation) into clear, compelling copy that resonates with frustrated founders without triggering "feature soup" overwhelm.

The recommended approach follows a problem-agitation-solution flow with dual CTA placement. The page should lead with pain ("Stop fighting your CRM"), not features ("customizable entity model"). Hero + email capture is the critical path. Mobile-first design is non-negotiable given 40-60% mobile traffic. The form must be email-only with clear loading/success/error states.

Key risks are messaging-related, not technical: (1) Curse of Knowledge — explaining product internals instead of outcomes; (2) Bold Tone Backfire — empty claims without specifics undermine the "disruptive" positioning; (3) Feature Soup — trying to explain all four major capabilities equally. Mitigation: External copy review before design work, enforce "one hero message + max 3 features" structure, apply "So what?" test relentlessly.

## Key Findings

### Recommended Stack

The stack is fully aligned with the existing `/client` application, ensuring compatibility and pattern reuse. All core libraries have been version-verified against `/client/package.json`.

**Core technologies:**
- **TanStack Query 5.81.2:** Server state for waitlist mutation — explicit requirement from PROJECT.md, matches /client
- **React Hook Form 7.58.1 + Zod 3.25.67:** Form handling with schema validation — lightweight, type-safe, matches /client
- **Framer Motion 12.23.24:** Page animations — React 19 compatible, scroll-triggered animations, matches /client
- **class-variance-authority + clsx + tailwind-merge:** UI utilities — component variants, class composition, matches /client
- **sonner 2.0.7:** Toast notifications — success/error feedback for form submission, matches /client

**Stack confidence: HIGH** — All versions verified against existing codebase. No exploratory decisions required.

### Expected Features

**Must have (table stakes):**
- Hero section with bold headline and clear value proposition
- Single email capture form with loading/success/error states
- Pain points section (2-4 specific frustrations with existing CRMs)
- Feature highlights (3-4 key capabilities, benefit-focused)
- Mobile responsive design (40-60% of traffic)
- Fast load time (<3 seconds LCP target <2s)
- Basic footer with branding

**Should have (differentiators):**
- Bold, disruptive copy (specific claims, not adjectives)
- Waitlist count/momentum display (after 100+ signups)
- Early access incentive ("First 100 get lifetime discount")
- Product preview/mockups (makes it tangible)
- Specific target audience call-out ("For founders and small teams")

**Defer to v2+:**
- Social proof section (wait for real data)
- Referral system ("invite friends, move up the list")
- Interactive elements
- Founder story/manifesto section

**Anti-features (deliberately exclude):**
- Pricing section (creates objections pre-launch)
- Multiple CTAs (dilutes focus)
- Complex forms (every field reduces conversion 10-20%)
- Blog/content pages (scope creep)
- Login/signup flows (no product to log into)

### Architecture Approach

The landing page follows a standard section-based architecture with centralized form logic. Sections are layout/content components (stateless), while form logic is encapsulated in a single WaitlistForm component reused in Hero and FinalCTA sections. TanStack Query handles the waitlist mutation with toast feedback.

**Major components:**
1. **Hero Section** — Headline, value prop, primary CTA (renders WaitlistForm)
2. **PainPoints Section** — 2-4 specific frustrations, static content
3. **Features Section** — 3-4 key capabilities with benefit-focused copy
4. **FinalCTA Section** — Secondary conversion point (renders WaitlistForm)
5. **WaitlistForm** — Email input, Zod validation, mutation, states (reused)

**Section order:** Hero > Pain Points > Solution/Features > Final CTA > Footer. This follows problem-agitation-solution flow. Dual CTA placement captures both impulse conversions (hero) and considered conversions (bottom).

### Critical Pitfalls

1. **Curse of Knowledge** — Explaining "custom entity model" instead of "build a CRM that fits YOUR business." Prevention: Lead with pain, not features. External review before design. "So what?" test on every claim.

2. **Bold Tone Without Substance** — "Revolutionary CRM" claims without specifics. Prevention: Specific > superlative. Show don't tell (screenshots/mockups). If a competitor could make the same claim, rewrite.

3. **Feature Soup** — Trying to explain all 4 major features equally. Prevention: ONE hero benefit, MAX 3 features in detail. Progressive disclosure via waitlist-first structure.

4. **Form Friction** — Multiple fields, silent failures. Prevention: Email only. Obvious loading state. Celebrate success clearly. Test on slow mobile connection.

5. **Mobile Afterthought** — Desktop-first design breaks on 50%+ of traffic. Prevention: Design mobile-first, test on real devices, ensure CTA visible without scroll at 320px width.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Project Setup and Core Infrastructure

**Rationale:** Dependencies must be installed and providers configured before any components can be built. This is mechanical but necessary foundation.
**Delivers:** Working development environment with all required libraries and provider patterns
**Addresses:** Stack installation from STACK.md
**Avoids:** Version incompatibility issues (pre-verified against /client)

**Tasks:**
- Install core dependencies (TanStack Query, RHF, Zod, Framer Motion, etc.)
- Set up QueryProvider and Toaster in layout
- Configure Tailwind v4 (verify existing setup)
- Set up shadcn/ui and add Button, Input components
- Create cn() utility and base file structure

### Phase 2: Messaging and Copy Foundation

**Rationale:** PITFALLS.md identifies messaging as the highest-risk area. Copy must be finalized BEFORE design work to prevent Curse of Knowledge and Feature Soup pitfalls.
**Delivers:** Final copy for all sections reviewed by external party
**Addresses:** Hero headline, pain points, feature descriptions, CTA text
**Avoids:** Curse of Knowledge, Bold Tone Backfire, Feature Soup

**Tasks:**
- Draft hero headline and subheadline (benefit-focused, not feature-focused)
- Write 3-4 specific pain points (in customer language)
- Create 3 feature descriptions with "So what?" answers
- External review (non-technical person reads and explains back)
- Iterate until copy passes specificity test

### Phase 3: Hero Section with Form

**Rationale:** Hero + email capture is the critical conversion path. Most visitors decide in 3-5 seconds and many convert from hero alone.
**Delivers:** Working hero section with functional waitlist form (frontend only)
**Implements:** Hero component, WaitlistForm component, useWaitlistMutation hook
**Avoids:** Above-the-Fold CTA pitfall, Form Friction pitfall

**Tasks:**
- Build Hero layout (mobile-first)
- Implement WaitlistForm with RHF + Zod validation
- Create useWaitlistMutation hook with loading/success/error toast states
- Stub API route (/api/waitlist) returning success
- Test form UX: loading spinner, success celebration, error handling
- Ensure CTA visible on 768px viewport without scroll

### Phase 4: Supporting Sections

**Rationale:** Pain Points and Features sections support the hero but don't convert directly. Build after critical path is working.
**Delivers:** Complete page content sections
**Addresses:** Pain Points section, Features section, Final CTA section from FEATURES.md
**Implements:** PainPoints, Features, FinalCTA components

**Tasks:**
- Build PainPoints section (3-4 items, visual hierarchy)
- Build Features section (3 features max, with icons)
- Build FinalCTA section (reuses WaitlistForm)
- Add Framer Motion scroll-triggered animations
- Build Footer component

### Phase 5: Visual Polish and Mobile Optimization

**Rationale:** Mobile traffic is 40-60%. Polish and mobile testing must happen before launch, not after.
**Delivers:** Production-ready responsive design
**Avoids:** Mobile Afterthought pitfall, Generic Visuals pitfall, Slow Page Load pitfall

**Tasks:**
- Real-device mobile testing (iPhone, Android)
- Test at 320px width minimum
- Performance optimization (LCP < 2s target)
- Add favicon and Open Graph meta tags
- Configure social share preview images
- Test with Lighthouse and 3G throttling

### Phase 6: Analytics and Launch Prep

**Rationale:** Analytics must be firing before launch to measure conversion. Can't optimize what you can't measure.
**Delivers:** Launch-ready page with tracking
**Avoids:** Analytics Not Set Up pitfall, Missing Favicon/Meta pitfall

**Tasks:**
- Set up Vercel Analytics (or Plausible/PostHog)
- Track: page views, scroll depth, form starts, form completions
- Test all tracking events fire correctly
- Run pre-launch checklist from PITFALLS.md
- Verify form works with JS disabled (graceful degradation)

### Phase Ordering Rationale

- **Setup before components:** Cannot build without dependencies
- **Copy before design:** Messaging mistakes are expensive to fix after design. External validation prevents Curse of Knowledge.
- **Hero before sections:** Critical conversion path. If hero doesn't convert, supporting sections are irrelevant.
- **Desktop before mobile polish:** Get structure working, then optimize. But design mobile-first to avoid retrofit pain.
- **Analytics before launch:** Must be measuring from day one.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Messaging):** Copy is subjective. May need multiple external review rounds. No technical research needed.
- **Phase 5 (Mobile):** Test on actual devices, not just DevTools. Real-world performance may differ from Lighthouse scores.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Setup):** Fully documented, patterns from /client
- **Phase 3 (Hero/Form):** Well-documented RHF + TanStack Query patterns
- **Phase 4 (Sections):** Standard React components, no special patterns
- **Phase 6 (Analytics):** Vercel Analytics is zero-config

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against /client/package.json |
| Features | MEDIUM | Based on established landing page patterns; no 2025-2026 trend verification |
| Architecture | MEDIUM | Standard patterns; Next.js 16 specifics unverified |
| Pitfalls | MEDIUM | Enduring conversion principles; specific benchmarks may have shifted |

**Overall confidence:** MEDIUM-HIGH

Stack decisions are locked and verified. Conversion patterns are well-established. Main uncertainty is messaging effectiveness (subjective) and Next.js 16 / Tailwind v4 edge cases (minor).

### Gaps to Address

- **shadcn/ui + Tailwind v4:** Verify CLI works with Tailwind v4 config during Phase 1 setup
- **Framer Motion + React 19 Server Components:** May need "use client" directives on animated components; verify during Phase 4
- **Backend scope:** API route is stubbed; actual Supabase integration is explicitly out of scope per PROJECT.md
- **Copy effectiveness:** No way to validate until real traffic; plan for iteration post-launch

## Sources

### Primary (HIGH confidence)
- `/client/package.json` — Version verification for all libraries
- `/landing/package.json` — Existing setup verification (Next.js 16.1.1, React 19.2.3, Tailwind v4)
- `/client/CLAUDE.md` — Established patterns for TanStack Query, RHF
- `PROJECT.md` — Explicit requirements (TanStack Query, brand tone)

### Secondary (MEDIUM confidence)
- Established landing page conversion patterns (training data)
- Pre-launch SaaS waitlist best practices (training data)
- Form conversion optimization research (well-documented field)

### Tertiary (LOW confidence)
- GSAP vs Framer Motion bundle size comparison (training data, may have changed)
- Mobile traffic percentages (may vary by audience)
- Load time conversion impact thresholds (established but may have shifted)

---
*Research completed: 2026-01-18*
*Ready for roadmap: yes*
