# Phase 2: Attribute Filter Implementation - Research

**Researched:** 2026-02-02
**Domain:** PostgreSQL JSONB query generation, SQL fragment composition, parameterized queries
**Confidence:** HIGH

## Summary

This phase implements attribute filtering by generating parameterized PostgreSQL SQL for all 12 FilterOperator variants, combined with AND/OR logical grouping. The core deliverable is a `SqlFragment` data class and a visitor/builder that traverses `QueryFilter.Attribute` and logical nodes to produce correct, GIN-index-aware SQL.

The key architectural decisions from CONTEXT.md constrain implementation:
- Text operators (CONTAINS, STARTS_WITH, ENDS_WITH) use ILIKE for case-insensitivity
- Numeric comparisons cast JSONB values to `::numeric`
- IS_NULL matches both missing keys AND explicit JSON null values
- Type coercion failures result in silent non-match (row excluded, no error)
- GIN index optimization via `@>` containment operator for EQUALS where possible

**Primary recommendation:** Build SqlFragment as an immutable data class with composition methods (`and()`, `or()`, `wrap()`). Implement attribute SQL generation as a pure function that maps FilterOperator to the appropriate JSONB SQL pattern with parameterized values.

## Standard Stack

No new dependencies required. All patterns use existing codebase infrastructure.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NamedParameterJdbcTemplate | Spring Boot 3.5.3 | Execute parameterized SQL | Already in Spring Data JPA, named params more readable |
| Jackson | 2.17.x (via Spring Boot) | JSON serialization for containment queries | Already used for JSONB payload handling |
| Kotlin stdlib | 2.1.21 | Immutable data classes, sealed interfaces | Codebase standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Hypersistence Utils | 3.9.2 | JSONB type mapping in JPA entities | Already in use for EntityEntity.payload |

**Installation:** No new dependencies needed.

## Architecture Patterns

### Recommended Project Structure
```
src/main/kotlin/riven/core/service/entity/query/
    SqlFragment.kt           # Immutable SQL + parameters data class
    AttributeSqlGenerator.kt # Maps FilterOperator to JSONB SQL
    FilterSqlVisitor.kt      # Traverses QueryFilter tree, produces SqlFragment
    QueryFilterValidator.kt  # Validates attribute references, nesting depth
```

### Pattern 1: Immutable SqlFragment Composition
**What:** SqlFragment holds SQL string with named parameter placeholders and a Map of parameter values. Composition methods return new instances.
**When to use:** Any SQL generation where fragments need to be combined.
**Example:**
```kotlin
// Source: Architecture decision from ARCHITECTURE.md
data class SqlFragment(
    val sql: String,
    val parameters: Map<String, Any?>
) {
    fun and(other: SqlFragment): SqlFragment {
        val combinedSql = "(${this.sql}) AND (${other.sql})"
        val combinedParams = this.parameters + other.parameters
        return SqlFragment(combinedSql, combinedParams)
    }

    fun or(other: SqlFragment): SqlFragment {
        val combinedSql = "(${this.sql}) OR (${other.sql})"
        val combinedParams = this.parameters + other.parameters
        return SqlFragment(combinedSql, combinedParams)
    }

    companion object {
        val EMPTY = SqlFragment("1=1", emptyMap())  // Always true
        val NEVER = SqlFragment("1=0", emptyMap())  // Always false
    }
}
```

### Pattern 2: Unique Parameter Naming
**What:** Generate unique parameter names to avoid collisions when composing fragments.
**When to use:** Every attribute condition generates parameters.
**Example:**
```kotlin
// Use incrementing counter or UUID suffix
class ParameterNameGenerator {
    private var counter = 0
    fun next(prefix: String): String = "${prefix}_${counter++}"
}

// Usage
val paramName = generator.next("attr")  // "attr_0", "attr_1", etc.
val sql = "payload->>:${paramName}_key = :${paramName}_value"
```

### Pattern 3: When Expression for Operator Dispatch
**What:** Kotlin when expression exhaustively handles all FilterOperator variants.
**When to use:** Mapping operators to SQL patterns.
**Example:**
```kotlin
// Source: Kotlin sealed class exhaustive matching
fun generateAttributeSql(
    attributeId: UUID,
    operator: FilterOperator,
    value: Any?,
    paramGen: ParameterNameGenerator
): SqlFragment = when (operator) {
    FilterOperator.EQUALS -> generateEquals(attributeId, value, paramGen)
    FilterOperator.NOT_EQUALS -> generateNotEquals(attributeId, value, paramGen)
    FilterOperator.GREATER_THAN -> generateGreaterThan(attributeId, value, paramGen)
    // ... all 12 operators
}
```

### Anti-Patterns to Avoid
- **String concatenation with values:** Never build `"payload->>'$key' = '$value'"`. Always use parameterized queries.
- **Mutable fragment building:** Don't use `StringBuilder` to accumulate SQL. Return new SqlFragment instances.
- **Ignoring parameter uniqueness:** Reusing parameter names across fragments causes binding errors.
- **Mixing positional and named parameters:** Stick to named parameters (`:paramName`) throughout.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parameter name generation | Manual counter management | Encapsulated ParameterNameGenerator class | Prevents naming collisions, easier testing |
| JSON escaping for @> | Manual string escaping | Jackson ObjectMapper.writeValueAsString() | Handles all edge cases (quotes, unicode) |
| Nesting depth tracking | Pass depth through call stack | Explicit depth parameter in visitor | Clear, testable, prevents stack overflow |
| Type coercion | Custom parsing logic | Kotlin's `toDoubleOrNull()`, `toBooleanStrictOrNull()` | Robust, returns null on failure |

**Key insight:** The challenge is mapping abstract operators to concrete PostgreSQL JSONB syntax while maintaining parameterization. Keep the SQL generation deterministic and testable.

## Common Pitfalls

### Pitfall 1: GIN Index Not Used for Equality
**What goes wrong:** Using `->>` extraction for EQUALS bypasses the GIN index.
**Why it happens:** `->>` extracts as text, which doesn't use `jsonb_path_ops` GIN index. Only `@>` containment uses the index.
**How to avoid:** For EQUALS with simple values, prefer containment: `payload @> :jsonFilter::jsonb` where jsonFilter is `{"uuid-key": "value"}` serialized as JSON.
**Warning signs:** EXPLAIN shows "Seq Scan" on entities table for EQUALS queries.

### Pitfall 2: NULL vs Missing Key Ambiguity
**What goes wrong:** `payload->>'key' IS NULL` matches both missing keys AND explicit JSON null values, which is the desired behavior per CONTEXT.md, but can be unexpected.
**Why it happens:** PostgreSQL's `->>` operator returns SQL NULL for both missing keys and JSON null values.
**How to avoid:** Per CONTEXT.md, this is intentional. Document clearly that IS_NULL matches both cases. For NOT_EQUALS, we need to check key existence first: `payload ? 'key' AND payload->>'key' != :value`.
**Warning signs:** Filters returning more/fewer rows than expected.

### Pitfall 3: Type Coercion Errors Throwing Exceptions
**What goes wrong:** `(payload->>'key')::numeric` throws if value is not numeric, breaking the query.
**Why it happens:** PostgreSQL casts are strict by default.
**How to avoid:** Per CONTEXT.md, coercion failures should silently non-match. Use safe patterns:
```sql
-- Safe numeric comparison (returns false on non-numeric)
CASE WHEN payload->>'key' ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (payload->>'key')::numeric > :val ELSE false END
```
Or use jsonpath which suppresses type errors: `payload @? '$.key ? (@ > 100)'`
**Warning signs:** Queries failing with "invalid input syntax for type numeric".

### Pitfall 4: Parameter Name Collisions in Nested Filters
**What goes wrong:** Two conditions generate same parameter name (e.g., `:value`), causing incorrect binding.
**Why it happens:** Naive naming without uniqueness guarantee.
**How to avoid:** Use ParameterNameGenerator that guarantees unique names across entire query tree.
**Warning signs:** Wrong values in query results, unexpected WHERE clause behavior.

### Pitfall 5: Exceeding Nesting Depth Limit
**What goes wrong:** Deeply nested AND/OR structures cause stack overflow or massive SQL.
**Why it happens:** Recursive visitor without depth limit.
**How to avoid:** Per CONTEXT.md, enforce nesting depth limit (suggested 10). Check depth at entry to visitor, throw descriptive error if exceeded.
**Warning signs:** StackOverflowError, extremely slow query generation.

## Code Examples

### SqlFragment Data Class
```kotlin
// Source: Architecture patterns from prior research
package riven.core.service.entity.query

/**
 * Immutable container for parameterized SQL fragment.
 * Supports composition via and(), or() for building complex WHERE clauses.
 */
data class SqlFragment(
    val sql: String,
    val parameters: Map<String, Any?>
) {
    /**
     * Combine with AND logic. Both conditions must match.
     */
    fun and(other: SqlFragment): SqlFragment = SqlFragment(
        sql = "(${this.sql}) AND (${other.sql})",
        parameters = this.parameters + other.parameters
    )

    /**
     * Combine with OR logic. Either condition must match.
     */
    fun or(other: SqlFragment): SqlFragment = SqlFragment(
        sql = "(${this.sql}) OR (${other.sql})",
        parameters = this.parameters + other.parameters
    )

    /**
     * Wrap SQL with prefix/suffix (e.g., for EXISTS subquery).
     */
    fun wrap(prefix: String, suffix: String): SqlFragment = SqlFragment(
        sql = "$prefix${this.sql}$suffix",
        parameters = this.parameters
    )

    companion object {
        /** Always-true condition for empty AND lists */
        val ALWAYS_TRUE = SqlFragment("1=1", emptyMap())
        /** Always-false condition for empty OR lists */
        val ALWAYS_FALSE = SqlFragment("1=0", emptyMap())
    }
}
```

### EQUALS Operator (GIN-Optimized)
```kotlin
// Source: PostgreSQL JSONB containment operator (@>) for GIN index usage
fun generateEquals(
    attributeId: UUID,
    value: Any?,
    paramGen: ParameterNameGenerator,
    objectMapper: ObjectMapper
): SqlFragment {
    // IS_NULL case: redirect to IS_NULL logic
    if (value == null) {
        return generateIsNull(attributeId)
    }

    // For simple scalar values, use containment for GIN index
    val paramName = paramGen.next("eq")
    val jsonFilter = objectMapper.writeValueAsString(
        mapOf(attributeId.toString() to mapOf("value" to value))
    )
    return SqlFragment(
        sql = "e.payload @> :$paramName::jsonb",
        parameters = mapOf(paramName to jsonFilter)
    )
}
```

### NOT_EQUALS Operator (With Key Existence Check)
```kotlin
// Source: CONTEXT.md - NOT_EQUALS excludes entities with missing attributes
fun generateNotEquals(
    attributeId: UUID,
    value: Any?,
    paramGen: ParameterNameGenerator
): SqlFragment {
    val keyParam = paramGen.next("neq_key")
    val valueParam = paramGen.next("neq_val")
    val key = attributeId.toString()

    // Must have the attribute AND value must differ
    return SqlFragment(
        sql = "(e.payload ? :$keyParam AND (e.payload->:$keyParam->>'value') != :$valueParam)",
        parameters = mapOf(
            keyParam to key,
            valueParam to value?.toString() ?: ""
        )
    )
}
```

### Numeric Comparison Operators
```kotlin
// Source: PostgreSQL docs - cast JSONB text to numeric for comparison
fun generateNumericComparison(
    attributeId: UUID,
    operator: String,  // ">", ">=", "<", "<="
    value: Number,
    paramGen: ParameterNameGenerator
): SqlFragment {
    val keyParam = paramGen.next("num_key")
    val valueParam = paramGen.next("num_val")
    val key = attributeId.toString()

    // Use jsonpath for safe numeric comparison (suppresses type errors)
    // payload @? '$.["uuid-key"].value ? (@ > 100)'
    val jsonpathParam = paramGen.next("jsonpath")
    val jsonpath = "\$.\"$key\".value ? (@ $operator \$val)"

    return SqlFragment(
        sql = "e.payload @? :$jsonpathParam::jsonpath",
        parameters = mapOf(
            jsonpathParam to jsonpath,
            "val" to value  // jsonpath variable
        )
    )
}

// Alternative: regex-guarded cast (more compatible)
fun generateNumericComparisonWithCast(
    attributeId: UUID,
    operator: String,
    value: Number,
    paramGen: ParameterNameGenerator
): SqlFragment {
    val keyParam = paramGen.next("num_key")
    val valueParam = paramGen.next("num_val")
    val key = attributeId.toString()

    return SqlFragment(
        sql = """
            CASE
                WHEN (e.payload->:$keyParam->>'value') ~ '^-?[0-9]+(\\.[0-9]+)?$'
                THEN (e.payload->:$keyParam->>'value')::numeric $operator :$valueParam
                ELSE false
            END
        """.trimIndent(),
        parameters = mapOf(
            keyParam to key,
            valueParam to value
        )
    )
}
```

### Text Operators (CONTAINS, STARTS_WITH, ENDS_WITH)
```kotlin
// Source: CONTEXT.md - Use ILIKE for case-insensitive matching
fun generateContains(
    attributeId: UUID,
    value: String,
    paramGen: ParameterNameGenerator
): SqlFragment {
    val keyParam = paramGen.next("contains_key")
    val valueParam = paramGen.next("contains_val")

    return SqlFragment(
        sql = "(e.payload->:$keyParam->>'value') ILIKE :$valueParam",
        parameters = mapOf(
            keyParam to attributeId.toString(),
            valueParam to "%$value%"  // Wrap with wildcards
        )
    )
}

fun generateStartsWith(
    attributeId: UUID,
    value: String,
    paramGen: ParameterNameGenerator
): SqlFragment {
    val keyParam = paramGen.next("starts_key")
    val valueParam = paramGen.next("starts_val")

    return SqlFragment(
        sql = "(e.payload->:$keyParam->>'value') ILIKE :$valueParam",
        parameters = mapOf(
            keyParam to attributeId.toString(),
            valueParam to "$value%"  // Wildcard at end only
        )
    )
}

fun generateEndsWith(
    attributeId: UUID,
    value: String,
    paramGen: ParameterNameGenerator
): SqlFragment {
    val keyParam = paramGen.next("ends_key")
    val valueParam = paramGen.next("ends_val")

    return SqlFragment(
        sql = "(e.payload->:$keyParam->>'value') ILIKE :$valueParam",
        parameters = mapOf(
            keyParam to attributeId.toString(),
            valueParam to "%$value"  // Wildcard at start only
        )
    )
}
```

### IN / NOT_IN Operators
```kotlin
// Source: CONTEXT.md - Use FilterValue's values list, not string parsing
fun generateIn(
    attributeId: UUID,
    values: List<Any?>,
    paramGen: ParameterNameGenerator
): SqlFragment {
    if (values.isEmpty()) {
        return SqlFragment.ALWAYS_FALSE  // IN () is always false
    }

    val keyParam = paramGen.next("in_key")
    val valuesParam = paramGen.next("in_vals")

    return SqlFragment(
        sql = "(e.payload->:$keyParam->>'value') IN (:$valuesParam)",
        parameters = mapOf(
            keyParam to attributeId.toString(),
            valuesParam to values.map { it?.toString() ?: "" }
        )
    )
}

fun generateNotIn(
    attributeId: UUID,
    values: List<Any?>,
    paramGen: ParameterNameGenerator
): SqlFragment {
    if (values.isEmpty()) {
        return SqlFragment.ALWAYS_TRUE  // NOT IN () is always true
    }

    val keyParam = paramGen.next("nin_key")
    val valuesParam = paramGen.next("nin_vals")

    // Must have attribute AND value not in list
    return SqlFragment(
        sql = "(e.payload ? :$keyParam AND (e.payload->:$keyParam->>'value') NOT IN (:$valuesParam))",
        parameters = mapOf(
            keyParam to attributeId.toString(),
            valuesParam to values.map { it?.toString() ?: "" }
        )
    )
}
```

### IS_NULL / IS_NOT_NULL Operators
```kotlin
// Source: CONTEXT.md - IS_NULL matches both missing keys AND explicit JSON null
fun generateIsNull(
    attributeId: UUID,
    paramGen: ParameterNameGenerator
): SqlFragment {
    val keyParam = paramGen.next("null_key")

    // Missing key OR explicit JSON null: ->> returns SQL NULL for both
    return SqlFragment(
        sql = "(e.payload->:$keyParam->>'value') IS NULL",
        parameters = mapOf(keyParam to attributeId.toString())
    )
}

fun generateIsNotNull(
    attributeId: UUID,
    paramGen: ParameterNameGenerator
): SqlFragment {
    val keyParam = paramGen.next("notnull_key")

    // Key exists AND value is not JSON null
    return SqlFragment(
        sql = "(e.payload->:$keyParam->>'value') IS NOT NULL",
        parameters = mapOf(keyParam to attributeId.toString())
    )
}
```

### AND/OR Composition
```kotlin
// Source: CONTEXT.md - Arbitrary nesting with depth limit
fun visitAnd(
    conditions: List<QueryFilter>,
    depth: Int,
    maxDepth: Int,
    paramGen: ParameterNameGenerator
): SqlFragment {
    if (depth > maxDepth) {
        throw FilterNestingDepthExceededException(
            "Filter nesting depth $depth exceeds maximum $maxDepth"
        )
    }

    if (conditions.isEmpty()) {
        return SqlFragment.ALWAYS_TRUE  // Empty AND = true
    }

    return conditions
        .map { visit(it, depth + 1, maxDepth, paramGen) }
        .reduce { acc, fragment -> acc.and(fragment) }
}

fun visitOr(
    conditions: List<QueryFilter>,
    depth: Int,
    maxDepth: Int,
    paramGen: ParameterNameGenerator
): SqlFragment {
    if (depth > maxDepth) {
        throw FilterNestingDepthExceededException(
            "Filter nesting depth $depth exceeds maximum $maxDepth"
        )
    }

    if (conditions.isEmpty()) {
        return SqlFragment.ALWAYS_FALSE  // Empty OR = false
    }

    return conditions
        .map { visit(it, depth + 1, maxDepth, paramGen) }
        .reduce { acc, fragment -> acc.or(fragment) }
}
```

### Attribute Reference Validation
```kotlin
// Source: CONTEXT.md - Validate at build time with descriptive errors
class AttributeValidator(
    private val entityTypeSchema: Schema<UUID>
) {
    fun validateAttributeReference(
        attributeId: UUID,
        operator: FilterOperator
    ) {
        val attribute = entityTypeSchema.properties?.get(attributeId)
            ?: throw InvalidAttributeReferenceException(
                "Attribute with ID $attributeId does not exist in entity type schema"
            )

        // Validate operator/type compatibility
        when (operator) {
            FilterOperator.GREATER_THAN,
            FilterOperator.GREATER_THAN_OR_EQUALS,
            FilterOperator.LESS_THAN,
            FilterOperator.LESS_THAN_OR_EQUALS -> {
                if (attribute.type != DataType.NUMBER) {
                    throw UnsupportedOperatorException(
                        "Operator $operator not supported for ${attribute.type} attribute " +
                        "'${attribute.label}' (id: $attributeId)"
                    )
                }
            }
            FilterOperator.CONTAINS,
            FilterOperator.NOT_CONTAINS,
            FilterOperator.STARTS_WITH,
            FilterOperator.ENDS_WITH -> {
                if (attribute.type != DataType.STRING && attribute.type != DataType.ARRAY) {
                    throw UnsupportedOperatorException(
                        "Operator $operator not supported for ${attribute.type} attribute " +
                        "'${attribute.label}' (id: $attributeId)"
                    )
                }
            }
            else -> { /* EQUALS, NOT_EQUALS, IN, NOT_IN, IS_NULL, IS_NOT_NULL work on all types */ }
        }
    }
}
```

## Operator SQL Mapping Summary

| Operator | SQL Pattern | GIN Index | Notes |
|----------|------------|-----------|-------|
| EQUALS | `payload @> :json::jsonb` | YES | Use containment for scalar values |
| NOT_EQUALS | `payload ? :key AND (payload->:key->>'value') != :val` | Partial | Must check key exists first |
| GREATER_THAN | `CASE WHEN ... THEN (...)::numeric > :val ELSE false END` | NO | Regex guard for safe cast |
| GREATER_THAN_OR_EQUALS | Same pattern with `>=` | NO | |
| LESS_THAN | Same pattern with `<` | NO | |
| LESS_THAN_OR_EQUALS | Same pattern with `<=` | NO | |
| IN | `(payload->:key->>'value') IN (:vals)` | NO | Empty list = always false |
| NOT_IN | `payload ? :key AND (...) NOT IN (:vals)` | Partial | Empty list = always true |
| CONTAINS | `(payload->:key->>'value') ILIKE '%val%'` | NO | Case-insensitive |
| NOT_CONTAINS | `NOT ((payload->:key->>'value') ILIKE '%val%')` | NO | |
| STARTS_WITH | `(payload->:key->>'value') ILIKE 'val%'` | NO | |
| ENDS_WITH | `(payload->:key->>'value') ILIKE '%val'` | NO | |
| IS_NULL | `(payload->:key->>'value') IS NULL` | NO | Matches missing AND explicit null |
| IS_NOT_NULL | `(payload->:key->>'value') IS NOT NULL` | NO | |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `->>` extraction for equality | `@>` containment operator | PostgreSQL 9.4+ | Uses GIN index |
| `::numeric` direct cast | Regex-guarded cast or jsonpath | Best practice | Prevents cast errors |
| Positional params (`?`) | Named params (`:name`) | Spring 3.x+ | More readable, maintainable |
| String building | Immutable fragment composition | Pattern evolution | Thread-safe, testable |

**Deprecated/outdated:**
- `json` type (use `jsonb` for operators and indexing)
- JPA Criteria for JSONB queries (limited operator support)

## Open Questions

1. **Jsonpath vs Regex-Guarded Cast for Numerics**
   - What we know: Jsonpath (`@?`, `@@`) suppresses type errors and uses GIN index with `jsonb_path_ops`. Regex-guarded cast is more explicit but doesn't use index.
   - What's unclear: Which has better performance characteristics at scale. Jsonpath syntax can be complex for dynamic UUID keys.
   - Recommendation: Start with regex-guarded cast (simpler, explicit). Add jsonpath optimization later if needed.

2. **Date/DateTime Comparison**
   - What we know: CONTEXT.md mentions parsing ISO date strings for date comparisons.
   - What's unclear: Exact format handling, timezone considerations.
   - Recommendation: Use ISO 8601 format (`YYYY-MM-DDTHH:MM:SS.sssZ`) and PostgreSQL's `::timestamptz` cast with similar regex guard.

3. **Array CONTAINS Semantics**
   - What we know: CONTAINS for strings means substring. CONTAINS for arrays might mean element membership.
   - What's unclear: Whether CONTAINS should work differently on ARRAY-typed attributes.
   - Recommendation: Initially implement CONTAINS as substring for strings only. Validate type at build time, reject for arrays with clear error.

## Sources

### Primary (HIGH confidence)
- [PostgreSQL 18: JSON Functions and Operators](https://www.postgresql.org/docs/current/functions-json.html) - Official JSONB operator reference
- [PostgreSQL 18: JSON Types](https://www.postgresql.org/docs/current/datatype-json.html) - JSONB type documentation and jsonpath
- `/home/jared/dev/worktrees/entity-query/core/.planning/research/ARCHITECTURE.md` - Prior architecture research
- `/home/jared/dev/worktrees/entity-query/core/.planning/research/STACK.md` - Technology stack decisions
- `/home/jared/dev/worktrees/entity-query/core/.planning/research/PITFALLS.md` - Domain pitfalls catalog
- `/home/jared/dev/worktrees/entity-query/core/.planning/phases/02-attribute-filter-implementation/02-CONTEXT.md` - User decisions constraining implementation

### Secondary (MEDIUM confidence)
- [Neon: PostgreSQL JSONB Operators](https://neon.com/postgresql/postgresql-json-functions/postgresql-jsonb-operators) - Practical JSONB operator examples
- [Marcin Borkowski: PostgreSQL null values in jsonb](https://mbork.pl/2020-02-15_PostgreSQL_and_null_values_in_jsonb) - NULL vs missing key semantics
- [Finding null JSON values in Postgres](https://jmduke.com/posts/post/postgres-null-json-values/) - Practical NULL handling
- [Case-Insensitive Text Search in PostgreSQL](https://medium.com/codex/case-insensitive-text-search-in-postgresql-whats-fast-and-what-fails-f836024c4590) - ILIKE performance patterns

### Tertiary (LOW confidence)
- WebSearch results on numeric comparison patterns - verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, uses established patterns
- Architecture: HIGH - SqlFragment pattern proven in jOOQ, Exposed
- Operator mapping: HIGH - Verified against PostgreSQL official docs
- Pitfalls: HIGH - Based on prior PITFALLS.md research and official sources

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (stable domain - PostgreSQL operators are stable)
