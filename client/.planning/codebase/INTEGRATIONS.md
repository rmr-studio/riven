# External Integrations

**Analysis Date:** 2026-01-19

## APIs & External Services

**Backend API:**

- Custom REST API - Primary data and business logic backend
  - SDK/Client: Native `fetch` in service layer
  - Auth: `Authorization: Bearer ${session.access_token}` header
  - Base URL: `NEXT_PUBLIC_API_URL` environment variable
  - OpenAPI spec: Available at `http://localhost:8081/docs/v3/api-docs` for type generation
  - Endpoints: `/v1/entity/*`, `/v1/block/*`, `/v1/workspace/*`, `/v1/user/*`

**Maps:**

- Google Maps API - Location features and autocomplete
  - SDK/Client: `@googlemaps/js-api-loader` 1.16.10, `@react-google-maps/api` 2.20.7
  - Auth: API key (configuration not detected in codebase)
  - Usage: Places autocomplete (`use-places-autocomplete` 4.0.1)

## Data Storage

**Databases:**

- Backend API database (type not specified in client)
  - Connection: Managed by backend API at `NEXT_PUBLIC_API_URL`
  - Client: Fetch API with bearer token authentication
  - Data types: Entity types, blocks, workspaces, users

**File Storage:**

- Supabase Storage - File uploads and public assets
  - Buckets: `profile-picture`, `organisation-profile`
  - Connection: `NEXT_PUBLIC_SUPABASE_STORAGE_URL`
  - Client: `@supabase/supabase-js` Storage API
  - Implementation: `lib/util/storage/storage.util.ts` with `handlePublicFileUpload` helper

**Caching:**

- TanStack Query - Client-side query caching
  - In-memory cache with stale-while-revalidate strategy
  - Query keys: `["entityType", workspaceId, key]`, `["blockType", typeId]`, etc.

## Authentication & Identity

**Auth Provider:**

- Supabase Auth - Complete authentication solution
  - Implementation: `@supabase/supabase-js` 2.50.0, `@supabase/ssr` 0.6.1
  - Methods:
    - Email/password authentication
    - OAuth social providers (Google, etc.)
    - OTP verification for email signup
    - Session management with auto-refresh
  - Token handling: JWT tokens in HTTP-only cookies via `@supabase/ssr`
  - Session storage: Cookie-based with SSR support
  - Client creation: `lib/util/supabase/client.ts` (browser and server clients)
  - Helper functions: `components/feature-modules/authentication/util/auth.util.ts`

## Monitoring & Observability

**Error Tracking:**

- None (errors logged to console in development only)

**Logs:**

- Console logging in development mode (`process.env.NODE_ENV === "development"`)
- Production logging not configured

## CI/CD & Deployment

**Hosting:**

- Docker container (Dockerfile present using node:20-alpine)
  - Multi-stage build (deps → builder → runner)
  - Production port: 3000
  - Deployment target not specified in codebase

**CI Pipeline:**

- None detected in client directory

## Environment Configuration

**Required env vars:**

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `NEXT_PUBLIC_API_URL` - Backend REST API base URL
- `NEXT_PUBLIC_HOSTED_URL` - Frontend application URL (for OAuth redirects)
- `NEXT_PUBLIC_SUPABASE_STORAGE_URL` - Supabase storage public URL
- `NODE_ENV` - Environment mode (development/production)

**Secrets location:**

- Environment variables (not checked into source control)
- No `.env` files detected in repository

## Webhooks & Callbacks

**Incoming:**

- OAuth callback - `app/api/auth/token/callback/route.ts`
  - Handles OAuth code exchange from Supabase Auth
  - Validates and exchanges authorization code for session
  - Redirects to app or error page based on result
  - Route: `/api/auth/token/callback?code={code}&next={redirect_path}`

**Outgoing:**

- OAuth redirect URL: `${NEXT_PUBLIC_HOSTED_URL}api/auth/token/callback`
  - Registered with Supabase for social provider authentication
  - Includes `access_type=offline` and `prompt=consent` query params

---

_Integration audit: 2026-01-19_
