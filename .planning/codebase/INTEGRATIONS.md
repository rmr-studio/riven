# External Integrations

**Analysis Date:** 2026-01-18

## APIs & External Services

**Supabase Platform:**
- Auth - User authentication and session management
  - SDK: `@supabase/supabase-js` (client), `io.github.jan-tennert.supabase:auth-kt` (backend)
  - Auth: `SUPABASE_URL`, `SUPABASE_KEY` env vars
  - JWT tokens issued by Supabase, validated by Spring Security

- Storage - File/asset storage
  - SDK: `io.github.jan-tennert.supabase:storage-kt`
  - Client: Ktor CIO async HTTP client
  - Configuration: `core/src/main/kotlin/riven/core/configuration/storage/SupabaseConfiguration.kt`

**Temporal.io:**
- Purpose: Workflow orchestration and durable execution
- SDK: `io.temporal:temporal-sdk:1.24.1`, `io.temporal:temporal-kotlin:1.32.1`
- Configuration: `core/src/main/kotlin/riven/core/configuration/workflow/TemporalEngineConfiguration.kt`
- Properties: `riven.workflow.engine.target`, `riven.workflow.engine.namespace`
- Usage: Workflow definitions, activities, and execution coordination

**Google Maps (Client Only):**
- Purpose: Location/address autocomplete and maps
- SDK: `@googlemaps/js-api-loader`, `@react-google-maps/api`, `use-places-autocomplete`
- Auth: API key (client-side)

## Data Storage

**Primary Database:**
- Type: PostgreSQL
- Connection: `POSTGRES_DB_JDBC` env var (JDBC connection string)
- Driver: `org.postgresql:postgresql`
- ORM: Spring Data JPA + Hibernate 6.3
- JSONB Support: `io.hypersistence:hypersistence-utils-hibernate-63:3.9.2`
- Configuration: `core/src/main/resources/application.yml`

**Database Features:**
- Row-Level Security (RLS) for multi-tenancy
- JSONB columns for flexible schemas (entity payloads, block payloads)
- Custom PostgreSQL functions and triggers
- UUID primary keys via `uuid-ossp` extension

**Test Database:**
- Type: H2 in-memory (PostgreSQL compatibility mode)
- Configuration: `core/src/test/resources/application-test.yml`
- DDL: Auto-created from JPA entities (`ddl-auto: create-drop`)

**File Storage:**
- Provider: Supabase Storage
- Client: `io.github.jan.supabase:storage-kt`
- Service: `core/src/main/kotlin/riven/core/service/storage/StorageService.kt`

**Caching:**
- None configured (relies on TanStack Query client-side caching)

## Authentication & Identity

**Auth Provider:** Supabase Auth

**Backend Authentication:**
- Implementation: Spring Security OAuth2 Resource Server
- JWT Decoder: `NimbusJwtDecoder` with HMAC-SHA256
- Configuration: `core/src/main/kotlin/riven/core/configuration/auth/SecurityConfig.kt`
- Token Converter: `core/src/main/kotlin/riven/core/configuration/auth/TokenDecoder.kt`

**JWT Claims:**
- `sub` - User ID (UUID)
- `email` - User email
- `roles` - Workspace roles array with `workspace_id` and `role`

**Authorization:**
- Role-based access control per workspace
- Authorities pattern: `ROLE_{workspace_id}_{ROLE}`
- Method security: `@EnableMethodSecurity(prePostEnabled = true)`

**Security Configuration Properties:**
- `riven.security.jwt-secret-key` - JWT signing secret (min 32 chars)
- `riven.security.jwt-issuer` - Expected JWT issuer (Supabase URL)
- `riven.security.allowed-origins` - CORS allowed origins

**Frontend Authentication:**
- SDK: `@supabase/supabase-js`, `@supabase/ssr`
- Session management via Supabase client

## API Documentation

**OpenAPI/Swagger:**
- Provider: SpringDoc OpenAPI
- Swagger UI: `/docs/swagger-ui.html`
- OpenAPI JSON: `/docs/v3/api-docs`
- Type Generation: `npm run types` generates TypeScript from OpenAPI

## Monitoring & Observability

**Actuator Endpoints:**
- Spring Boot Actuator enabled at `/actuator/**`
- Health, metrics, and info endpoints

**Logging:**
- Backend: SLF4J 2.0.16 + Kotlin Logging 7.0.0
- Configuration: `core/src/main/kotlin/riven/core/configuration/util/LoggerConfig.kt`
- Injected as bean for consistent logging across services

**Error Tracking:**
- None configured (TODO)

## Schema Validation

**JSON Schema Validator:**
- Library: NetworkNT `json-schema-validator:1.0.83`
- Spec Version: Draft 2019-09
- Usage: Entity and block payload validation
- Service: `core/src/main/kotlin/riven/core/service/schema/SchemaService.kt`

## PDF Generation

**Library:** OpenPDF 1.3.30
- Purpose: PDF document generation
- Package: `com.github.librepdf:openpdf`

## CI/CD & Deployment

**Containerization:**
- Backend Dockerfile: `core/Dockerfile` (multi-stage, Gradle build)
- Frontend Dockerfile: `client/Dockerfile` (multi-stage, npm build)
- Base images: Gradle 8.7.0-jdk21, eclipse-temurin:21-jre, node:20-alpine

**CI Pipeline:**
- Not detected (no GitHub Actions, GitLab CI, etc. in repo root)

**Hosting:**
- Not specified (containerized, platform-agnostic)

## Database Migrations

**Migration Tool:** Custom shell script
- Script: `db/run-migrations.sh`
- Schema location: `db/schema/` (numbered folders 00-09)

**Migration Order:**
1. `00_extensions` - PostgreSQL extensions
2. `01_tables` - Table definitions
3. `02_indexes` - Performance indexes
4. `03_functions` - Stored procedures
5. `04_constraints` - Foreign keys
6. `05_rls` - Row-level security policies
7. `06_types` - Custom PostgreSQL types
8. `07_views` - Database views
9. `08_triggers` - Triggers
10. `09_grants` - Permissions

## Environment Configuration

**Required Backend Env Vars:**
```bash
POSTGRES_DB_JDBC        # PostgreSQL JDBC connection string
JWT_AUTH_URL            # JWT issuer URI (Supabase URL)
JWT_SECRET_KEY          # JWT signing secret (32+ chars)
SUPABASE_URL            # Supabase project URL
SUPABASE_KEY            # Supabase anon/service key
ORIGIN_API_URL          # CORS allowed origin
SERVER_PORT             # Application port
```

**Required Database Env Vars (for migrations):**
```bash
POSTGRES_HOST           # Database host
POSTGRES_PORT           # Database port (default: 5432)
POSTGRES_DB             # Database name (default: riven)
POSTGRES_USER           # Database user
POSTGRES_PASSWORD       # Database password
```

**Secrets Location:**
- Environment variables (no secrets in repo)
- `.env` files git-ignored

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected (Temporal handles async workflow callbacks internally)

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Next.js)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Supabase SDK │  │ TanStack     │  │ Google Maps API      │  │
│  │ (Auth)       │  │ Query        │  │ (Places)             │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
│         │                  │                                     │
└─────────┼──────────────────┼─────────────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Core Backend (Spring Boot)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Spring       │  │ Supabase     │  │ Temporal             │  │
│  │ Security     │  │ Storage SDK  │  │ SDK                  │  │
│  │ (JWT)        │  │              │  │                      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                  │                     │              │
│  ┌──────┴───────┐          │                     │              │
│  │ JPA/Hibernate│          │                     │              │
│  │ (PostgreSQL) │          │                     │              │
│  └──────┬───────┘          │                     │              │
└─────────┼──────────────────┼─────────────────────┼──────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
    ┌──────────┐      ┌──────────┐         ┌──────────┐
    │PostgreSQL│      │ Supabase │         │ Temporal │
    │ (RLS)    │      │ Storage  │         │ Cluster  │
    └──────────┘      └──────────┘         └──────────┘
```

---

*Integration audit: 2026-01-18*
