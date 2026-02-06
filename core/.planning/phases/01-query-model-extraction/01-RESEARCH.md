# Phase 1: Query Model Extraction - Research

**Researched:** 2026-02-01
**Domain:** Kotlin model extraction, Jackson polymorphic serialization, sealed interfaces
**Confidence:** HIGH

## Summary

This phase extracts query-related models from `WorkflowQueryEntityActionConfig.kt` into a dedicated `models/entity/query/` directory. The existing code is well-structured with proper Jackson annotations for polymorphic serialization. The extraction is straightforward with minimal risk - the models are already production-ready and self-contained.

The main additions are:
1. New `TargetTypeMatches` relationship condition with type-aware branching
2. `maxDepth` field on `EntityQuery` for traversal depth limiting

**Primary recommendation:** Extract models file-by-file following the codebase's established patterns, keeping sealed interface hierarchies together within their respective files.

## Standard Stack

The models use established codebase technologies - no new dependencies required.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Jackson | 2.17.x (via Spring Boot 3.5.3) | JSON polymorphic serialization | Already in use throughout codebase |
| SpringDoc OpenAPI | 2.8.6 | `@Schema` annotations for API docs | Existing pattern in all models |
| Kotlin stdlib | 2.1.21 | `data class`, `sealed interface`, `data object` | Codebase standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Jakarta Validation | 3.0.x | Bean validation annotations | Optional - can add `@Valid` to nested structures |

**No new dependencies needed.** All required libraries are already present in `build.gradle.kts`.

## Architecture Patterns

### Recommended Project Structure
```
src/main/kotlin/riven/core/models/entity/query/
    EntityQuery.kt           # EntityQuery class with maxDepth
    QueryFilter.kt           # QueryFilter sealed interface + all subtypes + FilterOperator + FilterValue
    RelationshipCondition.kt # RelationshipCondition sealed interface + all subtypes + TypeBranch
    QueryPagination.kt       # QueryPagination + OrderByClause + SortDirection
    QueryProjection.kt       # QueryProjection class
```

### Pattern 1: Sealed Interface with Jackson Polymorphism
**What:** Sealed interfaces with `@JsonTypeInfo` and `@JsonSubTypes` for polymorphic JSON handling
**When to use:** Any type hierarchy that needs JSON serialization/deserialization
**Example:**
```kotlin
// Source: Existing pattern in WorkflowQueryEntityActionConfig.kt
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes(
    JsonSubTypes.Type(QueryFilter.Attribute::class, name = "ATTRIBUTE"),
    JsonSubTypes.Type(QueryFilter.Relationship::class, name = "RELATIONSHIP"),
    JsonSubTypes.Type(QueryFilter.And::class, name = "AND"),
    JsonSubTypes.Type(QueryFilter.Or::class, name = "OR")
)
sealed interface QueryFilter {
    @JsonTypeName("ATTRIBUTE")
    data class Attribute(...) : QueryFilter

    // Other subtypes...
}
```

### Pattern 2: Data Objects for Singleton Variants
**What:** Use `data object` for stateless sealed interface members
**When to use:** Relationship conditions without parameters (EXISTS, NOT_EXISTS)
**Example:**
```kotlin
// Source: Existing pattern in WorkflowQueryEntityActionConfig.kt
@JsonTypeName("EXISTS")
data object Exists : RelationshipCondition

@JsonTypeName("NOT_EXISTS")
data object NotExists : RelationshipCondition
```

### Pattern 3: Nested Types in Sealed Interface
**What:** Declare subtypes as nested classes within the sealed interface
**When to use:** When subtypes are only meaningful in the context of the parent
**Example:**
```kotlin
sealed interface QueryFilter {
    data class Attribute(...) : QueryFilter
    data class Relationship(...) : QueryFilter
    data class And(...) : QueryFilter
    data class Or(...) : QueryFilter
}
```

### Pattern 4: Supporting Types in Same File
**What:** Keep tightly-coupled supporting types (enums, simple data classes) in the same file
**When to use:** Types that are only used by the sealed interface
**Example:**
```kotlin
// In QueryFilter.kt
sealed interface QueryFilter { ... }

enum class FilterOperator { ... }

sealed interface FilterValue {
    data class Literal(...) : FilterValue
    data class Template(...) : FilterValue
}
```

### Anti-Patterns to Avoid
- **Splitting sealed interface across files:** All permitted subtypes must be in the same file or package (Kotlin requirement)
- **Custom deserializers when @JsonSubTypes works:** The existing annotations are cleaner and more maintainable
- **Optional without default:** Use nullable types with default `null` or provide sensible defaults
- **Mutable properties on data classes:** All extracted models should use `val` (they're already immutable)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON polymorphism | Custom deserializer | `@JsonSubTypes` annotations | Already working in existing code, cleaner |
| OpenAPI schema | Manual oneOf | `@Schema(oneOf = [...])` | Auto-generated from annotations |
| Validation | Manual null checks | Default values + nullable types | Kotlin's type system handles it |
| Type-safe enums | String constants | Kotlin `enum class` | Already used throughout codebase |

**Key insight:** The existing models are well-designed. The extraction is a refactoring, not a rewrite.

## Common Pitfalls

### Pitfall 1: Breaking JSON Backward Compatibility
**What goes wrong:** Changing `@JsonTypeName` values breaks existing serialized data
**Why it happens:** Temptation to "improve" type discriminator names during extraction
**How to avoid:** Keep existing values exactly: `"ATTRIBUTE"`, `"RELATIONSHIP"`, `"AND"`, `"OR"`, `"EXISTS"`, `"NOT_EXISTS"`, `"TARGET_EQUALS"`, `"TARGET_MATCHES"`, `"COUNT_MATCHES"`, `"LITERAL"`, `"TEMPLATE"`
**Warning signs:** Any change to string values in `@JsonTypeName` or `@JsonSubTypes.Type(..., name = "...")`

### Pitfall 2: Forgetting Package Imports After Extraction
**What goes wrong:** `WorkflowQueryEntityActionConfig` fails to compile after extraction
**Why it happens:** Types are moved but imports aren't updated
**How to avoid:** Update imports to `riven.core.models.entity.query.*` immediately after extraction
**Warning signs:** Compile errors in `WorkflowQueryEntityActionConfig.kt`

### Pitfall 3: maxDepth Validation at Wrong Layer
**What goes wrong:** Invalid maxDepth values reach execution and cause runtime errors
**Why it happens:** Validation added only at service layer, not model layer
**How to avoid:** Use `require` in EntityQuery init block or validate at deserialization
**Warning signs:** Values outside 1-10 range reaching query execution

### Pitfall 4: TypeBranch Empty Branches List
**What goes wrong:** TargetTypeMatches with empty branches causes silent failures or exceptions
**Why it happens:** No validation that at least one branch is required
**How to avoid:** Validate non-empty branches in TargetTypeMatches - add `init { require(branches.isNotEmpty()) }`
**Warning signs:** Queries with TargetTypeMatches but no type matches

### Pitfall 5: Sealed Interface in Wrong Package
**What goes wrong:** Compile error: "Sealed types can only be inherited by classes in the same package"
**Why it happens:** Subtypes placed in different package than sealed interface
**How to avoid:** All subtypes must be in `riven.core.models.entity.query` package
**Warning signs:** Kotlin compiler error about sealed type inheritance

## Code Examples

### EntityQuery with maxDepth
```kotlin
// Source: Based on existing EntityQuery + CONTEXT.md decisions
package riven.core.models.entity.query

import io.swagger.v3.oas.annotations.media.Schema
import java.util.*

/**
 * Core query definition targeting an entity type with optional filters.
 *
 * @property entityTypeId UUID of the entity type to query
 * @property filter Optional filter criteria for narrowing results
 * @property maxDepth Maximum relationship traversal depth (1-10, default 3)
 */
@Schema(description = "Core query definition with entity type and optional filter criteria.")
data class EntityQuery(
    @Schema(description = "UUID of the entity type to query.")
    val entityTypeId: UUID,

    @Schema(description = "Optional filter criteria.", nullable = true)
    val filter: QueryFilter? = null,

    @Schema(
        description = "Maximum depth for nested relationship traversal. Applies to entire query tree.",
        defaultValue = "3",
        minimum = "1",
        maximum = "10"
    )
    val maxDepth: Int = 3
) {
    init {
        require(maxDepth in 1..10) { "maxDepth must be between 1 and 10, was: $maxDepth" }
    }
}
```

### TargetTypeMatches with TypeBranch
```kotlin
// Source: CONTEXT.md decisions for TargetTypeMatches design
package riven.core.models.entity.query

import com.fasterxml.jackson.annotation.JsonTypeName
import io.swagger.v3.oas.annotations.media.Schema
import java.util.*

/**
 * Branch for type-aware filtering in polymorphic relationships.
 *
 * @property entityTypeId UUID of the entity type this branch matches
 * @property filter Optional filter to apply to entities of this type (null = match any)
 */
@Schema(description = "Type branch for polymorphic relationship filtering.")
data class TypeBranch(
    @Schema(description = "UUID of the entity type this branch matches.")
    val entityTypeId: UUID,

    @Schema(description = "Optional filter to apply to entities of this type.", nullable = true)
    val filter: QueryFilter? = null
)

// Add to RelationshipCondition sealed interface:
/**
 * Type-aware filtering for polymorphic relationships.
 *
 * Matches if the related entity's type matches any branch AND
 * satisfies that branch's optional filter (OR semantics across branches).
 *
 * @property branches List of type-specific filter branches (at least one required)
 */
@Schema(description = "Type-aware filtering for polymorphic relationships.")
@JsonTypeName("TARGET_TYPE_MATCHES")
data class TargetTypeMatches(
    @Schema(description = "Type-specific filter branches. At least one required.")
    val branches: List<TypeBranch>
) : RelationshipCondition {
    init {
        require(branches.isNotEmpty()) { "TargetTypeMatches requires at least one branch" }
    }
}
```

### Updated RelationshipCondition (with new subtype)
```kotlin
// Source: Existing WorkflowQueryEntityActionConfig.kt + new TargetTypeMatches
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes(
    JsonSubTypes.Type(RelationshipCondition.Exists::class, name = "EXISTS"),
    JsonSubTypes.Type(RelationshipCondition.NotExists::class, name = "NOT_EXISTS"),
    JsonSubTypes.Type(RelationshipCondition.TargetEquals::class, name = "TARGET_EQUALS"),
    JsonSubTypes.Type(RelationshipCondition.TargetMatches::class, name = "TARGET_MATCHES"),
    JsonSubTypes.Type(RelationshipCondition.TargetTypeMatches::class, name = "TARGET_TYPE_MATCHES"),  // NEW
    JsonSubTypes.Type(RelationshipCondition.CountMatches::class, name = "COUNT_MATCHES")
)
sealed interface RelationshipCondition {
    // Existing subtypes...

    @Schema(description = "Type-aware filtering for polymorphic relationships.")
    @JsonTypeName("TARGET_TYPE_MATCHES")
    data class TargetTypeMatches(
        @Schema(description = "Type-specific filter branches. At least one required.")
        val branches: List<TypeBranch>
    ) : RelationshipCondition {
        init {
            require(branches.isNotEmpty()) { "TargetTypeMatches requires at least one branch" }
        }
    }
}
```

### File Organization Example
```kotlin
// QueryFilter.kt - complete file structure
package riven.core.models.entity.query

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import io.swagger.v3.oas.annotations.media.Schema
import java.util.*

// 1. Main sealed interface with all subtypes
@Schema(...)
@JsonTypeInfo(...)
@JsonSubTypes(...)
sealed interface QueryFilter {
    @JsonTypeName("ATTRIBUTE")
    data class Attribute(...) : QueryFilter

    @JsonTypeName("RELATIONSHIP")
    data class Relationship(...) : QueryFilter

    @JsonTypeName("AND")
    data class And(...) : QueryFilter

    @JsonTypeName("OR")
    data class Or(...) : QueryFilter
}

// 2. Supporting enum
@Schema(description = "Comparison operators for filtering.")
enum class FilterOperator {
    EQUALS, NOT_EQUALS, GREATER_THAN, ...
}

// 3. Supporting sealed interface
@Schema(...)
@JsonTypeInfo(...)
@JsonSubTypes(...)
sealed interface FilterValue {
    @JsonTypeName("LITERAL")
    data class Literal(val value: Any?) : FilterValue

    @JsonTypeName("TEMPLATE")
    data class Template(val expression: String) : FilterValue
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom deserializers | @JsonSubTypes | Jackson 2.x | Cleaner, less code |
| Sealed classes | Sealed interfaces | Kotlin 1.5+ | More flexible - can implement multiple |
| Object singleton | data object | Kotlin 1.9+ | Better hashCode/toString |

**Deprecated/outdated:**
- None - existing models use current best practices

## Open Questions

No unresolved questions. The CONTEXT.md decisions are clear and actionable:

1. **File organization:** Decided - separate by concern with sealed hierarchies together
2. **TargetTypeMatches design:** Decided - entityTypeId: UUID, nullable filter, at least one branch required
3. **maxDepth behavior:** Decided - lives on EntityQuery, default 3, range 1-10
4. **Import migration:** Decided - direct imports, delete originals immediately

## Sources

### Primary (HIGH confidence)
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/models/workflow/node/config/actions/WorkflowQueryEntityActionConfig.kt` - Source models to extract (754 lines, well-documented)
- `/home/jared/dev/worktrees/entity-query/core/.planning/phases/01-query-model-extraction/01-CONTEXT.md` - User decisions constraining implementation
- `/home/jared/dev/worktrees/entity-query/core/CLAUDE.md` - Codebase conventions and patterns

### Secondary (MEDIUM confidence)
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/models/entity/` - Existing entity model patterns
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/models/block/metadata/` - Sealed interface pattern reference

### Tertiary (LOW confidence)
- None - all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, all patterns already in codebase
- Architecture: HIGH - Patterns copied from existing well-working code
- Pitfalls: HIGH - Based on direct analysis of existing code and Kotlin language requirements

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (stable - model extraction with no external dependencies)
