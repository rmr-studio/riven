# Architecture

**Analysis Date:** 2026-02-26

## Pattern Overview

**Overall:** Next.js 16 full-stack application with feature module architecture and server/client separation.

**Key Characteristics:**
- Modular feature-based component organization
- Clear separation of UI concerns (layout, features, primitives)
- Client-side data management with React Query
- Authentication and state provided through React Context
- Configuration-driven form flows
- Integration with external services (Supabase, PostHog, GitHub)

## Layers

**Presentation Layer:**
- Purpose: Render UI components and handle user interactions
- Location: `components/`
- Contains: React components, feature modules, UI primitives
- Depends on: Hooks, Providers, Utilities, External libraries (framer-motion, motion, embla-carousel)
- Used by: App routes and layout

**Feature Modules Layer:**
- Purpose: Self-contained feature implementations with internal organization
- Location: `components/feature-modules/`
- Contains: Hero, FeaturesOverview, FAQ, Waitlist, OpenSource, TimeSaved, CrossDomainIntelligence
- Depends on: UI components, hooks, configuration
- Used by: Home page composition

**Application Layer:**
- Purpose: Route handling, SEO metadata, page composition
- Location: `app/`
- Contains: Layout, page routes, metadata, robots, sitemap
- Depends on: Providers, Navbar, Footer, Feature modules
- Used by: Next.js router

**Provider/Context Layer:**
- Purpose: Global state management and context setup
- Location: `providers/`
- Contains: AuthProvider, QueryProvider, ThemeProvider, MotionProvider
- Depends on: Supabase, React Query, next-themes, motion
- Used by: Root layout wrapping application

**Utilities & Helpers Layer:**
- Purpose: Cross-cutting utility functions and shared logic
- Location: `lib/` and `hooks/`
- Contains: Environment validation, Supabase client, validation schemas, scroll utilities, breakpoint detection
- Depends on: External validation (zod), Supabase, React hooks
- Used by: All application layers

## Data Flow

**Authentication Flow:**

1. Root layout initializes `AuthProvider`
2. `AuthProvider` creates Supabase client and checks session on mount
3. Session state stored in AuthContext
4. Components consume auth state via `useAuth()` hook
5. Navbar conditionally renders dashboard link based on user presence

**Form Submission Flow (Waitlist Example):**

1. `WaitlistForm` collects multi-step form data using react-hook-form
2. Form validation handled by `waitlistFormSchema` (zod)
3. Form steps defined in `components/feature-modules/waitlist/config/steps.ts`
4. On submit, `useWaitlistJoinMutation()` or `useWaitlistUpdateMutation()` triggered
5. Mutations execute Supabase database operations
6. React Query manages async state (loading, success, error)
7. Toast notifications via sonner provide user feedback
8. PostHog captures failure events for analytics

**Data Query Flow (GitHub Stars Example):**

1. `OpenSource` component calls `useGitHubStars()` hook
2. Hook uses React Query to fetch star count
3. Component displays loading state while fetching
4. On success, formatted star count rendered
5. Error state defaults to undefined (component handles gracefully)

**Page Composition Flow:**

1. App router loads `app/layout.tsx`
2. Layout wraps application in Providers (Theme, Motion, Query, Auth)
3. Layout renders Navbar and Footer globally
4. `app/page.tsx` composes feature modules vertically
5. Feature modules are client components with motion animations
6. Page transitions animated via `app/template.tsx` with motion.div

**State Management:**

- **Global state:** Theme (next-themes), Auth (AuthContext), Queries (React Query)
- **Component state:** Form state (react-hook-form), UI state (useState hooks)
- **Configuration:** Navigation links, form steps, validation rules stored as constants

## Key Abstractions

**Feature Module Pattern:**
- Purpose: Self-contained sections of the landing page
- Examples: `components/feature-modules/hero/`, `components/feature-modules/waitlist/`, `components/feature-modules/features/`
- Pattern: Each module contains components, configuration, and queries in subdirectories

**Section Container:**
- Purpose: Standardized container for landing page sections
- Examples: Used by all feature modules via `Section` component
- Pattern: `<Section id="section-id">` with className props for styling

**Form Configuration:**
- Purpose: Centralize form step definitions and field mappings
- Examples: `components/feature-modules/waitlist/config/steps.ts`
- Pattern: Enums for steps, record mappings for fields, constants for styling

**Query Hook Pattern:**
- Purpose: Encapsulate data fetching logic with React Query
- Examples: `hooks/use-waitlist-mutation.ts`, `components/feature-modules/open-source/query/use-github-stars.ts`
- Pattern: useMutation or useQuery wrappers with error handling and toast notifications

**Provider Composition:**
- Purpose: Establish context hierarchy without prop drilling
- Examples: Auth, Query, Theme, Motion providers
- Pattern: Context creation with optional feature toggle (AUTH_ENABLED environment variable)

## Entry Points

**Application Entry:**
- Location: `app/layout.tsx`
- Triggers: Next.js app router initialization
- Responsibilities: Provide global layout structure, wrap with context providers, set metadata, load fonts

**Home Page:**
- Location: `app/page.tsx`
- Triggers: Route `/` navigation
- Responsibilities: Compose feature modules into page layout

**Privacy Page:**
- Location: `app/privacy/page.tsx`
- Triggers: Route `/privacy` navigation
- Responsibilities: Render privacy policy

**Client Hydration:**
- Location: `app/template.tsx`
- Triggers: Page transitions
- Responsibilities: Animate page transitions with framer-motion

## Error Handling

**Strategy:** Defensive composition with graceful degradation

**Patterns:**
- **Network errors:** Caught in mutation/query handlers, displayed via toast notifications
- **Validation errors:** Caught by react-hook-form, displayed inline or via toast
- **Environment errors:** Validated at build time via `lib/env.ts` using Zod schemas
- **Auth errors:** AuthProvider initializes with null user if disabled, components check loading state
- **Missing data:** Components handle undefined data (e.g., GitHub stars default to undefined)
- **Database constraints:** Unique constraint violations (email already on waitlist) caught by error code detection

## Cross-Cutting Concerns

**Logging:** PostHog integration for event tracking on errors and form submissions
- Used in: `hooks/use-waitlist-mutation.ts`
- Pattern: `posthog.capture(eventName, properties)`

**Validation:** Zod schema definitions for all form inputs
- Used in: `lib/validations.ts`
- Pattern: Schema definition → Type inference → Form integration

**Authentication:** Supabase SSR client for session management
- Used in: `providers/auth-provider.tsx`, `hooks/use-waitlist-mutation.ts`
- Pattern: Create client, check session, listen for auth state changes

**Styling:** Tailwind CSS with class merging utility
- Used in: All components
- Pattern: `cn(className, twMerge)` for combining conditional classes

**Responsive Design:** Custom hooks for breakpoint detection
- Used in: Components needing responsive behavior
- Pattern: `useBreakpoint()` returns current breakpoint, media query listeners

---

*Architecture analysis: 2026-02-26*
