# Technology Stack

**Analysis Date:** 2026-01-18

## Languages

**Primary:**
- Kotlin 2.1.21 - Backend API (`core/src/main/kotlin/`)
- TypeScript 5 - Frontend applications (`client/`, `landing/`)

**Secondary:**
- SQL (PostgreSQL) - Database schema and migrations (`db/schema/`)

## Runtime

**Backend:**
- JVM Target: Java 21
- Docker Base: `eclipse-temurin:21-jre`

**Frontend:**
- Node.js 20 (Alpine Docker image)
- Package Manager: npm (lockfile present)

**Build Tools:**
- Gradle 8.14.2 - Backend builds (`core/build.gradle.kts`)
- Next.js - Frontend builds (Webpack/Turbopack via Next.js)

## Frameworks

**Backend Core:**
- Spring Boot 3.5.3 - Application framework
- Spring Data JPA - ORM layer
- Spring Security + OAuth2 Resource Server - Authentication/authorization
- Spring Boot Starter WebFlux - Reactive web client support
- Spring Boot Starter Validation - Request validation

**Backend Workflow:**
- Temporal SDK 1.24.1 + Temporal Kotlin 1.32.1 - Workflow orchestration engine

**Frontend Core:**
- Next.js 15.3.4 (App Router) - React framework (`client/`)
- Next.js 16.1.1 - Landing page (`landing/`)
- React 19 - UI library

**Frontend State:**
- TanStack Query 5.81.2 - Server state management
- Zustand 5.0.8 - Client state management
- React Hook Form 7.58.1 - Form state management

**UI Components:**
- Radix UI Primitives - Headless accessible components
- Tailwind CSS 4 - Utility-first CSS framework
- shadcn/ui pattern - Component library approach

**Testing:**
- JUnit 5 + Mockito 5.20.0 - Backend testing
- H2 Database - In-memory test database
- Temporal Testing 1.24.1 - Workflow testing
- Jest 29.7.0 + Testing Library - Frontend testing

**Build/Dev:**
- Gradle 8.14.2 - Backend build automation
- ESLint - JavaScript/TypeScript linting
- OpenAPI TypeScript 7.8.0 - Type generation from OpenAPI spec

## Key Dependencies

**Backend Critical:**
- `org.springframework.boot:spring-boot-starter-data-jpa` - JPA/Hibernate ORM
- `org.postgresql:postgresql` - PostgreSQL JDBC driver
- `io.hypersistence:hypersistence-utils-hibernate-63:3.9.2` - Advanced Hibernate types (JSONB)
- `io.temporal:temporal-kotlin:1.32.1` - Workflow orchestration
- `io.github.jan-tennert.supabase:bom:3.1.4` - Supabase SDK (auth, storage)
- `com.networknt:json-schema-validator:1.0.83` - JSON Schema validation (Draft 2019-09)

**Backend Security:**
- `org.springframework.boot:spring-boot-starter-oauth2-resource-server:3.5.0` - JWT resource server
- `org.springframework.security:spring-security-oauth2-jose:6.5.0` - JWT processing
- `com.nimbusds:nimbus-jose-jwt:9.37.2` - JWT library (test dependency)

**Backend Utilities:**
- `com.fasterxml.jackson.module:jackson-module-kotlin` - Kotlin JSON serialization
- `org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.6` - OpenAPI documentation
- `com.github.librepdf:openpdf:1.3.30` - PDF generation
- `io.github.oshai:kotlin-logging-jvm:7.0.0` - Kotlin logging wrapper
- `io.ktor:ktor-client-cio:3.0.0` - Async HTTP client (Supabase)

**Frontend Critical:**
- `@supabase/supabase-js:2.50.0` - Supabase client SDK
- `@supabase/ssr:0.6.1` - Supabase SSR integration
- `@tanstack/react-query:5.81.2` - Data fetching/caching
- `@tanstack/react-table:8.21.3` - Table component
- `zod:3.25.67` - Schema validation
- `gridstack:12.3.3` - Drag-and-drop grid layouts
- `@xyflow/react:12.10.0` - Node-based workflow UI

**Frontend UI:**
- `@radix-ui/*` - 20+ Radix UI primitive packages
- `lucide-react:0.522.0` - Icon library
- `framer-motion:12.23.24` - Animation library
- `cmdk:1.1.1` - Command palette
- `sonner:2.0.7` - Toast notifications
- `react-hook-form:7.58.1` - Form management
- `@hookform/resolvers:5.1.1` - Zod resolver for forms

## Configuration

**Backend Environment Variables:**
- `POSTGRES_DB_JDBC` - PostgreSQL connection string
- `JWT_AUTH_URL` - JWT issuer URI
- `JWT_SECRET_KEY` - JWT signing key (min 32 chars)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon/service key
- `ORIGIN_API_URL` - CORS allowed origin
- `SERVER_PORT` - Application port

**Backend Config Files:**
- `core/src/main/resources/application.yml` - Spring Boot configuration
- `core/src/test/resources/application-test.yml` - Test configuration
- `core/build.gradle.kts` - Build configuration

**Frontend Environment Variables:**
- Located in `client/.env` (git-ignored)
- Supabase credentials for client-side auth

**Frontend Config Files:**
- `client/tsconfig.json` - TypeScript configuration (strict mode, path aliases)
- `client/next.config.ts` - Next.js configuration
- `client/jest.config.ts` - Jest test configuration
- `client/eslint.config.mjs` - ESLint configuration
- `client/postcss.config.mjs` - PostCSS/Tailwind configuration

## Platform Requirements

**Development:**
- Java 21 JDK
- Node.js 20
- PostgreSQL database (or Supabase project)
- Temporal server (for workflow development)

**Docker Images:**
- Backend: `eclipse-temurin:21-jre` (build: `gradle:8.7.0-jdk21`)
- Frontend: `node:20-alpine`

**Production:**
- Containerized deployment (Docker)
- PostgreSQL with Row-Level Security
- Supabase (auth + storage)
- Temporal.io cluster (workflow execution)

## Project Structure

```
riven/
├── core/           # Spring Boot backend (Kotlin)
│   ├── src/main/kotlin/riven/core/
│   ├── build.gradle.kts
│   └── Dockerfile
├── client/         # Next.js main application
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── Dockerfile
├── landing/        # Next.js landing page
│   ├── app/
│   └── package.json
└── db/             # Database migrations
    ├── schema/     # Numbered migration folders
    └── run-migrations.sh
```

---

*Stack analysis: 2026-01-18*
