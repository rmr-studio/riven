# External Integrations

**Analysis Date:** 2026-01-09

## APIs & External Services

**Workflow Orchestration:**
- Temporal/Temporal Cloud - Workflow automation and execution
  - SDK/Client: temporal-kotlin 1.32.1, temporal-sdk 1.24.1 (`core/build.gradle.kts`)
  - Configuration: `core/src/main/kotlin/riven/core/configuration/workflow/TemporalEngineConfiguration.kt`
  - Properties: `core/src/main/kotlin/riven/core/configuration/workflow/TemporalEngineConfigurationProperties.kt` (configurable target endpoint and namespace)

**Maps & Geolocation:**
- Google Maps API - Geospatial visualization and autocomplete
  - SDK/Client: @googlemaps/js-api-loader 1.16.10 (`client/package.json`)
  - Integration: @react-google-maps/api 2.20.7, use-places-autocomplete 4.0.1
  - Auth: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable (`client/.env`)

**External APIs:**
- OpenAPI TypeScript 7.8.0 - Type generation from backend OpenAPI spec
  - Source: `http://localhost:8081/docs/v3/api-docs` (backend OpenAPI endpoint)
  - Generated types: `client/lib/types/types.ts`

## Data Storage

**Databases:**
- PostgreSQL (Supabase-hosted) - Primary data store
  - Connection: via `POSTGRES_DB_JDBC` environment variable
  - URL: `lciexzhaszvoeghroifv.supabase.co:5432` (from `client/.env`)
  - Client: Spring Data JPA + Hibernate 6.3
  - Migrations: Manual SQL schema (`core/schema.sql` - 568 lines)
  - Row-Level Security (RLS): Multi-tenant enforcement at database level

**File Storage:**
- Supabase Storage - File uploads and storage
  - SDK/Client: Supabase Kotlin Client 3.1.4 storage-kt (`core/build.gradle.kts`)
  - Service: `core/src/main/kotlin/riven/core/service/storage/StorageService.kt`
  - Configuration: `core/src/main/kotlin/riven/core/configuration/storage/SupabaseConfiguration.kt`
  - Auth: `SUPABASE_KEY` environment variable

**Caching:**
- None currently - All database queries, no Redis or in-memory cache layer

## Authentication & Identity

**Auth Provider:**
- Supabase Authentication - JWT-based authentication
  - Implementation (Backend): Spring Security OAuth2 Resource Server
  - Implementation (Frontend): Supabase client SDK with SSR support
  - Token storage (Backend): JWT claims extracted via `core/src/main/kotlin/riven/core/service/auth/AuthTokenService.kt`
  - Token storage (Frontend): httpOnly cookies via @supabase/ssr
  - Session management: JWT refresh tokens handled by Supabase

**OAuth Integrations:**
- OAuth2 Resource Server (Backend) - JWT validation
  - Configuration: `core/src/main/kotlin/riven/core/configuration/auth/SecurityConfig.kt`
  - Token decoder: `core/src/main/kotlin/riven/core/configuration/auth/TokenDecoder.kt`
  - JWT Auth URL: `JWT_AUTH_URL` environment variable
  - JWT Secret: `JWT_SECRET_KEY` environment variable

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, Datadog, or similar integration found

**Analytics:**
- None detected - No Mixpanel, Google Analytics, or similar integration found

**Logs:**
- Kotlin Logging 7.0.0 - Structured logging (`core/build.gradle.kts`)
- SLF4J 2.0.16 - Logging facade
- No external log aggregation service detected

## CI/CD & Deployment

**Hosting:**
- Docker containers - Backend and frontend
  - Backend: `core/Dockerfile` (eclipse-temurin:21-jre)
  - Frontend: `client/Dockerfile` (node:20-alpine multi-stage)
  - Deployment: Not detected (no Vercel, AWS, or other platform config found)

**CI Pipeline:**
- Not detected - No `.github/workflows`, `.gitlab-ci.yml`, or similar CI configuration files found

## Environment Configuration

**Development:**
- Required env vars (Backend): `POSTGRES_DB_JDBC`, `JWT_AUTH_URL`, `JWT_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `ORIGIN_API_URL`, `SERVER_PORT`
- Required env vars (Frontend): `NODE_ENV`, `PORT`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_HOSTED_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Secrets location: `.env` files (gitignored)
- Mock/stub services: None detected

**Staging:**
- Not detected - No staging-specific configuration found

**Production:**
- Secrets management: Environment variables (platform-dependent)
- Database: Supabase production project
- Failover/redundancy: Not detected

## Webhooks & Callbacks

**Incoming:**
- None detected - No webhook handlers found in REST controllers

**Outgoing:**
- None detected - No webhook configuration found

---

*Integration audit: 2026-01-09*
*Update when adding/removing external services*
