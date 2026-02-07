# Coding Conventions

**Analysis Date:** 2026-02-07

## Naming Patterns

**Files:**
- PascalCase for all Kotlin files: `EntityTypeService.kt`, `BlockEnvironmentController.kt`
- Test files suffixed with `Test`: `EntityTypeServiceTest.kt`, `SchemaServiceTest.kt`
- Organized by feature/layer: `entity/type/`, `service/block/`, `controller/entity/`

**Functions:**
- camelCase for all functions: `publishEntityType()`, `saveRelationships()`, `validateEntity()`
- Verb-prefixed for actions: `get*()`, `save*()`, `create*()`, `update*()`, `delete*()`, `validate*()`, `hydrate*()`
- Prefix-based for helpers: `is*()`, `has*()`, `resolve*()`, `extract*()`, `calculate*()`
- Test functions use backtick notation with descriptive names: `fun \`saveRelationships - creates single relationship to one target entity\`()`

**Variables:**
- camelCase for all variables: `entityId`, `workspaceId`, `relationships`, `contactId`
- UUID variables typically suffixed with `Id`: `entityId`, `typeId`, `sourceId`, `targetId`
- Collection variables use plural form: `entities`, `contacts`, `projects`, `savedRelationships`
- Immutable collections preferred: `val` instead of `var`

**Types:**
- PascalCase for all classes and data classes: `EntityType`, `EntityRelationshipDefinition`, `BlockEnvironment`
- Sealed interfaces for polymorphism: `sealed interface Metadata`, `sealed interface Node`
- Type aliases for clarity: `typealias EntityTypeSchema = Schema<UUID>`, `typealias BlockTypeSchema = Schema<String>`
- Enums in PascalCase: `EntityRelationshipCardinality`, `ValidationScope`, `DataType`

## Code Style

**Formatting:**
- **Indentation:** 4 spaces (JetBrains Kotlin standard)
- **Trailing commas:** Used in multi-line declarations for consistency
- **Line length:** No strict enforced limit, but keep logical lines readable (generally ~120 chars)
- **Brace style:** K&R style (opening brace on same line)
- **Expression-bodied functions:** Preferred for simple single-expression functions (using `=`)

Example:
```kotlin
// Single expression - expression-bodied
fun getById(id: UUID): EntityType = entityTypeRepository.findById(id)

// Multiple statements - block-bodied
fun publishEntityType(request: CreateEntityTypeRequest): EntityType {
    val id = UUID.randomUUID()
    // ... more logic
    return entityType
}
```

**Linting:**
- No explicit `.editorconfig`, `.eslintrc`, or `.ktlint` configuration in codebase
- Kotlin compiler strict mode enabled: `-Xjsr305=strict` in `build.gradle.kts`
- Relies on IntelliJ IDEA default Kotlin inspections

## Import Organization

**Order:**
1. `import jakarta.*` (JakartaEE annotations and APIs)
2. `import org.springframework.*` (Spring Framework imports)
3. `import io.github.*`, `io.temporal.*` (Third-party libraries)
4. `import riven.core.*` (Project-internal imports)
5. `import java.*` (Java standard library)

**Path Aliases:**
- No custom path aliases used in codebase
- Full package paths always specified

Example from `EntityTypeService.kt`:
```kotlin
import jakarta.transaction.Transactional
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import riven.core.entity.entity.EntityTypeEntity
import riven.core.service.activity.ActivityService
import java.util.*
```

## Error Handling

**Patterns:**
- **Custom exceptions thrown by service layer:** `NotFoundException`, `ConflictException`, `SchemaValidationException`, `InvalidRelationshipException`, `UniqueConstraintViolationException`
- **Global exception handler:** `ExceptionHandler.kt` maps exceptions to HTTP responses with `ErrorResponse` model
- **Validation exceptions:** `SchemaValidationException` includes list of validation failure reasons
- **Authority exceptions:** Uses Spring Security's `AccessDeniedException` and `AuthorizationDeniedException`

Example from `ExceptionHandler.kt`:
```kotlin
@ExceptionHandler(SchemaValidationException::class)
fun handleSchemaValidationException(ex: SchemaValidationException): ResponseEntity<ErrorResponse> {
    return ErrorResponse(
        statusCode = HttpStatus.BAD_REQUEST,
        error = "SCHEMA VALIDATION FAILED",
        message = "Schema validation failed: ${ex.reasons.joinToString("; ")}",
        stackTrace = config.includeStackTrace.takeIf { it }?.let { ex.stackTraceToString() }
    ).also { logger.error { it } }.let {
        ResponseEntity(it, it.statusCode)
    }
}
```

**Error Response Status Codes:**
- `400 BAD_REQUEST` → `IllegalArgumentException`, `SchemaValidationException`, `InvalidRelationshipException`
- `403 FORBIDDEN` → `AccessDeniedException`
- `404 NOT_FOUND` → `NotFoundException`
- `409 CONFLICT` → `ConflictException`, `UniqueConstraintViolationException`

## Logging

**Framework:** Kotlin Logging (7.0.0) with SLF4J 2.0.16 backend

**Patterns:**
- Lazy logger delegate: `private val logger: KLogger` (injected via Mockito in tests)
- Log using lambda syntax: `logger.error { "Message with ${variable}" }`
- Debug-level for verbose operations, error-level for failures
- Activity service used for audit trails (not application logs)

Example:
```kotlin
logger.error { "Failed to validate entity: ${ex.message}" }
activityService.logActivity(
    operation = OperationType.CREATE,
    details = mapOf("relationshipId" to id, "name" to name)
)
```

## Comments

**When to Comment:**
- **Class-level:** All service classes include JSDoc describing purpose and key differences
- **Business logic:** Complex algorithms like bidirectional relationship sync are documented with step-by-step comments
- **State mutations:** Explain why a mutable operation is necessary (mutable vs immutable pattern)
- **Non-obvious behavior:** Explain cardinality inversions, polymorphic targeting, cascade rules

Example from `EntityTypeService.kt`:
```kotlin
/**
 * Service for managing entity types.
 *
 * Key difference from BlockTypeService: EntityTypes are MUTABLE.
 * Updates modify the existing row rather than creating new versions.
 */
```

**JSDoc/KDoc:**
- Used for public service methods with parameter and return documentation
- Includes `@param` and `@return` tags where helpful
- Includes usage examples for complex methods

## Function Design

**Size:** Service methods typically 50-400 lines, with larger methods (250+ lines) focused on single orchestration task
  - `EntityRelationshipService.kt` is 1,368 lines (largest) but cohesive - handles all relationship operations
  - `BlockEnvironmentService.kt` is 674 lines - batch operation orchestration
  - Most business logic methods 30-100 lines

**Parameters:**
- Constructor injection for dependencies (never field injection)
- Request/response DTOs passed as single parameter objects (never primitives for complex operations)
- UUID parameters for IDs rather than entities (looser coupling)

Example:
```kotlin
@Service
class EntityTypeService(
    private val entityTypeRepository: EntityTypeRepository,
    private val activityService: ActivityService,
    private val authTokenService: AuthTokenService
) {
    fun publishEntityType(workspaceId: UUID, request: CreateEntityTypeRequest): EntityType {
        // ...
    }
}
```

**Return Values:**
- Prefer single domain model returns over tuples
- Map returns for relationship data: `Map<UUID, List<EntityLink>>`
- Data class returns for multiple values: `SaveRelationshipsResult` with properties
- Use `let`, `also`, `run` for fluent chaining within method bodies

Example:
```kotlin
EntityTypeEntity(/* ... */).run {
    entityTypeRepository.save(this)
}.also {
    activityService.logActivity(/* ... */)
}
```

## Module Design

**Exports:**
- No barrel files (index.ts equivalent) used in codebase
- Full package paths required for imports
- Public services explicitly annotated with `@Service`

**Isolation:**
- Controller → Service → Repository → Entity (JPA)
- Services never directly access controllers
- Domain models (DTOs) in separate `models/` packages
- JPA entities (database) separate from domain models (service layer)

**Transaction Boundaries:**
- `@Transactional` applied at service method level
- Transactional methods orchestrate multiple repository operations
- Test context uses H2 in-memory database for unit tests

Example:
```kotlin
@Transactional
@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
fun publishEntityType(workspaceId: UUID, request: CreateEntityTypeRequest): EntityType {
    // All database operations in single transaction
}
```

---

*Convention analysis: 2026-02-07*
