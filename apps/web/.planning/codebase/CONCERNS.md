# Codebase Concerns

**Analysis Date:** 2026-02-26

## Tech Debt

**Large SVG/Graphic Components:**
- Issue: Multiple feature graphic components exceed 400+ lines, mixing SVG markup with React state and animations
- Files:
  - `components/feature-modules/features/data-model/components/graphic/2.integrations.tsx` (563 lines)
  - `components/feature-modules/features/data-model/components/graphic/3.identity-matching.tsx` (425 lines)
  - `components/feature-modules/features/data-model/components/graphic/3.identity-matching-sm.tsx` (420 lines)
  - `components/feature-modules/features/data-model/components/graphic/7.templates.tsx` (479 lines)
- Impact: Difficult to maintain, hard to test, performance concerns with complex SVG animations, poor component reusability
- Fix approach: Extract common SVG patterns (filters, gradients, animations) into shared utility functions. Create smaller, composable graphic components. Consider SVG optimization tools for production.

**Privacy Policy Page Size:**
- Issue: `app/privacy/page.tsx` is 751 lines, containing all policy content inline as JSX
- Files: `app/privacy/page.tsx`
- Impact: Large single component makes changes difficult to review, hard to version control legal updates, performance burden for a legal document page
- Fix approach: Extract policy sections into separate content files or a CMS. Consider splitting into multiple pages by section. Use a structured format (markdown with frontmatter) for easier legal review and updates.

**Multi-Step Form Complexity:**
- Issue: `components/feature-modules/waitlist/components/waitlist-form.tsx` (410 lines) manages complex multi-step form logic with keyboard shortcuts, animations, and API calls
- Files: `components/feature-modules/waitlist/components/waitlist-form.tsx`
- Impact: Component handles too many concerns (state management, validation, navigation, analytics, UI). High cognitive load. Difficult to test individual flows.
- Fix approach: Extract form logic into a custom hook (`useWaitlistFormState`). Move step rendering into separate components. Create a form state machine to manage complex transitions.

## Known Bugs

**Sitemap Missing Blog Routes:**
- Symptom: Sitemap generation incomplete for blog content
- Files: `app/sitemap.ts` (line 21 TODO comment)
- Trigger: Current sitemap only includes static routes
- Workaround: None - blog routes not crawlable by search engines
- Fix: Implement dynamic blog post fetching in sitemap generation when blog system is available

## Error Handling

**GitHub API Fallback:**
- Issue: GitHub stars query has minimal error handling
- Files: `components/feature-modules/open-source/query/use-github-stars.ts`
- Current state: Throws generic error, no retry logic, no fallback value
- Risk: Component will show error state if GitHub API is rate-limited or temporarily unavailable
- Recommendation: Add retry logic with exponential backoff, return cached/stale value on failure, implement circuit breaker pattern for external API calls

**Waitlist Form Error Handling Gap:**
- Issue: Survey submission error handling is silent for update failures
- Files: `hooks/use-waitlist-mutation.ts` (line 83 - no error callback for update mutation)
- Current state: Error toast shows generic message without capturing error details
- Risk: Users may not know survey submission failed, survey data may not be persisted
- Recommendation: Add explicit error handling in `handleSurveySubmit` callback in `waitlist-form.tsx`. Log detailed error to analytics. Consider retry UI.

## Performance Bottlenecks

**Heavy SVG Rendering:**
- Problem: Multiple large SVG components with Framer Motion animations on main landing page
- Files: Multiple graphic components in `components/feature-modules/`
- Cause: Complex SVG paths, animated filters, and motion.g elements without performance optimizations
- Improvement path:
  - Use `will-change` CSS sparingly on animated elements
  - Consider lazy loading graphic components below the fold
  - Profile with DevTools Performance tab to identify jank
  - Consider WebGL alternatives for complex animations
  - Use CSS containment (`contain: layout paint`) on SVG containers

**Form Validation Overhead:**
- Problem: `waitlist-form.tsx` triggers field validation frequently during multi-step workflow
- Files: `components/feature-modules/waitlist/components/waitlist-form.tsx` (lines 73-125)
- Cause: Form uses `trigger()` to validate before each step transition; re-renders all watched fields on changes
- Improvement path: Debounce validation, use form state subscriptions more efficiently, consider moving to form state machine for explicit validation triggers

## Fragile Areas

**Supabase Client Initialization:**
- Files: `lib/supabase.ts`, `hooks/use-waitlist-mutation.ts`
- Why fragile: Client is created fresh on each hook call, could lead to race conditions if multiple mutations fire simultaneously
- Safe modification: Memoize Supabase client instance, ensure singleton pattern in client creation
- Test coverage: No tests visible for client initialization or mutation error scenarios

**Keyboard Event Handling:**
- Files: `components/feature-modules/waitlist/components/waitlist-form.tsx` (lines 253-282)
- Why fragile: Global keyboard listeners added without proper cleanup verification, event.target type casting to HTMLElement without validation
- Safe modification: Add defensive checks for target.tagName, ensure cleanup is called on unmount, test with different input types
- Test coverage: No visible tests for keyboard navigation flow

**Animation Context Dependency:**
- Files: Multiple graphic components depend on `animate-context.tsx`
- Why fragile: Silent failure if `useAnimateOnMount` is called outside provider context, no error boundaries
- Safe modification: Add error boundary wrapper for feature modules, make animation context optional with fallback behavior
- Test coverage: No tests for animation context failures

## Scaling Limits

**CDN Image Loading:**
- Current capacity: Uses `getCdnUrl()` helper for image loading with hardcoded pattern
- Limit: If CDN URL env var is not set, falls back to local `/public` directory - could cause mismatches in production
- Scaling path: Implement image optimization service (Vercel Image Optimization or Cloudinary), add image loading metrics to analytics, implement progressive image loading

**Waitlist Database Growth:**
- Current capacity: Unlimited inserts into `waitlist_submissions` table with simple unique constraint on email
- Limit: No pagination, sorting, or filtering logic visible for managing large waitlist datasets
- Scaling path: Add database indexes on creation date and involvement type, implement pagination for admin views, consider archiving old submissions

## Dependencies at Risk

**Framer Motion Integration:**
- Risk: Uses `motion-react` and `motion` packages simultaneously (`motion-react` is alpha version)
- Files: Multiple components import from both `framer-motion` and `motion/react`
- Impact: Could break if motion-react API changes (alpha stability risk), adds duplicate dependencies
- Migration plan: Standardize on single motion library (recommend `framer-motion` stable), remove `motion-react`, test all animations thoroughly

**PostHog Configuration Coupling:**
- Risk: Analytics captured in multiple components but PostHog initialization happens globally with optional env vars
- Files: `hooks/use-waitlist-mutation.ts`, `components/feature-modules/waitlist/components/waitlist-form.tsx`, `lib/env.ts`
- Impact: Silent failures if PostHog keys misconfigured, no way to verify analytics are being captured in development
- Recommendation: Create analytics wrapper module that validates PostHog setup on app boot, add dev warnings for missing config

## Missing Critical Features

**No Testing Infrastructure:**
- Problem: Zero visible test files (no `*.test.ts`, `*.spec.ts` files found)
- Blocks: Cannot verify form flows, SVG rendering, API integrations with confidence
- Impact: Refactoring is risky, new features may break existing functionality undetected

**No Error Boundary Components:**
- Problem: No Error Boundary wrappers visible in feature modules
- Blocks: Single component crash can bring down entire feature section
- Impact: Poor user experience if animation context fails or query fails

**No Analytics Validation:**
- Problem: PostHog events captured in components but no way to verify they're being sent
- Blocks: Cannot measure feature adoption, user flows, error rates
- Impact: Decision-making based on incomplete or missing data

## Test Coverage Gaps

**Multi-Step Form Flows:**
- What's not tested: Step navigation, keyboard shortcuts, validation between steps, API mutation error handling
- Files: `components/feature-modules/waitlist/components/waitlist-form.tsx`, `hooks/use-waitlist-mutation.ts`
- Risk: Breaking changes to step logic could go unnoticed; keyboard navigation could fail silently
- Priority: High - core user conversion flow

**GraphQL/API Data Fetching:**
- What's not tested: GitHub stars query error handling, retry logic, rate limiting behavior
- Files: `components/feature-modules/open-source/query/use-github-stars.ts`
- Risk: External API failures not gracefully handled
- Priority: Medium - affects feature completion percentage on page

**SVG Animations:**
- What's not tested: Complex SVG path animations, filter effects, scroll-triggered animations
- Files: `components/feature-modules/features/data-model/components/graphic/*.tsx`
- Risk: Performance regressions, animation glitches in production
- Priority: Medium - affects perceived performance and polish

**Layout and Responsive Design:**
- What's not tested: Mobile navigation, tablet breakpoints, form layout responsiveness
- Files: `components/ui/mobile-nav-menu.tsx`, `components/feature-modules/waitlist/components/waitlist-form.tsx`
- Risk: Mobile experience could be broken without detection
- Priority: High - direct impact on mobile conversion

## Security Considerations

**Environment Variable Exposure:**
- Risk: Public env vars containing URLs and keys are baked into Docker image
- Files: `Dockerfile` (lines 21-33), `lib/env.ts`
- Current mitigation: Uses Next.js NEXT_PUBLIC_ convention to control exposure
- Recommendations:
  - Audit which env vars are truly public
  - Use runtime config for sensitive values if possible
  - Implement CSP headers to restrict external resource loading
  - Verify Supabase anon key has proper RLS policies

**Form Input Validation:**
- Risk: Email and name inputs validated only on client with Zod
- Files: `lib/validations.ts`
- Current mitigation: Zod schema enforces format, Supabase unique constraint on email
- Recommendations:
  - Add server-side validation before database insert
  - Implement rate limiting on waitlist join endpoint
  - Add CSRF protection for form submissions
  - Sanitize name input to prevent XSS if displayed back to user

**Supabase RLS Policies:**
- Risk: No visible RLS policy configuration in codebase
- Current mitigation: Using anon key with limited scope
- Recommendations:
  - Document RLS policies for waitlist_submissions table
  - Restrict insert/update operations to anon users
  - Audit row-level security policies to ensure data isolation

---

*Concerns audit: 2026-02-26*
