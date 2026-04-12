# Phase 2: Secure Connection Management - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver `CustomSourceConnectionEntity` and the full CRUD surface for Postgres connections, with three shipping-blocker security gates enforced at create/update time: AES-256-GCM credential encryption, SSRF-safe hostname resolution (with DNS-rebinding defense), and verified read-only database role. Ship a dry-run test-connection endpoint, transactional create semantics, soft-delete (no restore), and user-safe error surfaces for credential decryption/corruption failures.

Out of scope (defer to later phases): Postgres schema introspection (Phase 3), column mapping (Phase 3), HikariCP pool management for sync (Phase 3), sync orchestration (Phase 4), connection health service (Phase 6), all UI (Phase 7). The adapter from Phase 1 is not wired into this phase — connections exist as first-class entities before anything uses them for fetch.

</domain>

<decisions>
## Implementation Decisions

### Credential storage shape
- **Single encrypted JSONB blob.** One pair of fields on `CustomSourceConnectionEntity`: `encryptedCredentials: ByteArray` (AES-GCM ciphertext) + `iv: ByteArray` (12-byte GCM IV). Ciphertext wraps a JSON object: `{host, port, database, user, password, sslMode}`.
- No plaintext sensitive metadata on the entity. Host/port/database/sslMode live inside the encrypted blob, not as side columns.
- Plaintext columns retained on the entity: `id`, `workspaceId`, `name` (user-facing label), `connectionStatus`, `keyVersion: Int`, standard `AuditableSoftDeletableEntity` columns, and whatever status/metadata columns the planner decides (e.g., `lastVerifiedAt`, `lastFailureReason` — planner's call).

### Encryption key source
- `RIVEN_CREDENTIAL_ENCRYPTION_KEY` env var, Base64-encoded 32-byte key. Loaded via Spring `@ConfigurationProperties`-style bean. Fail-fast on bean init if missing, malformed, or wrong length.
- Follows the existing `NangoConfigurationProperties` env pattern — planner to colocate credential key loading similarly.
- Key rotation itself is deferred (v2). But ship a `keyVersion: Int` column (default = 1) so a future rotation phase can identify which key decrypts which row without a schema migration.

### Encryption primitive
- AES-256-GCM via `javax.crypto.Cipher` ("AES/GCM/NoPadding"). 12-byte IV, randomly generated per encrypt. 128-bit auth tag. No associated data in v1 (AAD hook can land later if needed).
- New service class `CredentialEncryptionService` (or similar — planner's call on name/package): `encrypt(credentialsJson: String): EncryptedCredentials(ciphertext, iv, keyVersion)` + `decrypt(EncryptedCredentials): String`. Throws typed `CryptoException` on key issues and `DataCorruptionException` on auth-tag failure / malformed ciphertext.

### SSL mode default
- JDBC `sslmode=require` default. User may override to any of `{require, verify-ca, verify-full, prefer}` via the request DTO. `sslmode=disable` not exposed in v1.
- SSL mode is part of the encrypted credentials blob (so it cannot be downgraded by a DB-level attacker who can't decrypt).

### SSRF gate
- **Resolve-once, pin-IP, connect-by-IP.** `InetAddress.getAllByName(host)` returns all resolved IPs. Each IP is checked against blocklist. JDBC URL is rewritten to connect to the resolved IP, not the hostname, so JDBC cannot re-resolve to a different address. TLS SNI + hostname verification still uses the original hostname (set explicitly on the JDBC driver / via connection property).
- **Blocklist (authoritative):**
  - IPv4: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16` (link-local + metadata `169.254.169.254`), `0.0.0.0/8`, `100.64.0.0/10` (CGNAT), multicast `224.0.0.0/4`, broadcast `255.255.255.255`.
  - IPv6: `::1` (loopback), `fe80::/10` (link-local), `fc00::/7` (ULA), IPv4-mapped `::ffff:0:0/96` (unwrap and re-apply IPv4 rules).
  - Leverage `InetAddress.isLoopbackAddress()`, `isLinkLocalAddress()`, `isSiteLocalAddress()`, `isMulticastAddress()` as first pass, then explicit CIDR checks for the rest.
- **Port policy:** no port allowlist. User specifies any port. SSRF gate is IP-based, not port-based. Real Postgres deployments use 5432 / 6432 (pgbouncer) / custom.
- **Error copy:** generic + category. User sees: `"Host not reachable: this address is blocked for security reasons (private/loopback/metadata)."` The specific matching CIDR is NOT disclosed. Full detail goes to server logs.
- No dev/localhost override in v1. Tests use mocked `InetAddress` resolution or Testcontainers with non-blocklisted IPs.

### Read-only role verification
- **SAVEPOINT + attempted write, rolled back.** Within a transaction: `SAVEPOINT ro_check` → attempt a controlled write (e.g. `INSERT INTO pg_temp.__riven_ro_probe VALUES (1)` after creating a temp table in the same transaction, OR a simpler approach: attempt `INSERT INTO information_schema.sql_features VALUES (...)` expecting permission denied). Catch `PSQLException` with SQL state `42501` (insufficient_privilege) → pass. Any other outcome → fail. `ROLLBACK TO SAVEPOINT ro_check`. Planner picks the exact probe target; key point is we test actual effective privileges, not metadata.
- **Scope check (belt + suspenders):** in addition to the probe, query `has_table_privilege(current_user, oid, 'INSERT' | 'UPDATE' | 'DELETE')` across every table in the user's accessible schemas (from `pg_class` joined `pg_namespace` with schemas the role has USAGE on). Reject if *any* write privilege exists anywhere. Mapped tables are unknown at create time, so the check has to be global over what the role can see.
- **Superuser / role-attribute check:** reject if `pg_roles.rolsuper` or `rolcreatedb` or `rolcreaterole` is true for the connecting role.
- **When:** create-time and before every sync run (Phase 4 wires the pre-flight). Phase 2 ships the verifier service; Phase 4 calls it. Lightweight metadata query on each sync is acceptable cost.
- **On failure:** reject the create (return 400, category message: `"Role has write privileges on N tables — read-only role required."` Exact count shown; table names NOT shown to avoid schema disclosure). No entity persisted.

### Transactional gate ordering
- Create flow runs gates in order: SSRF resolve → reachability probe (TCP + auth) → RO verification → persist. All inside one `@Transactional` boundary. Any gate failure = rollback, nothing persisted. Returns 400 with gate-specific category in the error body.
- Encryption happens before persist (the write to DB is already-encrypted bytes).

### API surface
- `POST /api/v1/custom-sources/connections/test` — dry-run. Validates SSRF + auth + RO on provided credentials; returns pass/fail per gate without persisting. UI uses this before Save.
- `POST /api/v1/custom-sources/connections` — create. Re-runs all gates server-side (do not trust prior `/test` result — state could change). Persists only on full success.
- `GET /api/v1/custom-sources/connections` — list workspace-scoped connections (redacted — encrypted fields never surface in response DTOs).
- `GET /api/v1/custom-sources/connections/{id}` — read single (redacted).
- `PATCH /api/v1/custom-sources/connections/{id}` — update. Re-run full gate chain if any of `{host, port, user, password, database}` changed. Cosmetic changes (name, any not-yet-introduced display fields) skip verification. SSL mode change triggers re-verification (part of connection security posture).
- `DELETE /api/v1/custom-sources/connections/{id}` — soft-delete. Sets `deleted=true` via `SoftDeletable`. No restore endpoint in v1 (deferred). Encrypted credentials remain in the row pending hard-delete lifecycle (separate concern).
- All endpoints `@PreAuthorize`-gated at service layer on workspace membership (matches existing `IntegrationController` pattern — controller thin, service enforces).

### Response DTO redaction
- Request DTOs carry plaintext credentials (`CreateCustomSourceConnectionRequest`, `UpdateCustomSourceConnectionRequest`). Use `@field:ToString(exclude = ...)` or Kotlin `data class` with explicit `toString` that never emits credential fields — never leak through `logger.info("Received $request")`.
- Response DTOs (`CustomSourceConnectionModel`) surface: `id`, `workspaceId`, `name`, `host`, `port`, `database`, `user`, `sslMode`, `connectionStatus`, `lastVerifiedAt`, audit columns. Password, encrypted blob, IV, key version NEVER on response DTO. Host/port/db/user/sslMode are OK to surface in responses (they are user-provided identifiers, not secrets; decryption happens in service and populates DTO).

### Credential decryption failure UX (SEC-05, SEC-06)
- Two distinct failures surfaced via `ConnectionStatus`:
  - `CryptoException` (key issue — missing, wrong length, not base64): `ConnectionStatus = FAILED`, user-facing message `"Configuration error — contact support."` Server logs: full stack trace, NO key material, NO plaintext credentials.
  - `DataCorruptionException` (GCM auth tag mismatch, malformed ciphertext): `ConnectionStatus = FAILED`, user-facing message `"Stored credentials are unreadable — please re-enter the password to restore this connection."` + PATCH surface to let user re-submit credentials without rebuilding the connection from scratch.
- These surfaces land in `GET /connections/{id}` and the (Phase 6) health endpoint. Phase 2 ships the status transitions; Phase 6 ships the health endpoint view.

### Log redaction (Claude's Discretion — constraints below)
- Must prevent any path from logging: raw `postgresql://...` URLs, `jdbc:postgresql://...` URLs, request DTOs with password fields, exception messages containing credentials (JDBC driver is notorious for including the URL in `SQLException.getMessage()`).
- Minimum: a regex-based log scrubber (Logback pattern converter or TurboFilter) that masks any substring matching `(postgresql|jdbc:postgresql)://[^\s]+` and `password=[^\s&]+`. Applied globally to the root logger so third-party code (JDBC driver, HikariCP exceptions) is covered.
- Secondary defense: `CredentialEncryptionService` / connection service method parameters marked so their `toString` never emits credential fields. Exception wrapping in the connection service strips URLs before re-throwing.
- Planner picks Logback-converter vs TurboFilter based on which cleanly scrubs third-party exception messages — both are acceptable.

### Testing scope for Phase 2
- **Unit:** SSRF validator (every blocklist CIDR, IPv4 + IPv6 + mapped + hostname resolving to blocklisted IP), encryption service (round-trip, wrong-key, corrupted-tag), RO verifier with mocked JDBC (privilege-denied state-code match, grant detection, superuser rejection), redaction regex.
- **Integration (Testcontainers Postgres):** RO verification against a real superuser role (expect reject), against a read-only role (expect pass), SAVEPOINT rollback leaves no residue. Credential round-trip through JPA with real `bytea` columns. Connection creation end-to-end with mocked SSRF for public IP.
- **Controller (MockMvc):** workspace-scoping via `@WithUserPersona` (create/read/update/delete across workspaces), request validation (missing fields, bad port ranges), redaction of credentials in response DTOs.
- **Log assertion test:** capture appender, trigger an error path that would emit a URL, assert the URL is masked.

### Claude's Discretion
- Exact exception class names and package placement (`CryptoException`, `DataCorruptionException`, `SsrfRejectedException`, `ReadOnlyVerificationException`). Planner decides whether these extend the Phase 1 `AdapterException` tree or a new `ConnectionException` tree.
- Precise SAVEPOINT probe target (temp table INSERT vs. `information_schema` write attempt vs. something else well-defined).
- Entity column layout beyond the core decisions (e.g., do we add `lastVerifiedAt`, `lastFailureReason` columns now or defer to Phase 6).
- Logback redaction mechanism (pattern converter vs TurboFilter vs custom Appender wrapper).
- DTO request/response naming and package placement.
- Whether the `/test` endpoint returns per-gate pass/fail booleans or a single aggregated status with category.
- Whether to log RO verification success (for audit) or stay silent.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `entity/util/AuditableSoftDeletableEntity.kt` — base class. `CustomSourceConnectionEntity` extends this. Auto-filtered via `@SQLRestriction("deleted = false")`.
- `entity/integration/IntegrationConnectionEntity.kt` — structural template. JSONB column pattern (`@Type(JsonBinaryType::class)`, `columnDefinition = "jsonb"`), workspace scoping, `ConnectionStatus` field, `toModel()` conversion.
- `enums/integration/ConnectionStatus.kt` — 8-state enum with `canTransitionTo()` state-machine. Reused directly for `CustomSourceConnectionEntity.connectionStatus`. SEC-05 and SEC-06 transition to `FAILED` via its rules.
- `filter/integration/NangoWebhookHmacFilter.kt` — crypto primitive reference. Shows `javax.crypto.Mac` + `SecretKeySpec` + env-var-backed `@ConfigurationProperties`. Our AES-GCM service mirrors the config-properties style but uses `Cipher` instead of `Mac`.
- `controller/integration/IntegrationController.kt` — controller pattern reference. Thin delegation, `@Tag`, `@Operation`, `@ApiResponses`, `@Valid`, `ResponseEntity<T>`, `@PreAuthorize` at service layer.
- `configuration/util/LoggerConfig.kt` — KLogger bean (prototype-scoped, no static loggers). Reuse for all Phase 2 services.
- `enums/integration/SourceType.kt` — `CUSTOM_SOURCE` enum value confirmed added in Phase 1.
- Phase 1 adapter exception tree (`AdapterException` sealed hierarchy) — planner evaluates whether Phase 2 connection exceptions join this tree or form a sibling tree.

### Established Patterns
- Package layout: `service/{domain}/`, `entity/{domain}/`, `models/{domain}/`, `enums/{domain}/`, `controller/{domain}/`. Phase 2 domain = `customsource` (or `custom-source` — planner picks convention consistent with directory naming elsewhere).
- JPA entity ↔ domain model via `toModel()` conversion methods on the entity. Keep credentials out of `toModel()` output entirely; caller passes a decrypted credential object separately where needed.
- `@ConfigurationProperties` + env-var binding for service-level secrets (Nango pattern). Credential encryption key loads this way.
- Testcontainers for JPA integration tests — H2 incompatible with jsonb / custom column types.
- Factory pattern for tests under `service/util/factory/` — add `CustomSourceConnectionEntityFactory`.
- `@WithUserPersona` for `@PreAuthorize`-gated test methods.
- Service-layer `@PreAuthorize`, not controller-layer.

### Integration Points
- Downstream: Phase 3 `PostgresAdapter` reads a decrypted `CustomSourceConnectionEntity` to build its HikariCP datasource. Phase 4 sync workflow calls `ReadOnlyRoleVerifierService` as a pre-flight activity.
- Downstream: Phase 6 `CustomSourceHealthService` reads `ConnectionStatus` transitions written by Phase 2 (create-time + sync-time) and Phase 4 (sync failures).
- Downstream: Phase 7 UI consumes response DTOs (which must not include encrypted fields or passwords).
- Upstream: Phase 1 `SourceType.CUSTOM_SOURCE` is the conceptual link — new entity types created in Phase 3 will set `sourceType=CUSTOM_SOURCE`, traceable back to the `CustomSourceConnectionEntity` created here.

### Gaps (Phase 2 builds these)
- **No existing AES/GCM encryption helper** — build `CredentialEncryptionService` from scratch, mirror `NangoConfigurationProperties` env loading.
- **No SSRF / InetAddress validator** — build `SsrfValidator` (or similar). No existing hostname/IP validation anywhere in the codebase.
- **No log redaction mechanism** — build regex-based Logback scrubber (pattern converter or TurboFilter). First global log-secret-redaction in the codebase.
- **No RO-role verifier for external DBs** — build `ReadOnlyRoleVerifier`. Uses short-lived JDBC connection (not HikariCP-cached — that's Phase 3); closes immediately after verify.

</code_context>

<specifics>
## Specific Ideas

- The `/test` endpoint is explicitly a UX affordance for Phase 7's mapping flow later — the backend still re-runs every gate on `POST /connections`. Never trust a prior `/test` result on create; DNS, role grants, and network reachability can change between calls.
- "Resolve-once, pin-IP, connect-by-IP" is the ship-hard DNS-rebinding defense. The subtlety is TLS: JDBC must send SNI and do cert hostname verification using the *original* hostname, not the IP. Planner must verify the Postgres JDBC driver properties (`sslhostnameverifier`, `sslpasswordcallback`, or equivalent) support this pattern cleanly. If not, fall back to "resolve, validate, re-resolve inside connect" with a note in the plan.
- RO-verifier uses a short-lived JDBC connection (not HikariCP-cached — that's Phase 3). Open connection → probe → close. Keeps verify independent of the sync pool.
- Do not log RO-verification exceptions verbatim — JDBC exceptions may include the full connection URL. Wrap and sanitize before any `logger.error(...)`.
- Blocking `0.0.0.0/8` and CGNAT (`100.64.0.0/10`) and multicast is belt-and-suspenders beyond REQUIREMENTS.md text; REQUIREMENTS.md lists the essentials, but shipping-blocker-grade SSRF blocks the full set.
- The `keyVersion: Int` column is unused in v1 (always = 1) but lands now so rotation is a data-only migration in v2, not a schema change.

</specifics>

<deferred>
## Deferred Ideas

- **Connection restore endpoint** — Notion-style trash/recovery UX (per user memory `project_deletion_recovery.md`). Post-v1, covered by deletion recovery feature.
- **Credential key rotation** — v2 track. `keyVersion` column lands now as a hook.
- **Supabase vault / external secret manager** — v2 security hardening (SECV2-01).
- **SSH tunnel / agent-based connection topology** — v2 (SECV2-03, SECV2-04).
- **Dev-profile localhost override for SSRF** — if local testing friction appears, revisit. For now, tests mock `InetAddress` resolution or use Testcontainers with non-blocklisted IPs.
- **Per-gate pass/fail response shape on `/test`** — planner may ship as aggregate first; granular per-gate booleans a possible later UX improvement.
- **Audit logging of RO-verification successes** — compliance track, not v1.
- **Associated data (AAD) in AES-GCM** — v1 uses no AAD. If we later want to bind ciphertext to connection ID or workspace ID, AAD is the hook.

</deferred>

---

*Phase: 02-secure-connection-management*
*Context gathered: 2026-04-12*
