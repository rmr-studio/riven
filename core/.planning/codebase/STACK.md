# Technology Stack

**Analysis Date:** 2026-02-07

## Languages

**Primary:**
- Kotlin 2.1.21 - Backend business logic, services, controllers, domain models
- SQL - PostgreSQL schema and Row-Level Security policies in `schema.sql`

**Secondary:**
- Java 21 - JVM runtime language (implicit with Kotlin)

## Runtime

**Environment:**
- Java 21 (JVM)
- Spring Boot 3.5.3

**Package Manager:**
- Gradle 8.7.0
- Lockfile: `gradle-wrapper.jar` (Gradle Wrapper present for reproducible builds)

## Frameworks

**Core Web:**
- Spring Boot 3.5.3 - Primary framework
  - spring-boot-starter-web - REST API and servlet container
  - spring-boot-starter-webflux - Reactive HTTP support for non-blocking calls
  - spring-boot-starter-actuator - Health checks and metrics

**Data & ORM:**
- Spring Data JPA - Repository pattern with query generation
- Hibernate 6.3 - JPA implementation via Spring Data
- Hypersistence Utils 3.9.2 - Advanced Hibernate utilities (JSON type handling)
- PostgreSQL Driver (runtime) - Database connectivity

**Security:**
- Spring Security 6.5.0 - Authentication and authorization
- OAuth2 Resource Server (JWT) - Token-based authentication via Supabase
- spring-security-oauth2-jose 6.5.0 - JWT parsing and validation

**Validation:**
- Spring Boot Starter Validation - Bean validation and constraint checking
- NetworkNT JSON Schema Validator 1.0.83 (Draft 2019-09) - Custom schema validation for entity/block payloads in `service/schema/SchemaService.kt`

**Async & Workflows:**
- Temporal SDK 1.24.1 - Workflow orchestration engine
- Temporal Kotlin 1.32.1 - Kotlin bindings for Temporal
- Temporal Spring Boot Starter 1.31.0 - Spring integration
- kotlinx-coroutines-reactor - Kotlin coroutines for reactive flows

**Scheduled Tasks:**
- ShedLock 7.5.0 - Distributed task locking for multi-instance deployments
  - shedlock-provider-jdbc-template - JDBC-based lock provider

**API Documentation:**
- SpringDoc OpenAPI 2.8.6 - Automatic OpenAPI 3.0 schema generation
  - Accessible at `/docs/swagger-ui.html` (Swagger UI)
  - JSON schema at `/docs/v3/api-docs`

**PDF Generation:**
- OpenPDF 1.3.30 - PDF document generation

**Logging:**
- SLF4J 2.0.16 - Logging facade
- Kotlin Logging 7.0.0 (kotlin-logging-jvm) - Kotlin-friendly logging wrapper

**JSON/Serialization:**
- Jackson (Jackson Module for Kotlin) - JSON serialization/deserialization
- Ktor Client CIO 3.0.0 - HTTP client for Supabase communication

## Key Dependencies

**Critical:**
- PostgreSQL Driver (org.postgresql:postgresql) - Production database connectivity
- Spring Data JPA - Provides repository interfaces for database access
- Temporal SDK - Workflow execution engine (async job processing)

**Infrastructure:**
- Supabase Auth/Storage Libraries 3.1.4 - Cloud storage and authentication
  - io.github.jan-tennert.supabase:auth-kt
  - io.github.jan-tennert.supabase:storage-kt
  - io.github.jan-tennert.supabase:serializer-jackson
- Ktor Client CIO 3.0.0 - HTTP client (used by Supabase SDK)
- Hypersistence Utils 3.9.2 - Hibernate JSON type mapping

**JSON Schema Validation:**
- com.networknt:json-schema-validator 1.0.83 - Schema validation engine used in `SchemaService.kt`

## Configuration

**Environment:**
Environment variables configured in `application.yml` with `${}` placeholders:

- `POSTGRES_DB_JDBC` - PostgreSQL connection string (required)
- `JWT_AUTH_URL` - OAuth2 token issuer URI (required, Supabase auth endpoint)
- `JWT_SECRET_KEY` - JWT signing key (minimum 32 characters, required)
- `SUPABASE_URL` - Supabase project URL (required)
- `SUPABASE_KEY` - Supabase public anon key (required)
- `ORIGIN_API_URL` - Frontend origin for CORS allowlist (required)
- `SERVER_PORT` - HTTP server port (optional, defaults to 8081 in docs)
- `TEMPORAL_SERVER_ADDRESS` - Temporal server gRPC address (optional, default: localhost:7233)
- `RIVEN_INCLUDE_STACK_TRACE` - Include stack traces in error responses (optional)

Configuration properties loaded via:
- `@ConfigurationProperties(prefix = "riven")` in `ApplicationConfigurationProperties.kt`
- `@ConfigurationProperties(prefix = "riven.security")` in `SecurityConfigurationProperties.kt`
- Spring Boot's `application.yml` with environment variable interpolation

**Build:**
- `build.gradle.kts` - Gradle build configuration with plugins:
  - kotlin("jvm") - Kotlin JVM compilation
  - kotlin("plugin.spring") - Spring plugin for all-open on @Entity, @MappedSuperclass, @Embeddable
  - kotlin("plugin.jpa") - JPA plugin for no-arg constructor generation
  - org.springframework.boot - Spring Boot plugin
  - io.spring.dependency-management - Dependency management

## Platform Requirements

**Development:**
- Java 21 JDK
- Gradle 8.7.0 (or use included Gradle Wrapper)
- PostgreSQL 12+ (for running locally)
- Temporal Server (for workflow testing, optional for unit tests)
- Supabase account or local Supabase setup

**Production:**
- Java 21 JVM runtime
- PostgreSQL database with Row-Level Security support
- Temporal gRPC server (workflow engine)
- Supabase project (auth + storage)

## Test Configuration

**Unit/Integration Testing:**
- JUnit 5 - Test runner
- Mockito 5.20.0 - Mocking framework
- mockito-kotlin 3.2.0 - Kotlin extensions for Mockito
- Spring Boot Test - Spring context testing utilities
- H2 in-memory database (org.h2database:h2) - Unit test database
- TestContainers 2.0.3 - Container-based testing
  - testcontainers-postgresql - PostgreSQL container for integration tests
  - testcontainers-junit-jupiter - JUnit 5 integration

**Test Profiles:**
- `application-test.yml` - Unit test config with H2 in-memory database
- `application-integration.yml` - Integration test config with TestContainers PostgreSQL
- Temporal Testing - io.temporal:temporal-testing for workflow unit tests
- kotlinx-coroutines-test - Coroutines test utilities

---

*Stack analysis: 2026-02-07*
