---
phase: 02-attribute-filter-implementation
plan: 01
subsystem: query-sql-generation
tags: [sql-fragment, parameters, exceptions, infrastructure]

dependency-graph:
  requires: []
  provides: [SqlFragment, ParameterNameGenerator, QueryFilterExceptions]
  affects: [02-02, 02-03, 02-04]

tech-stack:
  added: []
  patterns: [immutable-composition, sealed-exception-hierarchy]

key-files:
  created:
    - src/main/kotlin/riven/core/service/entity/query/SqlFragment.kt
    - src/main/kotlin/riven/core/service/entity/query/ParameterNameGenerator.kt
    - src/main/kotlin/riven/core/exceptions/query/QueryFilterException.kt
  modified: []

decisions:
  - id: sql-fragment-immutable
    choice: "Immutable data class with composition methods"
    reason: "Thread-safe, testable, prevents accidental mutation during query building"
  - id: parameter-naming
    choice: "Counter-based unique naming ({prefix}_{counter})"
    reason: "Simple, deterministic, guaranteed unique within query tree"
  - id: exception-sealed-class
    choice: "Sealed class hierarchy for query exceptions"
    reason: "Enables exhaustive when-expression handling in error processing"

metrics:
  duration: 2min
  completed: 2026-02-02
---

# Phase 02 Plan 01: SQL Generation Foundation Summary

**SqlFragment composition infrastructure with parameterized SQL and unique parameter naming**

## What Was Built

### SqlFragment Data Class
`src/main/kotlin/riven/core/service/entity/query/SqlFragment.kt`

Immutable container for parameterized SQL fragments with composition methods:
- `sql: String` - SQL with named parameter placeholders (`:param_0`)
- `parameters: Map<String, Any?>` - Values to bind when executing
- `and(other)` - Combines with AND logic: `(this) AND (other)`
- `or(other)` - Combines with OR logic: `(this) OR (other)`
- `wrap(prefix, suffix)` - Wraps SQL with prefix/suffix
- `ALWAYS_TRUE` - Constant `1=1` for empty AND combinations
- `ALWAYS_FALSE` - Constant `1=0` for empty OR combinations

### ParameterNameGenerator Class
`src/main/kotlin/riven/core/service/entity/query/ParameterNameGenerator.kt`

Counter-based unique parameter name generation:
- `next(prefix)` - Returns `{prefix}_{counter}` and increments
- One instance per query tree ensures uniqueness across all fragments

### Query Filter Exceptions
`src/main/kotlin/riven/core/exceptions/query/QueryFilterException.kt`

Sealed exception hierarchy for query filter errors:
- `QueryFilterException` - Sealed base class
- `InvalidAttributeReferenceException(attributeId, reason)` - Missing/invalid attribute UUID
- `UnsupportedOperatorException(operator, attributeLabel, attributeId, attributeType)` - Operator/type mismatch
- `FilterNestingDepthExceededException(depth, maxDepth)` - AND/OR depth limit exceeded

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| SqlFragment immutability | Data class with new instances on composition | Thread-safe, testable, no mutation bugs |
| Parameter naming format | `{prefix}_{counter}` | Simple, deterministic, unique within query tree |
| Exception hierarchy | Sealed class | Exhaustive when-expression handling |
| Exception messages | Include all context (attributeId, type, label) | Developer-friendly debugging |

## Commits

| Task | Hash | Description |
|------|------|-------------|
| 1 | 95180dc | Create SqlFragment data class |
| 2 | e6207a2 | Create ParameterNameGenerator class |
| 3 | cf6c187 | Create query filter exception hierarchy |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**All prerequisites for 02-02 (Basic Operator SQL Generation) are satisfied:**
- SqlFragment provides the composition foundation
- ParameterNameGenerator provides unique parameter naming
- Exception classes provide error handling infrastructure

**Usage pattern for subsequent plans:**
```kotlin
val paramGen = ParameterNameGenerator()
val fragment = SqlFragment("e.payload->>'status' = :${paramGen.next("eq")}", mapOf("eq_0" to "Active"))
```
