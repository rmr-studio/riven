---
tags:
  - component/active
  - layer/service
  - architecture/component
Created: 2026-02-08
Updated: 2026-02-08
Domains:
  - "[[Entities]]"
---
Part of [[Querying]]

# AttributeSqlGenerator

---

## Purpose

Generates parameterized SQL fragments for filtering entities by JSONB attribute values, converting FilterOperator conditions into PostgreSQL SQL with appropriate JSONB operators optimized for GIN index usage.

---

## Responsibilities

**This component owns:**
- Converting FilterOperator conditions to PostgreSQL JSONB SQL
- Optimizing EQUALS operator for GIN index usage (`@>` containment)
- Adding key existence checks for NOT_EQUALS and NOT_IN (prevent NULL mismatches)
- Generating regex-guarded numeric casts for comparisons (prevent PostgreSQL errors)
- Escaping LIKE metacharacters for safe pattern matching
- Handling entity alias parameterization for nested relationship filters
- Generating ALWAYS_TRUE/ALWAYS_FALSE fragments for empty IN/NOT_IN lists

**Explicitly NOT responsible for:**
- Validating filter structure or attribute IDs (delegated to validation layer)
- Executing queries (delegated to query executor)
- Resolving template expressions (delegated to workflow layer)
- Managing ParameterNameGenerator lifecycle (caller provides shared instance)

---

## Dependencies

### Internal Dependencies

|Component|Purpose|Coupling|
|---|---|---|
|[[SqlFragment]]|Immutable container for SQL with parameters|High|
|[[ParameterNameGenerator]]|Generates unique parameter names|High|

### External Dependencies

|Service/Library|Purpose|Failure Impact|
|---|---|---|
|Jackson ObjectMapper|JSON serialization for GIN containment queries|Cannot generate EQUALS operator SQL|
|Spring Framework|Dependency injection via @Component|Cannot instantiate component|

### Injected Dependencies

```kotlin
@Component
class AttributeSqlGenerator(
    private val objectMapper: ObjectMapper
)
```

---

## Consumed By

|Component|How It Uses This|Notes|
|---|---|---|
|[[AttributeFilterVisitor]]|Calls generate() for each ATTRIBUTE filter node|Main consumer - delegates all attribute SQL generation|
|[[RelationshipSqlGenerator]]|Calls generate() for nested attribute filters in TargetMatches|Passes custom entityAlias for target entity table|

---

## Public Interface

### Key Methods

#### `generate(attributeId: UUID, operator: FilterOperator, value: Any?, paramGen: ParameterNameGenerator, entityAlias: String = "e"): SqlFragment`

- **Purpose:** Generates a SQL fragment for filtering by an attribute value
- **When to use:** For each attribute comparison in a filter tree
- **Side effects:** Increments paramGen counter (pure function otherwise)
- **Throws:** None (all operators supported, invalid inputs produce safe SQL)
- **Returns:** SqlFragment with parameterized SQL and bound values

**Parameters:**
- `attributeId`: UUID key of the attribute in the entity's JSONB payload
- `operator`: Comparison operator (EQUALS, GREATER_THAN, CONTAINS, etc.)
- `value`: Value to compare against (may be null for IS_NULL/IS_NOT_NULL)
- `paramGen`: Generator for unique parameter names (shared across query tree)
- `entityAlias`: Table alias for the entity being filtered (default "e" for root entity, "t_N" for relationship targets)

**Operator dispatch:**
```kotlin
when (operator) {
    EQUALS -> generateEquals(...)
    NOT_EQUALS -> generateNotEquals(...)
    GREATER_THAN -> generateNumericComparison(">", ...)
    GREATER_THAN_OR_EQUALS -> generateNumericComparison(">=", ...)
    LESS_THAN -> generateNumericComparison("<", ...)
    LESS_THAN_OR_EQUALS -> generateNumericComparison("<=", ...)
    IN -> generateIn(...)
    NOT_IN -> generateNotIn(...)
    CONTAINS -> generateContains(...)
    NOT_CONTAINS -> generateNotContains(...)
    IS_NULL -> generateIsNull(...)
    IS_NOT_NULL -> generateIsNotNull(...)
    STARTS_WITH -> generateStartsWith(...)
    ENDS_WITH -> generateEndsWith(...)
}
```

---

## Key Logic

### GIN Index Optimization

**EQUALS operator uses `@>` containment for index efficiency:**

```sql
e.payload @> '{"attr-uuid": {"value": "some-value"}}'::jsonb
```

**Why `@>` instead of `->>` equality:**
- GIN indexes with `jsonb_path_ops` can use index scans for containment checks
- `->>` equality (`payload->>'attr-uuid' = 'value'`) requires sequential scan of JSONB values
- `@>` is semantically correct: "payload contains this exact key-value pair"

**JSON structure:**
The containment check wraps the value in the expected schema structure:
```json
{
  "attribute-uuid": {
    "value": "actual-value"
  }
}
```

**Edge case - null values:**
If value is null, delegates to IS_NULL operator (containment doesn't work for null).

### Key Existence Checks

**NOT_EQUALS and NOT_IN require key existence verification:**

```sql
-- NOT_EQUALS
(jsonb_exists(e.payload, :key) AND (e.payload->:key->>'value') != :val)

-- NOT_IN
(jsonb_exists(e.payload, :key) AND (e.payload->:key->>'value') NOT IN (:vals))
```

**Why key existence check is required:**

Without `jsonb_exists()`:
- Entities missing the attribute would match NOT_EQUALS (NULL != 'value' is NULL/unknown)
- SQL treats NULL as "no match" but conceptually it's different from "has attribute and differs"

With `jsonb_exists()`:
- Only entities that HAVE the attribute and the value differs will match
- Entities missing the attribute are excluded (correct semantics)

**Operators requiring key check:**
- NOT_EQUALS
- NOT_IN

**Operators NOT requiring key check:**
- EQUALS, CONTAINS, STARTS_WITH, ENDS_WITH (missing attribute correctly doesn't match)
- IS_NULL, IS_NOT_NULL (explicitly check for presence/absence)
- Numeric comparisons (CASE expression handles missing values)

### Numeric Comparison Type Safety

**Regex-guarded cast prevents PostgreSQL errors:**

```sql
CASE
    WHEN (e.payload->:key->>'value') ~ '^-?[0-9]+(\.[0-9]+)?$'
    THEN (e.payload->:key->>'value')::numeric > :val
    ELSE false
END
```

**Why regex guard is needed:**

Without regex guard:
- Non-numeric values cause PostgreSQL cast error: `ERROR: invalid input syntax for type numeric: "hello"`
- Query execution fails

With regex guard:
- Non-numeric values silently fail to match (ELSE false)
- Query executes successfully
- Correct semantics: non-numeric values don't match numeric comparisons

**Regex pattern:** `^-?[0-9]+(\.[0-9]+)?$`
- Matches: `123`, `-456`, `78.9`, `-0.123`
- Rejects: `abc`, `12.34.56`, `1e5`, `NaN`

**Value coercion:**
The value parameter is coerced to numeric:
```kotlin
val numericValue = when (value) {
    is Number -> value
    is String -> value.toBigDecimalOrNull() ?: 0
    null -> 0
    else -> value.toString().toBigDecimalOrNull() ?: 0
}
```

### LIKE Pattern Escaping

**Escapes metacharacters to prevent injection:**

```kotlin
private fun escapeLikePattern(value: String): String =
    value
        .replace("\\", "\\\\")   // Backslash first to avoid double-escaping
        .replace("%", "\\%")     // Wildcard "any characters"
        .replace("_", "\\_")     // Wildcard "single character"
```

**Why escape order matters:**

Correct (backslash first):
- Input: `a%b`
- After `\\` escape: `a%b` (no backslashes)
- After `%` escape: `a\%b` (correct)

Incorrect (backslash last):
- Input: `a%b`
- After `%` escape: `a\%b`
- After `\\` escape: `a\\%b` (wrong - escaped the escape)

**SQL ESCAPE clause:**
All LIKE queries use `ESCAPE '\\'` to declare backslash as escape character:
```sql
(e.payload->:key->>'value') ILIKE :val ESCAPE '\\'
```

**Operators using escaping:**
- CONTAINS: `%{escaped}%`
- NOT_CONTAINS: `NOT ... ILIKE %{escaped}%`
- STARTS_WITH: `{escaped}%`
- ENDS_WITH: `%{escaped}`

### Entity Alias Parameterization

**Supports nested relationship filters with custom table aliases:**

Default (root entity):
```kotlin
generator.generate(attrId, EQUALS, "Active", paramGen)
// SQL: e.payload @> :eq_0::jsonb
```

Custom alias (relationship target):
```kotlin
generator.generate(attrId, EQUALS, "Active", paramGen, entityAlias = "t_1")
// SQL: t_1.payload @> :eq_0::jsonb
```

**Why this is needed:**

Relationship filters with TargetMatches generate EXISTS subqueries that JOIN to a target entity table with a different alias:

```sql
EXISTS (
    SELECT 1 FROM entity_relationships r_0
    JOIN entities t_1 ON r_0.target_entity_id = t_1.id
    WHERE r_0.source_entity_id = e.id
      AND r_0.relationship_field_id = :rel_2
      AND t_1.payload @> :eq_3::jsonb  -- References t_1, not e
)
```

The RelationshipSqlGenerator passes `entityAlias = "t_1"` when calling AttributeSqlGenerator for nested filters.

**Default value:** `"e"` preserves backward compatibility with existing callers.

### Empty List Handling

**IN with empty list returns ALWAYS_FALSE:**

```kotlin
if (values.isEmpty()) {
    return SqlFragment.ALWAYS_FALSE  // "1=0"
}
```

**NOT_IN with empty list returns ALWAYS_TRUE:**

```kotlin
if (values.isEmpty()) {
    return SqlFragment.ALWAYS_TRUE  // "1=1"
}
```

**Why:**
- `x IN ()` never matches (empty set)
- `x NOT IN ()` always matches (not in empty set)
- Prevents PostgreSQL syntax errors from empty IN lists

---

## Per-Operator SQL Patterns

### EQUALS

**GIN-optimized containment:**
```sql
e.payload @> '{"attr-uuid": {"value": "Active"}}'::jsonb
```

**Parameters:**
- `eq_N`: JSON string with containment structure

**Edge case:** If value is null, delegates to IS_NULL.

---

### NOT_EQUALS

**Key existence + inequality:**
```sql
(jsonb_exists(e.payload, :key) AND (e.payload->:key->>'value') != :val)
```

**Parameters:**
- `neq_key_N`: Attribute UUID string
- `neq_val_N`: Value as string (toString())

**Edge case:** If value is null, delegates to IS_NOT_NULL.

---

### GREATER_THAN / GREATER_THAN_OR_EQUALS / LESS_THAN / LESS_THAN_OR_EQUALS

**Regex-guarded numeric comparison:**
```sql
CASE
    WHEN (e.payload->:key->>'value') ~ '^-?[0-9]+(\.[0-9]+)?$'
    THEN (e.payload->:key->>'value')::numeric > :val
    ELSE false
END
```

**Parameters:**
- `num_key_N`: Attribute UUID string
- `num_val_N`: Numeric value (coerced from input)

**Non-numeric values:** Fail to match (ELSE false).

---

### IN

**List membership with extraction:**
```sql
(e.payload->:key->>'value') IN (:vals)
```

**Parameters:**
- `in_key_N`: Attribute UUID string
- `in_vals_N`: List of string values

**Value extraction:**
- `List<*>` → used as-is
- Single value → wrapped as single-element list
- `null` → empty list → ALWAYS_FALSE

**Empty list:** Returns `SqlFragment.ALWAYS_FALSE`.

---

### NOT_IN

**Key existence + list non-membership:**
```sql
(jsonb_exists(e.payload, :key) AND (e.payload->:key->>'value') NOT IN (:vals))
```

**Parameters:**
- `nin_key_N`: Attribute UUID string
- `nin_vals_N`: List of string values

**Empty list:** Returns `SqlFragment.ALWAYS_TRUE`.

---

### CONTAINS

**Case-insensitive substring match:**
```sql
(e.payload->:key->>'value') ILIKE :val ESCAPE '\\'
```

**Parameters:**
- `contains_key_N`: Attribute UUID string
- `contains_val_N`: `%{escaped}%` pattern

**Case sensitivity:** ILIKE is case-insensitive.

---

### NOT_CONTAINS

**Case-insensitive substring non-match:**
```sql
NOT ((e.payload->:key->>'value') ILIKE :val ESCAPE '\\')
```

**Parameters:**
- `ncontains_key_N`: Attribute UUID string
- `ncontains_val_N`: `%{escaped}%` pattern

---

### STARTS_WITH

**Case-insensitive prefix match:**
```sql
(e.payload->:key->>'value') ILIKE :val ESCAPE '\\'
```

**Parameters:**
- `starts_key_N`: Attribute UUID string
- `starts_val_N`: `{escaped}%` pattern

---

### ENDS_WITH

**Case-insensitive suffix match:**
```sql
(e.payload->:key->>'value') ILIKE :val ESCAPE '\\'
```

**Parameters:**
- `ends_key_N`: Attribute UUID string
- `ends_val_N`: `%{escaped}` pattern

---

### IS_NULL

**Null or missing attribute check:**
```sql
(e.payload->:key->>'value') IS NULL
```

**Parameters:**
- `isnull_key_N`: Attribute UUID string

**Matches:**
- Missing attribute key (key doesn't exist in payload)
- Explicit JSON null value (`{"attr": {"value": null}}`)

**Why:** PostgreSQL's `->>` operator returns SQL NULL for both cases.

---

### IS_NOT_NULL

**Non-null attribute check:**
```sql
(e.payload->:key->>'value') IS NOT NULL
```

**Parameters:**
- `notnull_key_N`: Attribute UUID string

**Matches:** Entities with attribute key present and non-null value.

---

## Error Handling

### Errors Thrown

None - all operators are supported and invalid inputs produce safe SQL.

### Errors Handled

|Error/Exception|Source|Recovery Strategy|
|---|---|---|
|Non-numeric value in numeric comparison|JSONB value doesn't match regex|CASE returns false (no match)|
|Empty IN/NOT_IN list|Filter validation missed edge case|Return ALWAYS_FALSE/ALWAYS_TRUE|
|Null value for operator|Caller passes null|EQUALS/NOT_EQUALS delegate to IS_NULL/IS_NOT_NULL|

---

## Gotchas & Edge Cases

> [!warning] GIN Index Requires jsonb_path_ops
> The EQUALS operator's `@>` containment check is optimized for GIN indexes with `jsonb_path_ops` opclass:
> ```sql
> CREATE INDEX idx_entities_payload_gin ON entities USING GIN (payload jsonb_path_ops);
> ```
>
> **Without GIN index:** Sequential scan of JSONB payloads (slow for large tables).
>
> **With wrong opclass:** `jsonb_ops` (default) can use the index but less efficiently than `jsonb_path_ops`.

> [!warning] Key Existence Check is Critical for NOT_EQUALS
> NOT_EQUALS without `jsonb_exists()` produces incorrect results:
>
> **Without key check:**
> ```sql
> (e.payload->>'status') != 'Active'
> ```
> - Matches entities missing 'status' attribute (NULL != 'Active' is NULL, treated as no match but returns rows)
>
> **With key check:**
> ```sql
> (jsonb_exists(e.payload, 'status') AND (e.payload->>'status') != 'Active')
> ```
> - Only matches entities WITH 'status' attribute where value differs
>
> **Impact:** Without key check, queries produce unexpected results (missing attributes treated as "not equal").

> [!warning] Numeric Comparison Regex is Strict
> The regex `^-?[0-9]+(\.[0-9]+)?$` accepts standard numeric formats but rejects:
> - Scientific notation: `1e5`, `2.5E-3`
> - Special values: `NaN`, `Infinity`
> - Leading zeros: `01`, `00.5` (actually these match - false alarm)
>
> **Impact:** Entities with non-standard numeric formats won't match numeric comparisons.
>
> **Workaround:** Store numeric values in standard format in JSONB.

> [!warning] ILIKE is Case-Insensitive
> All string matching operators (CONTAINS, STARTS_WITH, ENDS_WITH) use ILIKE (case-insensitive):
>
> - `CONTAINS "corp"` matches "Corporation", "CORP INC", "Acme Corp"
> - `STARTS_WITH "test"` matches "Testing", "TEST", "test"
>
> **For case-sensitive matching:** Use EQUALS operator (containment is case-sensitive).

> [!warning] IN/NOT_IN Convert Values to Strings
> The IN and NOT_IN operators convert all values to strings via `toString()`:
> ```kotlin
> valsParam to values.map { it?.toString() ?: "" }
> ```
>
> **Impact:**
> - Numeric IN: `IN [1, 2, 3]` becomes `IN ("1", "2", "3")`
> - JSONB values are also strings, so comparison works
> - But type coercion may produce unexpected results if JSONB stores numbers as JSON numbers
>
> **Watch out:** Ensure JSONB values are stored as strings for reliable IN/NOT_IN matching.

### Known Limitations

- No support for array operations (check if JSONB array contains value)
- No support for nested JSONB path traversal (only top-level attribute keys)
- No support for scientific notation in numeric comparisons
- CONTAINS/STARTS_WITH/ENDS_WITH are always case-insensitive (no LIKE variant)
- IN/NOT_IN convert values to strings (may have type coercion issues)

### Thread Safety / Concurrency

**Thread-safe** with Spring singleton:
- Singleton Spring bean shared across threads
- Stateless (no mutable fields)
- ObjectMapper is thread-safe
- Each method call is independent
- No synchronization needed

**Concurrency model:**
- Safe for concurrent use across multiple requests
- Each generate() call is pure (no side effects except paramGen counter increment)

---

## Testing

### Unit Test Coverage

- **Location:** `src/test/kotlin/riven/core/service/entity/query/AttributeSqlGeneratorTest.kt`
- **Key scenarios covered:**
  - EQUALS uses GIN containment operator
  - EQUALS with null value delegates to IS_NULL
  - NOT_EQUALS includes key existence check
  - Numeric comparisons use regex-guarded CASE
  - CONTAINS/STARTS_WITH/ENDS_WITH escape LIKE metacharacters
  - IN with empty list returns ALWAYS_FALSE
  - NOT_IN with empty list returns ALWAYS_TRUE
  - NOT_IN includes key existence check
  - IS_NULL matches missing keys and explicit nulls
  - Custom entityAlias appears in generated SQL

### How to Test Manually

1. Create AttributeSqlGenerator with ObjectMapper
2. Create ParameterNameGenerator
3. Call generate() with test operator and value
4. Inspect returned SqlFragment:
   - SQL contains correct operator and structure
   - Parameters map includes bound values
   - Parameter names are unique
5. Verify SQL syntax by running in PostgreSQL

---

## Related

- [[Querying]] - Parent subdomain
- [[AttributeFilterVisitor]] - Main consumer
- [[RelationshipSqlGenerator]] - Sibling generator for relationships
- [[SqlFragment]] - Immutable SQL container
- [[ParameterNameGenerator]] - Unique parameter name generation

---

## Changelog

|Date|Change|Reason|
|---|---|---|
|2026-02-08|Initial documentation|Phase 2 - Entities domain documentation (Plan 02-03)|
