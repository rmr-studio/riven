# External Integrations

**Analysis Date:** 2026-02-26

## APIs & External Services

**Analytics & Telemetry:**
- PostHog - Product analytics for event tracking and user behavior
  - SDK/Client: posthog-js 1.352.0
  - Initialization: `instrumentation-client.ts`
  - Auth: `NEXT_PUBLIC_POSTHOG_KEY` (required when enabled)
  - Host: `NEXT_PUBLIC_POSTHOG_HOST` (required when enabled)
  - Usage: Event tracking in `hooks/use-waitlist-mutation.ts`, `components/feature-modules/waitlist/components/waitlist-form.tsx`

## Data Storage

**Databases:**
- Supabase PostgreSQL
  - Client: @supabase/supabase-js 2.97.0
  - SSR Support: @supabase/ssr 0.6.1
  - Connection: Browser-side via `lib/supabase.ts` using `createBrowserClient()`
  - URL: `NEXT_PUBLIC_SUPABASE_URL`
  - Public Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Tables: `waitlist_submissions` (email, name, operational_headache, integrations, monthly_price, involvement)

**File Storage:**
- Supabase Storage (implicit, available through @supabase/supabase-js)

**CDN & Image Hosting:**
- Custom CDN: cdn.riven.software
  - URL: `NEXT_PUBLIC_CDN_URL` (optional)
  - Usage: OG images, static assets
  - Configured in `next.config.ts` as remote image pattern for Next.js Image optimization

**Caching:**
- Client-side Query Caching: React Query (@tanstack/react-query)
  - Stale time: 60 seconds (1 minute)
  - Config: `providers/query-provider.tsx`

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (optional, feature-flagged)
  - Implementation: `providers/auth-provider.tsx`
  - Enabled: `NEXT_PUBLIC_AUTH_ENABLED` env var ("true" or "false")
  - Client: Supabase browser client
  - Session: Managed via `supabase.auth.getSession()` and `onAuthStateChange()` listeners
  - Cross-app sharing: Supported via `NEXT_PUBLIC_COOKIE_DOMAIN` for shared auth cookies

**Context API:**
- Custom AuthContext in `providers/auth-provider.tsx` provides `user` and `loading` state

## Monitoring & Observability

**Error Tracking:**
- PostHog integration captures event failures
  - Events: `waitlist_join_failed`, `waitlist_survey_failed` with error messages

**Logs:**
- Console-based logging (implicit through browser/Node.js)
- Next.js telemetry disabled: `NEXT_TELEMETRY_DISABLED=1` in production Docker image

## CI/CD & Deployment

**Hosting:**
- Docker containerization with multi-stage build (`Dockerfile`)
- Base image: Node.js 22-Alpine
- Output: Next.js standalone mode (optimized for Docker)
- Port: 3000
- User: nextjs (non-root)

**Build Pipeline:**
- Not detected (CI/CD system not visible in repository)

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- When PostHog enabled: both `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` required together

**Optional env vars:**
- `NEXT_PUBLIC_AUTH_ENABLED` - Enable/disable Supabase auth ("true" or "false")
- `NEXT_PUBLIC_COOKIE_DOMAIN` - Shared cookie domain for cross-app auth
- `NEXT_PUBLIC_SITE_URL` - Canonical site URL (used in metadata)
- `NEXT_PUBLIC_CLIENT_URL` - Dashboard app URL
- `NEXT_PUBLIC_CDN_URL` - Custom CDN URL for assets and images
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog analytics key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog API host

**Secrets location:**
- Root `.env` file (loaded by dotenv CLI in npm scripts)
- Never committed to git (.gitignore)
- Docker: Passed as build args during image build (`ARG` in Dockerfile)

## Data Flow

**Waitlist Submission:**
1. User submits form in `components/feature-modules/waitlist/components/waitlist-form.tsx`
2. `useWaitlistJoinMutation()` hook called from `hooks/use-waitlist-mutation.ts`
3. Data inserted into Supabase `waitlist_submissions` table via `createClient().from("waitlist_submissions").insert()`
4. PostHog event captured: `waitlist_joined` with email
5. Toast notification shown to user

**Waitlist Survey Update:**
1. User submits survey form on subsequent step
2. `useWaitlistUpdateMutation()` hook called from `hooks/use-waitlist-mutation.ts`
3. Data updated in Supabase via `.update().eq("email", data.email)`
4. PostHog event captured: `waitlist_survey_submitted` with survey details
5. Toast notification shown to user

**Error Handling:**
- Unique constraint violations on email caught and displayed to user
- PostHog captures errors: `waitlist_join_failed`, `waitlist_survey_failed`

## Webhooks & Callbacks

**Incoming:**
- Not detected

**Outgoing:**
- Not detected

---

*Integration audit: 2026-02-26*
