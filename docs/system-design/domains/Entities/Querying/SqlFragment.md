---
tags:
  - layer/utility
  - component/active
  - architecture/component
Created: 2026-02-08
Updated: 2026-02-08
Domains:
  - "[[Entities]]"
---
# SqlFragment

Part of [[Querying]]

## Purpose

Immutable value object holding parameterized SQL clause and parameter map, enabling safe SQL composition without mutation.

---

## Responsibilities

- Hold SQL string with named parameter placeholders (e.g., `:param_0`)
- Hold parameter values for binding during query execution
- Provide composition methods (and, or, wrap) that return new immutable instances
- Prevent SQL injection via parameterized queries
- Avoid parameter name collisions via unique naming

---

## Dependencies

None (pure data class)

## Used By

- [[AttributeFilterVisitor]] — Combines fragments with AND/OR logic
- [[AttributeSqlGenerator]] — Returns fragments for attribute filters
- [[RelationshipSqlGenerator]] — Returns fragments for relationship subqueries
- [[EntityQueryAssembler]] — Final query assembly
- [[EntityQueryService]] — Executes assembled fragments

---

## Key Logic

**Immutability:**

All composition methods return NEW instances, never mutate original. Enables safe reuse and composition.

**Composition methods:**

- `and(other)`: `(this.sql) AND (other.sql)` with merged parameters
- `or(other)`: `(this.sql) OR (other.sql)` with merged parameters
- `wrap(prefix, suffix)`: wraps SQL with strings, preserves parameters

**Companion constants:**

- `ALWAYS_TRUE = SqlFragment("1=1", emptyMap())` — For empty AND combinations (vacuous truth)
- `ALWAYS_FALSE = SqlFragment("1=0", emptyMap())` — For empty OR combinations (no match)

---

## Public Methods

### `and(other: SqlFragment): SqlFragment`

Combines this fragment with another using AND logic. Parameters from both fragments merged.

### `or(other: SqlFragment): SqlFragment`

Combines this fragment with another using OR logic. Parameters from both fragments merged.

### `wrap(prefix: String, suffix: String): SqlFragment`

Wraps SQL with prefix and suffix. Useful for EXISTS subqueries. Parameters unchanged.

---

## Gotchas

- **Immutable:** Composition methods return NEW instances, original unchanged
- **Parameter merging:** Map merge via `+` operator, later values overwrite earlier (shouldn't happen with unique param names)
- **No SQL validation:** Class doesn't validate SQL syntax, just holds strings

---

## Related

- [[ParameterNameGenerator]] — Ensures parameter names are unique
- [[AttributeFilterVisitor]] — Uses fragments for composition
- [[Querying]] — Parent subdomain
