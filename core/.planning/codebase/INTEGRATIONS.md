# External Integrations

**Analysis Date:** 2026-02-07

## APIs & External Services

**Supabase (BaaS):**
- Authentication & User Management
  - SDK: `io.github.jan-tennert.supabase:auth-kt` 3.1.4
  - Auth: `SUPABASE_URL`, `SUPABASE_KEY` environment variables
  - Usage: JWT token issuance and verification for OAuth2
  - Configuration: `configuration/storage/SupabaseConfiguration.kt`
  - Client Bean: `supabaseClient()` provides SupabaseClient for API calls

- File Storage
  - SDK: `io.github.jan-tennert.supabase:storage-kt` 3.1.4
  - Service: `service/storage/StorageService.kt`
  - Usage: File uploads/downloads via Supabase Storage buckets
  - Configuration: SupabaseClient configured with `defaultSerializer = JacksonSerializer(objectMapper)`

- HTTP Client for Supabase
  - SDK: Ktor Client CIO 3.0.0
  - Used by Supabase Kotlin SDK for all HTTP requests
  - Non-blocking HTTP transport layer

**Temporal Workflow Engine:**
- Distributed workflow orchestration
  - SDK: io.temporal:temporal-sdk 1.24.1
  - Spring Integration: io.temporal:temporal-spring-boot-starter 1.31.0
  - Kotlin Support: io.temporal:temporal-kotlin 1.32.1
  - Configuration: `configuration/workflow/TemporalEngineConfiguration.kt`
  - Target: `${TEMPORAL_SERVER_ADDRESS}` environment variable (default: localhost:7233)
  - Usage: Async task execution, workflow state management, retry policies
  - Worker Configuration: `configuration/workflow/TemporalWorkerConfiguration.kt`
    - Auto-discovery of workflow/activity implementations in package `riven.core.service.workflow`
    - HTTP request actions: `models/workflow/node/config/actions/WorkflowHttpRequestActionConfig.kt`
    - Uses Spring WebClient for outbound HTTP from workflows
  - Retry Policies: Configurable via `application.yml`:
    - Default: 3 max attempts, 1s initial interval, 2.0 backoff, 30s max interval
    - HTTP Actions: 3 attempts, 2s initial, non-retryable status codes [400, 401, 403, 404, 422]
    - CRUD Actions: 2 attempts, 1s initial, 10s max interval
  - Conditional: Enabled via `@ConditionalOnProperty(name = ["riven.workflow.engine.enabled"], havingValue = "true")`

## Data Storage

**Databases:**

**PostgreSQL (Primary):**
- Type: Relational OLTP database
- Connection: `${POSTGRES_DB_JDBC}` environment variable (JDBC URL format)
- Client: Spring Data JPA + Hibernate 6.3
- Configuration: `spring.datasource.url`, `spring.jpa.database-platform: org.hibernate.dialect.PostgreSQLDialect`
- DDL Management: Hibernate `ddl-auto: none` (schema is pre-created via `schema.sql`)
- RLS: Row-Level Security enabled via PostgreSQL policies
  - Policy: `"Users can view their own workspaces"` on workspaces table
  - Enforces multi-tenancy at database level
- Schema: Defined in `schema.sql` (568 lines)
  - Tables: workspaces, workspace_members, workspace_invites, users, entity_types, entities, entity_relationships, blocks, block_types, block_children, block_tree_layouts
  - Triggers: Member count auto-update, user creation on auth event
  - Indexes: Multi-column indexes for performance
- Denormalized Fields: entity_types.count (updated via database triggers)

**H2 (Test Database):**
- Type: In-memory relational database
- Usage: Unit tests via `application-test.yml`
- Configuration: `jdbc:h2:mem:testdb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH`
- Dialect: org.hibernate.dialect.H2Dialect
- DDL: Hibernate `ddl-auto: create-drop` (auto-create/drop per test)
- Purpose: Fast isolated test execution without external dependencies

**TestContainers PostgreSQL (Integration Tests):**
- Type: Docker-based PostgreSQL for integration tests
- Configuration: `application-integration.yml` via `@DynamicPropertySource`
- Usage: Full PostgreSQL compatibility testing with real RLS policies
- Dependency: `org.testcontainers:testcontainers-postgresql:2.0.3`

**File Storage:**
- Supabase Storage (cloud-hosted object storage)
  - Service: `service/storage/StorageService.kt`
  - SDK: Supabase Storage Kotlin library via SupabaseClient
  - Configuration: `SUPABASE_URL`, `SUPABASE_KEY`

**Caching:**
- Not detected - No explicit caching library (Redis, Memcached)
- Potential: Spring Data caching annotations available but not implemented

## Authentication & Identity

**Auth Provider:**
- Supabase Authentication (OAuth2 + JWT)

**Implementation:**
- OAuth2 Resource Server with JWT bearer tokens
- Configuration: `configuration/auth/SecurityConfig.kt`
  - Filter Chain: Stateless session creation policy
  - Allowed Endpoints: `/api/auth/**`, `/actuator/**`, `/docs/**`, `/public/**`
  - Protected: All other endpoints require authentication
  - JWT Processing: `CustomAuthenticationTokenConverter` (TokenDecoder in config)

**JWT Configuration:**
- Issuer URI: `${JWT_AUTH_URL}` (Supabase auth endpoint)
- Secret Key: `${JWT_SECRET_KEY}` (minimum 32 characters, validated at startup)
- Issuer: `${SUPABASE_URL}` (used in token validation)
- JWT Claims Extraction: `service/auth/AuthTokenService.kt`
  - `getUserId()` - Extracts "sub" claim (user UUID)
  - `getUserEmail()` - Extracts "email" claim
  - `getCurrentUserAuthorities()` - Returns user roles/authorities
  - `getAllClaims()` - Returns all token claims

**CORS:**
- Allowed Origins: `${ORIGIN_API_URL}` (frontend domain)
- Allowed Methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed Headers: Authorization, Content-Type, Accept, Origin
- Exposed Headers: Authorization, Content-Type
- Credentials: Enabled
- Configuration: `corsConfig()` bean in SecurityConfig

**Audit & Multi-Tenancy:**
- Auditor Awareness: `configuration/auth/SecurityAuditorAware.kt`
  - Automatically sets createdBy/updatedBy fields from JWT "sub" claim
- Organization Security: `configuration/auth/OrganisationSecurity.kt`
  - Validates user access to workspace resources
- Activity Logging: `service/activity/ActivityService.kt`
  - Logs CRUD operations with user context for audit trail

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, DataDog, or similar integration

**Logs:**
- SLF4J + Kotlin Logging (kotlin-logging-jvm)
- Appenders: Console output (via Spring Boot defaults)
- Configuration in `application.yml`:
  - Log levels: INFO for `riven.core`, WARN for Spring/Hibernate
  - Integration tests: INFO for TestContainers, OFF for Temporal
  - Stack traces controlled by `riven.include-stack-trace` property

**Metrics:**
- Spring Boot Actuator endpoints at `/actuator/**`
- Health endpoint available
- Metrics exposed but not detailed in configuration

## CI/CD & Deployment

**Hosting:**
- Not specified in codebase analysis
- Likely: Cloud deployment (AWS, GCP, Azure, or on-premises)
- Java artifact: Executable Spring Boot JAR (generated by `./gradlew build`)

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, Jenkins, or CircleCI configs found
- Gradle build configured for `./gradlew clean build` and `./gradlew test`

**Database Migrations:**
- Manual: schema.sql contains DDL (not using Flyway/Liquibase)
- Migration Strategy: Pre-deploy schema.sql before running application
- Hibernate: `ddl-auto: none` (respects pre-created schema)

## Environment Configuration

**Required Environment Variables:**

**Database:**
- `POSTGRES_DB_JDBC` - PostgreSQL JDBC connection URL (e.g., `jdbc:postgresql://localhost:5432/riven_core`)

**Authentication:**
- `JWT_AUTH_URL` - OAuth2 token issuer URI (Supabase auth endpoint)
- `JWT_SECRET_KEY` - JWT signing key (minimum 32 characters for HmacSHA256)
- `SUPABASE_URL` - Supabase project base URL

**APIs & Services:**
- `SUPABASE_KEY` - Supabase public anon key (for storage + auth)
- `ORIGIN_API_URL` - Frontend origin for CORS (e.g., `http://localhost:3000`)
- `TEMPORAL_SERVER_ADDRESS` - Temporal server gRPC address (optional, default: `localhost:7233`)
- `SERVER_PORT` - HTTP server port (optional, can be overridden)

**Optional:**
- `RIVEN_INCLUDE_STACK_TRACE` - Include stack traces in error responses (true/false)

**Secrets Location:**
- Environment variables (recommended for production)
- `.env` file for development (not committed, contains secrets)
- Spring Cloud Config possible but not configured
- Supabase secrets stored in environment

**Configuration Files:**
- `application.yml` - Main Spring Boot configuration (all env vars with `${}` placeholders)
- `application-test.yml` - Test profile (H2 in-memory, mock auth)
- `application-integration.yml` - Integration test profile (TestContainers PostgreSQL)

## Webhooks & Callbacks

**Incoming:**
- Not detected - No webhook listeners configured for external events

**Outgoing:**
- Workflow HTTP Actions: `models/workflow/node/config/actions/WorkflowHttpRequestActionConfig.kt`
  - Workflows can trigger HTTP requests to external endpoints
  - Uses Spring WebClient for async non-blocking calls
  - Error handling: WebClientResponseException caught and classified

**Supabase Hooks (Database):**
- User Creation Hook: PostgreSQL trigger `on_auth_user_created`
  - Fires when new user registered in Supabase auth
  - Creates corresponding user record in `public.users` table
  - Syncs user metadata (name, email, phone, avatar)

---

*Integration audit: 2026-02-07*
