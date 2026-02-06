# Domain Pitfalls: Entity Query System

**Domain:** JSONB Query System with SQL Generation
**Researched:** 2026-02-01
**Confidence:** HIGH (verified via official PostgreSQL docs, security references, and codebase analysis)

---

## Critical Pitfalls

Mistakes that cause security vulnerabilities, data corruption, or require architectural rewrites.

---

### Pitfall 1: SQL Injection via Dynamic Query Building

**What goes wrong:** Building SQL strings through concatenation instead of parameterization, especially for JSONB operators where the syntax looks "safe" because it's inside JSON.

**Why it happens:**
- JSONB operators (`->`, `->>`, `@>`, `?`) look like they're just data access
- Dynamic WHERE clauses with user-provided field names seem innocuous
- JSON-based SQL injection can bypass WAFs that don't understand JSONB operators
- Developers assume ORM/JPA protection extends to native queries

**Consequences:**
- Full database compromise
- Data exfiltration across tenant boundaries
- Bypassing RLS entirely (queries run as service user)
- [WAFs historically did not inspect JSON syntax](https://claroty.com/team82/research/js-on-security-off-abusing-json-based-sql-to-bypass-waf) - attackers could construct tautologies like `'{"a":1}' @> '{"a":1}'` without using `=`

**Your specific risk:** Entity payloads use UUID keys (e.g., `payload->>'550e8400-e29b-41d4-a716-446655440000'`). If attribute keys come from user input and aren't validated, attackers could inject: `'550e8400...' OR 1=1--`

**Prevention:**
1. **Never concatenate user input into SQL** - even for JSON path expressions
2. **Whitelist attribute keys** - validate that user-provided attribute UUIDs exist in the entity type schema before using them in queries
3. **Use parameterized queries for values** - `payload->>:attributeKey = :value` where both are bound parameters
4. **For dynamic paths, use jsonb_path_query** with parameterized variables instead of string building
5. **Implement SQL builder abstraction** that only accepts validated schema keys

**Detection (warning signs):**
- String concatenation in SQL: `"payload->>'$attributeKey'"`
- User-controlled values in JSONB path expressions
- Native queries built without `@Param` annotations
- Tests that don't include injection payloads

**Phase mapping:** Phase 1 (Query Builder Foundation) - must be baked into the core SQL generation layer from day one.

**Sources:**
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Baeldung: SQL Injection Prevention](https://www.baeldung.com/sql-injection)
- [Team82 JSON-Based WAF Bypass](https://claroty.com/team82/research/js-on-security-off-abusing-json-based-sql-to-bypass-waf)

---

### Pitfall 2: GIN Index Not Used (Query Planner Ignores Index)

**What goes wrong:** You have a GIN index on the `payload` column (confirmed in schema.sql: `idx_entities_payload_gin using gin (payload jsonb_path_ops)`), but queries fall back to sequential scans.

**Why it happens:**
1. **Wrong operator class:** `jsonb_path_ops` only supports `@>` (containment) and `@?`/`@@` (jsonpath). It does NOT support `?` (key exists), `?|`, `?&` operators - those require default `jsonb_ops`
2. **Using unsupported operators:** `->>'key' = 'value'` does NOT use GIN indexes. Only `payload @> '{"key": "value"}'::jsonb` does
3. **Query planner statistics:** [PostgreSQL gathers limited statistics for JSONB](https://vsevolod.net/postgresql-jsonb-index/) - if top-level keys appear in most rows, planner may choose seq scan
4. **Bitmap scan overhead:** GIN only supports Bitmap Index Scans, not direct Index Scans - for small result sets this may not win

**Consequences:**
- Queries that should be milliseconds take seconds
- Paying index maintenance cost (write slowdown) without query benefit
- "It works in dev, fails in prod" - performance cliff at scale
- [GIN indexes can reach 60-80% of table size](https://pganalyze.com/blog/gin-index) with `jsonb_ops`

**Your specific risk:** Your index uses `jsonb_path_ops`, which is smaller and faster but only works with containment queries. If the query builder generates `->>` extractions for equality checks, the index is useless.

**Prevention:**
1. **Match query patterns to index type:**
   - For `jsonb_path_ops`: Use `payload @> '{"uuid-key": "value"}'::jsonb`
   - For equality: Consider B-tree expression index on specific keys
2. **Create expression indexes for frequently queried attributes:**
   ```sql
   CREATE INDEX idx_entity_name ON entities ((payload->>'name-uuid'));
   ```
3. **Run EXPLAIN ANALYZE on all generated queries** during testing
4. **Add monitoring for slow queries** that should hit indexes

**Detection (warning signs):**
- EXPLAIN shows "Seq Scan" on entities table
- Queries using `->>` operator for filtering
- Queries using `?` (key exists) with `jsonb_path_ops` index
- Write performance degrades without corresponding query improvement

**Phase mapping:** Phase 1 (Query Builder) for operator selection; Phase 2 (Integration) for index strategy validation.

**Sources:**
- [Crunchy Data: Indexing JSONB](https://www.crunchydata.com/blog/indexing-jsonb-in-postgres)
- [pganalyze: Understanding GIN Indexes](https://pganalyze.com/blog/gin-index)
- [Pitfalls of JSONB indexes](https://vsevolod.net/postgresql-jsonb-index/)

---

### Pitfall 3: Workspace Isolation Bypass in Generated SQL

**What goes wrong:** Query system generates SQL that doesn't include workspace_id filtering, or allows cross-workspace data access through relationship traversal.

**Why it happens:**
- Relying solely on RLS for tenant isolation (RLS is evaluated per-row, adds overhead)
- Relationship joins that traverse to entities in other workspaces
- Complex queries where workspace filter gets lost in nested conditions
- Testing with single-tenant data doesn't catch isolation failures

**Consequences:**
- Data breach across tenants
- Compliance violations (GDPR, SOC2)
- Complete loss of multi-tenant isolation guarantees
- RLS can be bypassed if queries run as superuser or with `BYPASSRLS`

**Your specific risk:** Polymorphic relationships (`allowPolymorphic: true`, `entityTypeKeys: ["client", "partner"]`) could traverse to entity types that exist in other workspaces if workspace_id isn't enforced at every join.

**Prevention:**
1. **Mandatory workspace_id in every generated query** - not just the root entity
2. **Query builder enforces workspace scope** at construction time, not as an afterthought
3. **Relationship traversal must re-verify workspace** at each hop:
   ```sql
   -- Wrong: assumes target is in same workspace
   JOIN entities e2 ON e2.id = er.target_id

   -- Right: explicit workspace check
   JOIN entities e2 ON e2.id = er.target_id AND e2.workspace_id = :workspaceId
   ```
4. **Integration tests with multi-workspace data** - verify isolation
5. **Audit logging** for any query that returns entities from multiple workspaces

**Detection (warning signs):**
- Generated SQL without `workspace_id = ?` clause
- JOINs to related entities without workspace filtering
- Tests that only use single workspace
- RLS policies as the only isolation mechanism

**Phase mapping:** Phase 1 (Query Builder) - workspace scoping must be architectural, not optional.

**Sources:**
- [AWS: Multi-tenant data isolation with RLS](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/)
- [Crunchy Data: RLS for Tenants](https://www.crunchydata.com/blog/row-level-security-for-tenants-in-postgres)

---

### Pitfall 4: Unbounded Relationship Traversal (N+1 and Query Explosion)

**What goes wrong:** Nested relationship queries expand exponentially or execute as N+1 queries, crushing database performance.

**Why it happens:**
- Each relationship depth adds another JOIN or subquery
- Polymorphic relationships multiply query complexity (one relationship targets multiple entity types)
- No depth limits on traversal
- Naive implementation fetches relationships one-by-one

**Consequences:**
- Single query generates 100s of database round-trips
- Memory exhaustion from unbounded result sets
- [N+1 pattern can be 10x slower](https://planetscale.com/blog/what-is-n-1-query-problem-and-how-to-solve-it) than proper JOINs
- DoS potential from malicious query depth

**Your specific risk:** With bidirectional polymorphic relationships, a query like "all projects with their clients with their projects with their clients..." could recurse infinitely.

**Prevention:**
1. **Hard depth limit** on relationship traversal (e.g., max 3 levels)
2. **Batch relationship fetching** - collect all IDs at each level, fetch in single query
3. **Use CTEs for recursive traversal** instead of N+1 queries
4. **Query complexity budget** - estimate cost before execution
5. **Pagination at every level** of nested results

**Detection (warning signs):**
- Query execution time grows non-linearly with data
- Database connection pool exhaustion
- Memory spikes during relationship-heavy queries
- Tests that only use shallow relationship structures

**Phase mapping:** Phase 2 (Relationship Traversal) - explicit design decision needed before implementing nested queries.

**Sources:**
- [PlanetScale: N+1 Problem](https://planetscale.com/blog/what-is-n-1-query-problem-and-how-to-solve-it)
- [Use The Index, Luke: N+1 Problem](https://use-the-index-luke.com/sql/join/nested-loops-join-n1-problem)

---

## Moderate Pitfalls

Mistakes that cause performance degradation, technical debt, or user-facing bugs.

---

### Pitfall 5: UUID Key Type Mismatch (Text vs Native UUID)

**What goes wrong:** JSONB stores UUIDs as strings (JSON has no UUID type). Comparisons become slow and case-sensitive when they shouldn't be.

**Why it happens:**
- JSON specification has no UUID type
- `payload->>'uuid-key'` returns text, not UUID
- Comparing text UUIDs to native UUIDs requires casting
- Case sensitivity: `'EF9F94DA-...' != 'ef9f94da-...'` in text comparison

**Consequences:**
- [Text comparison is slower](https://www.jacoelho.com/blog/2021/06/postgresql-uuid-vs-text/) than native UUID comparison
- Subtle bugs from case-sensitivity mismatches
- Index utilization issues when types don't match
- [Tables using text for UUIDs are 54% larger](https://www.jacoelho.com/blog/2021/06/postgresql-uuid-vs-text/)

**Your specific risk:** Entity payload uses `Map<UUID, EntityAttribute>` in domain model but JSONB stores keys as strings. Queries must consistently handle this.

**Prevention:**
1. **Always cast to UUID for comparisons:**
   ```sql
   (payload->>'attribute-key')::uuid = :paramUuid
   ```
2. **Normalize UUID case** on input (lowercase canonical form)
3. **Consider extracting frequently-queried UUIDs** into native UUID columns
4. **Query builder should handle casting** automatically for UUID-typed attributes

**Detection (warning signs):**
- Queries with UUID comparisons returning unexpected results
- Case-related bugs in entity lookups
- Type mismatch errors in parameter binding
- Performance degradation on UUID equality checks

**Phase mapping:** Phase 1 (Query Builder) - type handling must be consistent from the start.

**Sources:**
- [PostgreSQL UUID vs TEXT](https://www.jacoelho.com/blog/2021/06/postgresql-uuid-vs-text/)
- [Cybertec: UUID Downsides](https://www.cybertec-postgresql.com/en/unexpected-downsides-of-uuid-keys-in-postgresql/)

---

### Pitfall 6: NULL Handling in Expression Evaluation

**What goes wrong:** Three-valued logic (TRUE/FALSE/NULL) produces unexpected query results when JSONB values are null or missing.

**Why it happens:**
- `payload->>'missing-key'` returns NULL, not an error
- `NULL = 'value'` is NULL (unknown), not FALSE
- `NULL AND TRUE` is NULL, `NULL OR TRUE` is TRUE
- [Comparisons to NULL are never true or false](https://modern-sql.com/concept/null) - they're unknown

**Consequences:**
- Filters exclude rows unexpectedly (missing field treated as non-match)
- OR conditions behave strangely with nulls
- NOT conditions don't invert as expected
- Aggregations skip NULL values silently

**Your specific risk:** Optional attributes in entity schemas will be missing from payload. Queries like `payload->>'optional-field' != 'bad-value'` won't match entities where the field is missing.

**Prevention:**
1. **Explicit NULL handling in query builder:**
   ```sql
   -- Instead of: payload->>'field' = 'value'
   -- Use: COALESCE(payload->>'field', '') = 'value'
   -- Or: payload ? 'field' AND payload->>'field' = 'value'
   ```
2. **Document null semantics** for each operator (EQUALS, NOT_EQUALS, IN, etc.)
3. **"IS NULL" and "IS NOT NULL" as explicit operators** in expression language
4. **Test with sparse payloads** - entities missing optional fields

**Detection (warning signs):**
- Queries returning fewer results than expected
- NOT filters producing unexpected results
- Aggregations with surprising counts
- Different results between JSONB `@>` and `->>` operators for same data

**Phase mapping:** Phase 1 (Expression System) - null semantics must be defined upfront in the expression model.

**Sources:**
- [Modern SQL: NULL Semantics](https://modern-sql.com/concept/null)
- [Databricks: NULL Semantics](https://docs.databricks.com/aws/en/sql/language-manual/sql-ref-null-semantics)

---

### Pitfall 7: Query Timeout and Resource Exhaustion

**What goes wrong:** Complex queries run indefinitely, consuming database resources and blocking other operations.

**Why it happens:**
- No statement timeout configured
- Complex JOINs across large tables
- Missing indexes on filter columns
- Recursive CTEs without depth limits
- [Default statement_timeout is 0 (no limit)](https://www.crunchydata.com/blog/control-runaway-postgres-queries-with-statement-timeout)

**Consequences:**
- Database connection pool exhaustion
- DoS vulnerability (attacker crafts expensive query)
- "Runaway queries" lock tables
- Resource contention affects all tenants

**Your specific risk:** Dynamic queries with arbitrary filter combinations could hit pathological query plans, especially with polymorphic relationships.

**Prevention:**
1. **Set statement_timeout for query service:**
   ```sql
   SET statement_timeout = '30s';
   ```
2. **Query complexity analysis** before execution - estimate JOIN cardinality
3. **Pagination required** - no unbounded result sets
4. **Connection pool with query timeout** at application level
5. **Circuit breaker** for queries exceeding threshold

**Detection (warning signs):**
- Queries taking > 10 seconds
- Connection pool warnings
- Database CPU spikes during query execution
- Lock wait timeouts

**Phase mapping:** Phase 3 (Query Execution) - timeout handling at execution layer.

**Sources:**
- [Crunchy Data: Control Runaway Queries](https://www.crunchydata.com/blog/control-runaway-postgres-queries-with-statement-timeout)
- [PostgreSQL: Statement Timeout](https://www.postgresql.org/docs/current/runtime-config-client.html)

---

### Pitfall 8: Polymorphic Type Discrimination Failures

**What goes wrong:** Queries against polymorphic relationships return wrong entity types or fail to filter by type correctly.

**Why it happens:**
- No type discriminator in relationship traversal
- Entity type key not included in JOIN conditions
- Mixing entities of different types in results without indication
- Schema differences between target types not handled

**Consequences:**
- Wrong entities returned (Project when expecting Client)
- Schema validation failures on heterogeneous results
- Missing data when type-specific fields aren't present
- Confusing API responses mixing different shapes

**Your specific risk:** `EntityRelationshipDefinition.entityTypeKeys` can contain multiple types (["client", "partner"]). Relationship queries must handle this correctly.

**Prevention:**
1. **Always include type_key in relationship JOINs:**
   ```sql
   JOIN entities e ON e.id = rel.target_id AND e.type_key IN (:allowedTypes)
   ```
2. **Return type discriminator in results** so consumers know what they got
3. **Schema projection per type** - only return fields valid for each type
4. **Query builder validates target types** against relationship definition

**Detection (warning signs):**
- API responses with unexpected entity structures
- Client-side schema validation failures
- Queries returning more entity types than expected
- Type casting errors in result mapping

**Phase mapping:** Phase 2 (Relationship Traversal) - polymorphic handling must be explicit.

---

## Minor Pitfalls

Mistakes that cause developer friction, minor bugs, or code quality issues.

---

### Pitfall 9: Dynamic Sort/Order By Injection

**What goes wrong:** User-controlled sort columns allow SQL injection even with prepared statements.

**Why it happens:**
- ORDER BY clauses can't be parameterized in standard SQL
- Older Spring Data versions allowed arbitrary expressions
- Developers assume whitelist isn't needed for "just sorting"

**Consequences:**
- SQL injection through sort parameter
- Information disclosure via error messages
- Query plan manipulation

**Prevention:**
1. **Whitelist sortable columns** against entity type schema
2. **Map user field names to internal column paths**
3. **Use JpaSort.unsafe() consciously** (name indicates risk)
4. **Validate sort direction** (ASC/DESC only)

**Detection (warning signs):**
- Sort parameter used directly in query
- No validation on sort column names
- Error messages exposing SQL structure

**Phase mapping:** Phase 1 (Query Builder) - sort handling in expression layer.

**Sources:**
- [JDriven: Prepared Statement Not Enough](https://blog.jdriven.com/2017/10/sql-injection-prepared-statement-not-enough/)

---

### Pitfall 10: GIN Index Write Performance Degradation

**What goes wrong:** Heavy write workloads slow down as GIN index maintenance accumulates.

**Why it happens:**
- [GIN index updates are slow by design](https://www.postgresql.org/docs/current/gin.html) (inverted index structure)
- `fastupdate` defers index maintenance to pending list
- Pending list cleanup causes write pauses
- Each entity update touches multiple index entries

**Consequences:**
- INSERT/UPDATE latency spikes
- Autovacuum contention
- Read performance degrades when pending list is large
- [Query planner may skip index](https://medium.com/google-cloud/jsonb-and-gin-index-operators-in-postgresql-cea096fbb373) when pending tuples accumulate

**Prevention:**
1. **Monitor gin_pending_list_limit** and adjust based on workload
2. **Schedule maintenance during low-traffic periods**
3. **Consider partial indexes** (only index what you query)
4. **Benchmark write performance** under realistic load

**Detection (warning signs):**
- INSERT/UPDATE latency increasing over time
- `pgstatginindex` showing high pending pages/tuples
- Autovacuum running frequently on entities table
- Write throughput dropping at scale

**Phase mapping:** Post-MVP (Performance Optimization) - measure before optimizing.

**Sources:**
- [PostgreSQL: GIN Indexes](https://www.postgresql.org/docs/current/gin.html)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Expression System | SQL injection in query builder | Parameterize everything; whitelist schema keys |
| Expression System | NULL handling | Define explicit null semantics per operator |
| Relationship Traversal | N+1 queries | Batch loading; CTE-based traversal |
| Relationship Traversal | Workspace isolation bypass | Workspace filter at every JOIN |
| Relationship Traversal | Polymorphic type confusion | Type discriminator in all queries |
| Query Execution | GIN index not used | Match operators to index type (jsonb_path_ops = @>) |
| Query Execution | Query timeout | Set statement_timeout; implement circuit breaker |
| API Layer | Dynamic sort injection | Whitelist sortable fields |
| Performance | GIN write overhead | Monitor pending list; consider partial indexes |

---

## Verification Checklist

Before shipping the Entity Query System:

- [ ] All user input parameterized (no string concatenation in SQL)
- [ ] Schema attribute keys validated before use in queries
- [ ] Workspace ID enforced at every query level and JOIN
- [ ] Relationship traversal depth limited (max 3 recommended)
- [ ] NULL handling documented and tested for each operator
- [ ] EXPLAIN ANALYZE run on representative queries (verify index usage)
- [ ] Statement timeout configured (30-60s recommended)
- [ ] Multi-tenant isolation tested with cross-workspace data
- [ ] Sort columns whitelisted against schema
- [ ] N+1 query patterns eliminated (batch loading implemented)

---

## Sources Summary

**Security:**
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Baeldung: SQL Injection and Prevention](https://www.baeldung.com/sql-injection)
- [Team82: JSON-Based WAF Bypass](https://claroty.com/team82/research/js-on-security-off-abusing-json-based-sql-to-bypass-waf)
- [Spring SQL Injection Guide](https://www.stackhawk.com/blog/sql-injection-prevention-spring/)

**Performance - GIN/JSONB:**
- [Crunchy Data: Indexing JSONB](https://www.crunchydata.com/blog/indexing-jsonb-in-postgres)
- [pganalyze: Understanding GIN Indexes](https://pganalyze.com/blog/gin-index)
- [Pitfalls of JSONB indexes](https://vsevolod.net/postgresql-jsonb-index/)
- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)

**Multi-Tenancy:**
- [AWS: Multi-tenant RLS](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/)
- [Crunchy Data: RLS for Tenants](https://www.crunchydata.com/blog/row-level-security-for-tenants-in-postgres)

**Query Patterns:**
- [PlanetScale: N+1 Problem](https://planetscale.com/blog/what-is-n-1-query-problem-and-how-to-solve-it)
- [Crunchy Data: Statement Timeout](https://www.crunchydata.com/blog/control-runaway-postgres-queries-with-statement-timeout)
- [PostgreSQL UUID vs TEXT](https://www.jacoelho.com/blog/2021/06/postgresql-uuid-vs-text/)
