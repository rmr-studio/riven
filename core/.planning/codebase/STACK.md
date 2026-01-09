# Technology Stack

**Analysis Date:** 2026-01-09

## Languages

**Primary:**
- Kotlin 2.1.21 - Backend (all application code in `core/`)
- TypeScript 5.x - Frontend (all application code in `client/`)

**Secondary:**
- Java 21 (JVM target) - Kotlin compilation target (`core/build.gradle.kts`)
- JavaScript - Build scripts, Next.js configuration
- SQL (PostgreSQL dialect) - Database schema (`core/schema.sql`)

## Runtime

**Environment:**
- Java 21 (OpenJDK) - Backend runtime (`core/Dockerfile`: eclipse-temurin:21-jre)
- Node.js 20.x - Frontend runtime (`client/Dockerfile`, `client/package.json`)
- PostgreSQL 15+ - Database server

**Package Manager:**
- Gradle 8.7.0 - Backend build tool (`core/build.gradle.kts`)
- npm - Frontend package manager (`client/package-lock.json` present)

## Frameworks

**Core:**
- Spring Boot 3.5.3 - Backend web framework (`core/build.gradle.kts`)
- Next.js 15.3.4 - Frontend framework with App Router (`client/package.json`)
- React 19.0.0 - UI library (`client/package.json`)

**Testing:**
- JUnit 5 - Backend unit testing (`core/build.gradle.kts`)
- Mockito 5.20.0 - Backend mocking (`core/build.gradle.kts`)
- H2 Database - In-memory test database (`core/build.gradle.kts`)
- Jest 29.7.0 - Frontend test runner (`client/package.json`, `client/jest.config.ts`)
- Testing Library 16.1.0 - React component testing (`client/package.json`)

**Build/Dev:**
- Gradle 8.7.0 - Backend compilation and dependency management
- TypeScript Compiler 5.x - Frontend type checking (`client/tsconfig.json`)
- SpringDoc OpenAPI 2.8.6 - API documentation generation (`core/build.gradle.kts`)
- ESLint - Frontend code linting (`client/eslint.config.mjs`)

## Key Dependencies

**Critical (Backend):**
- Spring Data JPA - Database access layer (`core/build.gradle.kts`)
- Hibernate 6.3 - ORM implementation
- Temporal 1.32.1 - Workflow orchestration engine (`core/build.gradle.kts`)
- Supabase Kotlin Client 3.1.4 - Authentication and storage (`core/build.gradle.kts`)
- NetworkNT JSON Schema Validator 1.0.83 - Schema validation (`core/build.gradle.kts`)
- PostgreSQL JDBC Driver - Database connectivity
- Kotlin Logging 7.0.0 - Structured logging (`core/build.gradle.kts`)
- Ktor Client 3.0.0 - HTTP client for Supabase (`core/build.gradle.kts`)
- OpenPDF 1.3.30 - PDF generation (`core/build.gradle.kts`)

**Critical (Frontend):**
- Supabase 2.50.0 - Backend client (auth, storage, database) (`client/package.json`)
- TanStack Query 5.81.2 - Server state management (`client/package.json`)
- Zustand 5.0.8 - Client state management (`client/package.json`)
- React Hook Form 7.58.1 - Form state management (`client/package.json`)
- Zod 3.25.67 - Schema validation (`client/package.json`)
- Tailwind CSS 4.x - Styling framework (`client/package.json`)
- Radix UI - UI component primitives (shadcn/ui) (`client/package.json`)
- Framer Motion 12.23.24 - Animation library (`client/package.json`)
- XyFlow 12.10.0 - Node graph visualization (`client/package.json`)
- Gridstack 12.3.3 - Drag-and-drop grid layouts (`client/package.json`)
- OpenAPI TypeScript 7.8.0 - Type generation from backend API (`client/package.json`)

**Infrastructure:**
- Spring Security OAuth2 Resource Server - JWT authentication (`core/build.gradle.kts`)
- Jackson 2.x - JSON serialization (`core/build.gradle.kts`)
- Hypersistence Utils 3.9.2 - Hibernate enhancements (`core/build.gradle.kts`)

## Configuration

**Environment:**
- `.env` files - Local development (backend: `core/.env`, frontend: `client/.env`)
- `application.yml` - Spring Boot configuration (`core/src/main/resources/application.yml`)
- Environment variables referenced: `POSTGRES_DB_JDBC`, `JWT_AUTH_URL`, `JWT_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `SERVER_PORT`

**Build:**
- `build.gradle.kts` - Gradle build configuration
- `tsconfig.json` - TypeScript compiler options (strict mode enabled)
- `next.config.ts` - Next.js configuration
- `jest.config.ts` - Jest test configuration

## Platform Requirements

**Development:**
- macOS/Linux/Windows - Any platform with JDK 21 and Node.js 20
- Docker - Containerization for local development
- PostgreSQL 15+ - Database server

**Production:**
- Docker containers - Backend (`core/Dockerfile`) and frontend (`client/Dockerfile`)
- Java 21 runtime - Backend execution
- Node.js 20 runtime - Frontend server-side rendering
- PostgreSQL 15+ - Production database
- Supabase - Hosted database, authentication, and storage

---

*Stack analysis: 2026-01-09*
*Update after major dependency changes*
