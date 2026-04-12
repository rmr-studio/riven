# Phase 2: Secure Connection Management - Research

**Researched:** 2026-04-12
**Domain:** Spring Boot / Kotlin — JPA entity lifecycle, AES-256-GCM crypto, SSRF/DNS-rebinding protection, Postgres JDBC RO verification, Logback log redaction
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Credential storage shape:** Single encrypted JSONB blob. Plaintext fields on entity: `id`, `workspaceId`, `name`, `connectionStatus`, `keyVersion: Int`, audit columns. No plaintext host/port/db/user/password side columns. Encrypted blob wraps JSON: `{host, port, database, user, password, sslMode}`.
- **Encryption key source:** `RIVEN_CREDENTIAL_ENCRYPTION_KEY` env var, Base64-encoded 32-byte key, loaded via `@ConfigurationProperties`. Fail-fast on bean init if missing, malformed, or wrong length.
- **Encryption primitive:** AES-256-GCM via `javax.crypto.Cipher` ("AES/GCM/NoPadding"). 12-byte IV, 128-bit auth tag, no AAD in v1.
- **Encryption service:** `CredentialEncryptionService` with `encrypt()` / `decrypt()`. Throws `CryptoException` on key issues, `DataCorruptionException` on auth-tag failure.
- **SSL mode default:** `sslmode=require`. User may override to `require | verify-ca | verify-full | prefer`. `sslmode=disable` not exposed.
- **SSRF gate:** Resolve-once, pin-IP, connect-by-IP. Full blocklist (IPv4 + IPv6) documented in CONTEXT.md. No port allowlist. Generic error copy (no CIDR disclosure to user).
- **Read-only role verification:** SAVEPOINT + attempted write + rollback. Plus `has_table_privilege()` sweep and superuser/rolcreatedb/rolcreaterole attribute check. Reject if any write privilege found.
- **Transactional gate ordering:** SSRF resolve → reachability probe → RO verification → persist. All inside one `@Transactional` boundary.
- **API surface:** POST /test, POST, GET (list), GET (single), PATCH, DELETE — all under `/api/v1/custom-sources/connections`. Soft-delete only, no restore endpoint.
- **Response DTO redaction:** Password, encrypted blob, IV, key version NEVER on response DTO. Host/port/db/user/sslMode are OK on response DTO.
- **Log redaction:** Regex-based Logback scrubber (pattern converter or TurboFilter) masking `(postgresql|jdbc:postgresql)://[^\s]+` and `password=[^\s&]+`.
- **ConnectionStatus:** Reuse existing `ConnectionStatus` enum. `CryptoException` → FAILED with "Configuration error — contact support." `DataCorruptionException` → FAILED with "Stored credentials are unreadable — please re-enter the password."
- **Testing scope:** Unit (SSRF, crypto, RO verifier, redaction regex), Integration (Testcontainers Postgres), Controller (MockMvc), Log assertion test.

### Claude's Discretion

- Exact exception class names and package placement (`CryptoException`, `DataCorruptionException`, `SsrfRejectedException`, `ReadOnlyVerificationException`). Whether they extend `AdapterException` tree or form a sibling `ConnectionException` tree.
- Precise SAVEPOINT probe target (temp table INSERT vs. `information_schema` write attempt).
- Entity column layout beyond core decisions (e.g., `lastVerifiedAt`, `lastFailureReason`).
- Logback mechanism (pattern converter vs TurboFilter vs custom Appender wrapper).
- DTO naming and package placement.
- Whether `/test` endpoint returns per-gate pass/fail booleans or aggregated status with category.
- Whether to log RO verification success (for audit) or stay silent.

### Deferred Ideas (OUT OF SCOPE)

- Connection restore endpoint (Notion-style trash)
- Credential key rotation (v2 — `keyVersion` column is the hook)
- Supabase vault / external secret manager (SECV2-01)
- SSH tunnel / agent-based topology (SECV2-03, SECV2-04)
- Dev-profile localhost override for SSRF
- Per-gate pass/fail response shape on `/test` (planner may ship aggregate first)
- Audit logging of RO-verification successes
- Associated data (AAD) in AES-GCM
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONN-01 | `CustomSourceConnectionEntity` extends AuditableEntity, implements SoftDeletable | `AuditableSoftDeletableEntity` base class confirmed. Pattern identical to `WorkspaceIntegrationInstallationEntity`. |
| CONN-02 | Credentials stored as encrypted JSONB (AES-256-GCM, app-level key) | `javax.crypto.Cipher` (JVM stdlib) + `ByteArray` JPA columns confirmed. No new library needed. |
| CONN-03 | `CustomSourceConnectionService` CRUD with `@PreAuthorize` workspace scoping | `IntegrationConnectionService` is the template pattern. `@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")` on service methods. |
| CONN-04 | Connection string NEVER logged (KLogger redaction for `postgresql://`, `jdbc:postgresql://`) | Logback `TurboFilter` or `PatternConverter` on root logger covers third-party code. Spring Boot uses Logback via slf4j-api (confirmed in build.gradle.kts). |
| CONN-05 | User can create, view, update, soft-delete via `/api/v1/custom-sources/connections` | `IntegrationController` is the thin-controller reference. New controller + 6 endpoints. |
| SEC-01 | SSRF validation rejects localhost, RFC1918, 169.254.169.254, IPv6 loopback | `InetAddress.isLoopbackAddress()` / `isSiteLocalAddress()` + explicit CIDR checks using `BigInteger` bit-masking or `SubnetUtils`. No new dependency needed. |
| SEC-02 | SSRF validation resolves hostname to IP and checks resolved IP (DNS rebinding defense) | `InetAddress.getAllByName(host)` resolves all IPs. Each checked against blocklist before JDBC connect. |
| SEC-03 | Read-only role enforcement: reject if role has INSERT/UPDATE/DELETE on target tables | JDBC `DriverManager.getConnection()` (short-lived, no HikariCP) + SAVEPOINT probe + `has_table_privilege()` + `pg_roles` attribute query. |
| SEC-05 | `CryptoException` → ConnectionStatus=FAILED, "Config error" message, no key in logs | `ConnectionStatus.FAILED` reachable from `CONNECTED` via `canTransitionTo()`. Service catches, sets status, wraps exception before re-throwing. |
| SEC-06 | `DataCorruptionException` → ConnectionStatus=FAILED, prompt user to re-enter | Same status transition path. Distinct exception type surfaced as distinct user message. |
</phase_requirements>

---

## Summary

Phase 2 builds the `customsource` domain — the first new Spring domain introduced in this project. It is a pure backend phase: JPA entity + migrations, four new services (encryption, SSRF validator, RO verifier, connection CRUD), one new controller, and a cross-cutting Logback redaction mechanism that applies globally. No new library dependencies are required; the implementation draws entirely on JVM standard library crypto (`javax.crypto`), existing Spring/JPA conventions, and the Postgres JDBC driver already on the classpath.

The primary implementation risk is the SSRF gate's TLS SNI subtlety: the locked decision says "connect by IP but verify TLS using the original hostname". The Postgres JDBC driver (`org.postgresql:postgresql`) supports this via the `sslhostnameverifier` property and the connection URL, but requires care in how the JDBC URL is constructed. Testing this properly requires either Testcontainers with a TLS-enabled instance or mocking at the `DriverManager` level — the planner must pick one approach per plan.

The second risk is the Logback redaction mechanism. Spring Boot auto-configures Logback via `spring-boot-starter-logging`. A `TurboFilter` registered as a Spring bean will NOT be picked up by Logback automatically — it must be wired via a `logback-spring.xml` or programmatic `LoggerContext` manipulation at startup. A `PatternConverter` applied to the default console/file appender pattern is simpler but only catches log messages formatted through the pattern, not raw `logger.error(exception)` calls that embed JDBC URLs in the exception message string. The safest approach is a custom `TurboFilter` registered via `LoggerContext` in a `@Configuration` bean's `@PostConstruct`, which intercepts at the logging framework level before any appender formats the message.

**Primary recommendation:** Use `TurboFilter` registered via `LoggerContext.addTurboFilter()` in a `@Configuration` `@PostConstruct` for log redaction. Use `DriverManager.getConnection()` (not HikariCP) for all validation connections in Phase 2. Use `InetAddress.getAllByName()` with `BigInteger`-based CIDR matching for SSRF without adding a third-party library.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `javax.crypto.Cipher` | JVM 21 stdlib | AES-256-GCM encrypt/decrypt | Zero dependency; JVM ships AES/GCM/NoPadding. `SecureRandom` for IV generation. |
| `java.net.InetAddress` | JVM 21 stdlib | DNS resolution + IP classification | `getAllByName()` + `isLoopbackAddress()` / `isSiteLocalAddress()` / `isLinkLocalAddress()` / `isMulticastAddress()` already exist. |
| `org.postgresql:postgresql` | BOM-managed (~42.x) | JDBC driver for validation connections | Already `runtimeOnly` in build.gradle.kts. `DriverManager.getConnection()` for short-lived verify connections. |
| `ch.qos.logback:logback-classic` | Spring Boot BOM (1.5.x) | Log redaction via TurboFilter | Spring Boot auto-configures; `LoggerContext` accessible via `LoggerFactory.getILoggerFactory() as LoggerContext`. |
| `AuditableSoftDeletableEntity` | Project | Base class for `CustomSourceConnectionEntity` | `@SQLRestriction("deleted = false")` + audit cols. Confirmed at `entity/util/AuditableSoftDeletableEntity.kt`. |
| `ConnectionStatus` | Project | 8-state enum with `canTransitionTo()` | Confirmed `FAILED` is reachable from `CONNECTED`. Reuse directly. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `java.math.BigInteger` | JVM 21 stdlib | CIDR IP range comparison | For CGNAT `100.64.0.0/10`, `0.0.0.0/8`, multicast `224.0.0.0/4` that `InetAddress` helpers don't cover. |
| `Base64` (`java.util.Base64`) | JVM 21 stdlib | Decode `RIVEN_CREDENTIAL_ENCRYPTION_KEY` from env | Standard Base64 decode for key material. |
| `@ConfigurationProperties` | Spring Boot | Credential key config bean | Pattern already established: `NangoConfigurationProperties`. |
| `@Type(JsonBinaryType::class)` | Hypersistence 3.9.2 (already in build) | JSONB column for encrypted blob if stored as JSONB | Confirmed used on `IntegrationConnectionEntity`. **Note:** encrypted blob is `ByteArray` → use `@Column(columnDefinition = "bytea")`, NOT jsonb. |
| Testcontainers PostgreSQL | 2.0.3 (already in test deps) | Real Postgres for RO verifier integration tests | Already on classpath, used in `SourceTypeJpaRoundTripTest`. Image: `pgvector/pgvector:pg16`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `javax.crypto` (JVM stdlib) | Bouncy Castle | Bouncy Castle offers more algorithms but is a heavy dependency addition. JVM 21 AES-GCM is battle-tested and requires no new dep. CONTEXT.md locks `javax.crypto.Cipher`. |
| `TurboFilter` via `LoggerContext` | `PatternConverter` in `logback-spring.xml` | PatternConverter only scrubs formatted message strings; JDBC driver exception messages bypass it. TurboFilter intercepts before formatting. |
| `DriverManager.getConnection()` | HikariCP pool | HikariCP is Phase 3. Validation connections must be short-lived, independent of the sync pool. |
| `BigInteger` CIDR math | Apache Commons Net `SubnetUtils` | Would add a dependency. All CIDR logic needed is 20 lines with `BigInteger`. |

**Installation:** No new dependencies required. All crypto, networking, and logging tools are already on the classpath.

---

## Architecture Patterns

### Recommended Project Structure

```
riven.core.
├── entity.customsource/
│   └── CustomSourceConnectionEntity.kt       # JPA entity
├── repository.customsource/
│   └── CustomSourceConnectionRepository.kt  # Spring Data JPA
├── models.customsource/
│   ├── CustomSourceConnectionModel.kt        # Domain model (response DTO)
│   └── request/
│       ├── CreateCustomSourceConnectionRequest.kt
│       ├── UpdateCustomSourceConnectionRequest.kt
│       └── TestCustomSourceConnectionRequest.kt
├── service.customsource/
│   ├── CustomSourceConnectionService.kt      # CRUD + gate orchestration
│   ├── CredentialEncryptionService.kt        # AES-GCM encrypt/decrypt
│   ├── SsrfValidatorService.kt               # IP blocklist + DNS rebinding
│   └── ReadOnlyRoleVerifierService.kt        # JDBC probe + privilege check
├── controller.customsource/
│   └── CustomSourceConnectionController.kt  # Thin REST controller
├── configuration.properties/
│   └── CustomSourceConfigurationProperties.kt  # RIVEN_CREDENTIAL_ENCRYPTION_KEY
├── exceptions/                               # (add to existing exceptions package)
│   └── ConnectionExceptions.kt              # CryptoException, DataCorruptionException,
│                                            #   SsrfRejectedException, ReadOnlyVerificationException
├── enums.customsource/
│   └── (none required in Phase 2 — reuse ConnectionStatus)
└── configuration.customsource/
    └── LogRedactionConfiguration.kt         # TurboFilter registration
```

**SQL schema file:** `core/db/schema/01_tables/custom_source_connections.sql` (new file, follows existing table pattern).

### Pattern 1: AES-256-GCM Encrypt / Decrypt

**What:** Service wraps `javax.crypto.Cipher` with fail-fast key loading. Returns an `EncryptedCredentials` value type.
**When to use:** On every `save` (encrypt before persist) and every `load` (decrypt after read).

```kotlin
// Source: javax.crypto documentation + CONTEXT.md spec
data class EncryptedCredentials(
    val ciphertext: ByteArray,
    val iv: ByteArray,
    val keyVersion: Int
)

@Service
class CredentialEncryptionService(
    private val props: CustomSourceConfigurationProperties
) {
    private val secretKeySpec: SecretKeySpec = initKey(props.credentialEncryptionKey)

    private fun initKey(base64Key: String): SecretKeySpec {
        require(base64Key.isNotBlank()) { "RIVEN_CREDENTIAL_ENCRYPTION_KEY must not be blank" }
        val keyBytes = try { Base64.getDecoder().decode(base64Key) }
                       catch (e: IllegalArgumentException) {
                           throw CryptoException("Credential key is not valid Base64", e)
                       }
        require(keyBytes.size == 32) {
            "Credential key must be 32 bytes (256-bit); got ${keyBytes.size}"
        }
        return SecretKeySpec(keyBytes, "AES")
    }

    fun encrypt(credentialsJson: String): EncryptedCredentials {
        val iv = ByteArray(12).also { SecureRandom().nextBytes(it) }
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, GCMParameterSpec(128, iv))
        val ciphertext = cipher.doFinal(credentialsJson.toByteArray(Charsets.UTF_8))
        return EncryptedCredentials(ciphertext, iv, keyVersion = 1)
    }

    fun decrypt(encrypted: EncryptedCredentials): String {
        try {
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, GCMParameterSpec(128, encrypted.iv))
            return String(cipher.doFinal(encrypted.ciphertext), Charsets.UTF_8)
        } catch (e: AEADBadTagException) {
            throw DataCorruptionException("GCM auth tag mismatch — ciphertext is corrupted", e)
        } catch (e: GeneralSecurityException) {
            throw CryptoException("Decryption failed — check key configuration", e)
        }
    }
}
```

### Pattern 2: SSRF Validator — Resolve-Once, Pin-IP

**What:** Resolves hostname to all IPs, checks each against blocklist, throws `SsrfRejectedException` on any match. Returns the set of safe resolved IPs for use in JDBC URL construction.
**When to use:** As the first gate in create/update/test flows, before any JDBC connection attempt.

```kotlin
// Source: java.net.InetAddress + CONTEXT.md blocklist spec
@Service
class SsrfValidatorService(private val logger: KLogger) {

    fun validateAndResolve(host: String): List<InetAddress> {
        val addresses = try { InetAddress.getAllByName(host).toList() }
                        catch (e: UnknownHostException) {
                            throw SsrfRejectedException("Host not reachable: hostname could not be resolved.")
                        }
        for (addr in addresses) {
            checkAddress(addr)  // throws SsrfRejectedException if blocked
        }
        return addresses
    }

    private fun checkAddress(addr: InetAddress) {
        // First pass: JVM helpers
        if (addr.isLoopbackAddress || addr.isLinkLocalAddress ||
            addr.isSiteLocalAddress || addr.isMulticastAddress) {
            logger.warn { "SSRF blocklist: ${addr.hostAddress} is private/loopback/multicast" }
            throw SsrfRejectedException(GENERIC_SSRF_MESSAGE)
        }

        // IPv4-mapped IPv6 (::ffff:0:0/96) — unwrap and re-check
        if (addr is Inet6Address) {
            val mapped = addr.address
            if (mapped[0] == 0.toByte() && mapped[1] == 0.toByte() &&  // first 10 bytes 0
                // ... (abbreviated — check for IPv4-mapped prefix))
                checkCidr(InetAddress.getByAddress(mapped.takeLast(4).toByteArray()))
            )
            // ULA fc00::/7 handled by isSiteLocalAddress() on Java 17+
        }

        // Second pass: explicit CIDR checks not covered by JVM helpers
        if (addr is Inet4Address) checkIPv4Cidrs(addr)
    }

    private fun checkIPv4Cidrs(addr: Inet4Address) {
        // 0.0.0.0/8, 100.64.0.0/10 (CGNAT), 255.255.255.255
        // Use BigInteger bitmask: (ip & mask) == network
        val ip = BigInteger(1, addr.address)
        val blocked = listOf(
            "0.0.0.0/8" to (BigInteger("0") to BigInteger("255")),  // simplified — use real masks
            // ... full list from CONTEXT.md
        )
        // throw SsrfRejectedException(GENERIC_SSRF_MESSAGE) if any match
    }

    companion object {
        const val GENERIC_SSRF_MESSAGE =
            "Host not reachable: this address is blocked for security reasons (private/loopback/metadata)."
    }
}
```

### Pattern 3: Read-Only Role Verifier

**What:** Opens a short-lived JDBC connection (not HikariCP). Runs SAVEPOINT probe + `has_table_privilege()` sweep + `pg_roles` attribute check.
**When to use:** After SSRF + reachability gate, before persist.

```kotlin
// Source: CONTEXT.md spec + PostgreSQL JDBC driver (org.postgresql:postgresql)
@Service
class ReadOnlyRoleVerifierService(private val logger: KLogger) {

    fun verify(host: String, resolvedIp: InetAddress, port: Int, database: String,
               user: String, password: String, sslMode: String) {
        // Construct JDBC URL using resolved IP, original host for SNI
        val jdbcUrl = "jdbc:postgresql://${resolvedIp.hostAddress}:$port/$database" +
                      "?ssl=true&sslmode=$sslMode&sslServerHostname=$host"
        val props = Properties().apply {
            setProperty("user", user)
            setProperty("password", password)
            // sslhostnameverifier not needed when sslServerHostname is set
        }

        try {
            DriverManager.getConnection(jdbcUrl, props).use { conn ->
                checkSuperuserAttributes(conn)
                checkWritePrivileges(conn)
                checkSavepointProbe(conn)
            }
        } catch (e: SsrfRejectedException) { throw e }
          catch (e: ReadOnlyVerificationException) { throw e }
          catch (e: SQLException) {
              // Sanitize — JDBC getMessage() often includes the full JDBC URL
              throw ReadOnlyVerificationException("Database connection failed: ${sanitize(e.message)}", e)
          }
    }

    private fun checkSuperuserAttributes(conn: Connection) {
        conn.prepareStatement(
            "SELECT rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = current_user"
        ).executeQuery().use { rs ->
            if (rs.next() && (rs.getBoolean(1) || rs.getBoolean(2) || rs.getBoolean(3))) {
                throw ReadOnlyVerificationException(
                    "Role has superuser/createdb/createrole attributes — read-only role required."
                )
            }
        }
    }

    private fun checkWritePrivileges(conn: Connection) {
        // Query count of tables where current role has INSERT, UPDATE, or DELETE
        // Uses pg_class + pg_namespace + has_table_privilege()
        // Reject if count > 0, message includes count but NOT table names
    }

    private fun checkSavepointProbe(conn: Connection) {
        // SAVEPOINT ro_check → CREATE TEMP TABLE __riven_probe → INSERT INTO it
        // Expect PSQLException with SQLState 42501 (insufficient_privilege)
        // ROLLBACK TO SAVEPOINT ro_check regardless of outcome
    }

    private fun sanitize(message: String?): String =
        message?.replace(Regex("(postgresql|jdbc:postgresql)://[^\\s]+"), "[REDACTED]") ?: "unknown"
}
```

### Pattern 4: Logback TurboFilter for Log Redaction

**What:** `TurboFilter` registered into Logback's `LoggerContext` at Spring startup. Intercepts all log events before appender formatting — catches third-party code (JDBC driver, HikariCP) as well as application code.
**When to use:** Registered once globally; covers all appenders automatically.

```kotlin
// Source: Logback documentation — ch.qos.logback.classic.turbo.TurboFilter
// Spring Boot ships Logback via spring-boot-starter-logging (SLF4J + Logback Classic)
@Configuration
class LogRedactionConfiguration {

    @PostConstruct
    fun registerRedactionFilter() {
        val loggerContext = LoggerFactory.getILoggerFactory() as LoggerContext
        loggerContext.addTurboFilter(CredentialRedactionTurboFilter())
    }
}

class CredentialRedactionTurboFilter : TurboFilter() {
    private val JDBC_URL_PATTERN = Regex("(postgresql|jdbc:postgresql)://[^\\s,;\"']+")
    private val PASSWORD_PATTERN = Regex("password=[^\\s&;]+", RegexOption.IGNORE_CASE)

    override fun decide(marker: Marker?, logger: Logger?, level: Level?,
                        format: String?, params: Array<Any?>?, t: Throwable?): FilterReply {
        // Redact format string if present
        // Redact exception message chain if t != null
        // Note: we cannot mutate the event here — return NEUTRAL and let
        // the appender handle it, OR replace params in-place if mutable.
        // Recommended: create a PatternConverter for the message + wrap
        // exception toString to redact the chain.
        return FilterReply.NEUTRAL
    }
}
```

**Critical note:** `TurboFilter.decide()` cannot mutate the log event in place. The cleanest approach is a `PatternConverter` subclass registered via `logback-spring.xml` that replaces the formatted message string — but this misses raw exception stack traces printed by the default `ThrowableProxyConverter`. The recommended hybrid is:
1. `TurboFilter` that replaces `params` in-place (works when params are mutable String instances) for format-string redaction.
2. A custom `ThrowableConverter` registered in `logback-spring.xml` that sanitizes exception `getMessage()` in the stack trace.

**Simpler viable approach:** A `logback-spring.xml` file that registers a `PatternConverter` on the message conversion word (`%msg`) replacing both patterns. This is sufficient for the Phase 2 scope because the JDBC URL appears in `%msg` of wrapped exceptions (when the service wraps and sanitizes before logging). The `sanitize()` helper in `ReadOnlyRoleVerifierService` (shown above) is the primary defense; the Logback filter is belt-and-suspenders.

### Pattern 5: `CustomSourceConnectionEntity` — Column Layout

```kotlin
@Entity
@Table(name = "custom_source_connections")
@SQLRestriction("deleted = false")  // inherited from AuditableSoftDeletableEntity — no explicit annotation needed
class CustomSourceConnectionEntity(
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "workspace_id", nullable = false, columnDefinition = "uuid")
    val workspaceId: UUID,

    @Column(name = "name", nullable = false, length = 255)
    var name: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "connection_status", nullable = false, length = 50)
    var connectionStatus: ConnectionStatus = ConnectionStatus.CONNECTED,

    // Encrypted blob — bytea, NOT jsonb (raw ciphertext, not JSON-serializable)
    @Column(name = "encrypted_credentials", nullable = false, columnDefinition = "bytea")
    var encryptedCredentials: ByteArray,

    @Column(name = "iv", nullable = false, columnDefinition = "bytea")
    var iv: ByteArray,

    @Column(name = "key_version", nullable = false)
    var keyVersion: Int = 1,

    // Optional planner decisions (recommended — land now for Phase 6)
    @Column(name = "last_verified_at")
    var lastVerifiedAt: ZonedDateTime? = null,

    @Column(name = "last_failure_reason", length = 1000)
    var lastFailureReason: String? = null,

) : AuditableSoftDeletableEntity() {
    // toModel() omits encryptedCredentials, iv, keyVersion
    // Decrypted host/port/database/user/sslMode populated by service before building model
}
```

### Anti-Patterns to Avoid

- **Storing the IV inside the encrypted blob:** IV must be a separate column — you need it to decrypt, so it cannot be encrypted.
- **Using `@Type(JsonBinaryType::class)` for `encryptedCredentials`:** The ciphertext is raw bytes, not JSON. Use `columnDefinition = "bytea"` with plain `ByteArray` mapping.
- **Re-resolving hostname inside JDBC connect:** The DNS-rebinding defense requires the JDBC URL to use the pre-validated resolved IP. Never pass the original hostname as the JDBC host.
- **Catching `Exception` in the gate chain and swallowing it:** All gate exceptions must propagate to trigger transaction rollback. Only sanitize the exception message before logging — never suppress.
- **Using static `companion object` loggers:** Project convention requires injected `KLogger` via constructor from `LoggerConfig`. This is enforced by `core/CLAUDE.md`.
- **Logging request DTOs with `logger.info("Received $request")`:** Request DTOs must override `toString()` to exclude credential fields, or use `@field:ToString(exclude = [...])` if using Lombok (not in use here — write explicit `toString()`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AES-GCM encryption | Custom crypto implementation | `javax.crypto.Cipher("AES/GCM/NoPadding")` + `SecureRandom` | JVM stdlib is FIPS-validated on JDK 21; custom implementations introduce timing oracle and padding oracle risks |
| IP range (CIDR) membership | Manual bit shifting | `BigInteger(1, addr.address)` comparisons | `BigInteger` handles IPv4 and IPv6 in 5 lines; custom shift logic has off-by-one errors on boundary addresses |
| Short-lived JDBC connections | HikariCP pool for validation | `DriverManager.getConnection()` + `use {}` (AutoCloseable) | Pool management is Phase 3. Validation connections must close immediately to avoid resource leaks |
| ConnectionStatus state machine | New state enum for custom source | Existing `ConnectionStatus` + `canTransitionTo()` | Enum has 8 states; reuse avoids duplicate state-machine logic and inconsistent transition rules |
| Workspace access control | Inline `workspaceId` checks | `@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")` | Established project pattern; inline checks only needed when entity lookup doesn't filter by workspace (CLAUDE.md rule) |
| Test entity construction | `new CustomSourceConnectionEntity(...)` inline | `CustomSourceConnectionEntityFactory.create(...)` | CLAUDE.md: "Never construct JPA entities inline in tests — always use factory methods" |

---

## Common Pitfalls

### Pitfall 1: IV Reuse Breaks GCM Security

**What goes wrong:** If the same IV is used with the same key to encrypt two different plaintexts, AES-GCM becomes trivially breakable (XOR reveals both plaintexts, and the authentication tag provides no protection).
**Why it happens:** Copying the `SecureRandom` initialization outside the encrypt method, or reusing an `EncryptedCredentials` object's IV when re-encrypting on update.
**How to avoid:** Generate a fresh `SecureRandom().nextBytes(12)` IV on every call to `encrypt()`, never on a per-service-instance basis.
**Warning signs:** Tests that encrypt the same plaintext twice produce the same ciphertext.

### Pitfall 2: JDBC URL in Exception Messages (Log Leakage)

**What goes wrong:** `org.postgresql.Driver` includes the full JDBC connection URL in `SQLException.getMessage()`. If this exception propagates through a `logger.error(e)` call, the URL (including password if embedded) appears in logs.
**Why it happens:** Third-party code; can't be controlled at the driver level without patching.
**How to avoid:** All `SQLException` catches in `ReadOnlyRoleVerifierService` must extract and sanitize `e.message` before any logging. The global Logback filter is belt-and-suspenders but the service-level sanitize is the primary defense.
**Warning signs:** Log assertion test that triggers a connection failure without the Logback filter should find the URL; with the filter (and service sanitize), it should not.

### Pitfall 3: `@SQLRestriction` Breaks Native SQL Queries on Soft-Deleted Rows

**What goes wrong:** `AuditableSoftDeletableEntity` inherits `@SQLRestriction("deleted = false")`. This applies to all JPQL and derived queries but NOT to native SQL. If a future query needs to find a deleted connection (e.g. for cleanup), it must use native SQL explicitly.
**Why it happens:** Spring Data JPA silently appends `AND deleted = false` to all non-native queries.
**How to avoid:** Phase 2 has no soft-delete restore requirement. Document in entity KDoc that native SQL is required for deleted row access.
**Warning signs:** `findById()` returns empty for a soft-deleted entity even in tests.

### Pitfall 4: TLS SNI Hostname vs IP Connection

**What goes wrong:** Constructing the JDBC URL with the resolved IP (e.g. `jdbc:postgresql://203.0.113.5:5432/mydb`) while `sslmode=verify-full` causes the TLS handshake to fail because the server's certificate is issued for `db.example.com`, not `203.0.113.5`.
**Why it happens:** The DNS-rebinding defense requires connecting by IP, but TLS certificate verification uses the hostname.
**How to avoid:** The Postgres JDBC driver supports `sslServerHostname` (property added in postgresql-jdbc 42.2.x) which specifies the hostname for TLS SNI and cert verification separately from the IP in the URL. Set `sslServerHostname=<original_host>` in the connection properties while using the resolved IP in the JDBC URL host.
**Warning signs:** Integration test with `sslmode=verify-full` fails with "SSL SYSCALL error: EOF detected" or certificate hostname mismatch.

### Pitfall 5: `has_table_privilege()` Returns True for `information_schema` System Tables

**What goes wrong:** `information_schema` views are owned by the superuser and most roles have `SELECT` but not write privileges. However, some system catalog tables may return unexpected results for `has_table_privilege()` with 'INSERT'.
**Why it happens:** `pg_class` includes both user tables and system catalog objects. Filtering to user-accessible schemas (`USAGE` privilege on namespace) is required.
**How to avoid:** Scope the `has_table_privilege()` sweep to schemas where the role has `USAGE` privilege via `pg_namespace` join, and exclude `information_schema` and `pg_catalog` explicitly.
**Warning signs:** A correctly-restricted read-only role fails RO verification because `has_table_privilege()` returns true for a system table.

### Pitfall 6: Transactional Rollback on Gate Failure

**What goes wrong:** If SSRF or RO verification throws a checked exception wrapped in a `RuntimeException`, Spring's `@Transactional` will rollback by default (rollback on unchecked). But if the exception thrown is a checked exception, Spring will NOT rollback unless `@Transactional(rollbackFor = [MyCheckedException::class])` is specified.
**Why it happens:** Java checked vs unchecked exception distinction.
**How to avoid:** All `ConnectionException` subtypes should extend `RuntimeException` (not checked `Exception`). This matches the project's existing exception hierarchy (all exceptions in `riven.core.exceptions` extend `RuntimeException`).
**Warning signs:** A gate failure in testing results in a partially-persisted entity.

### Pitfall 7: `@ConfigurationProperties` Bean Initialization Order

**What goes wrong:** `CredentialEncryptionService` reads the key from `CustomSourceConfigurationProperties` at construction time (to fail fast). If the properties bean is not initialized before the service bean, an `NPE` occurs before the meaningful validation error fires.
**Why it happens:** Spring bean initialization order; `@ConfigurationProperties` beans are generally initialized early but not guaranteed before `@Service` beans in all scan orders.
**How to avoid:** Follow the `NangoConfigurationProperties` pattern — annotate the properties class with `@ConfigurationProperties` and register `CredentialEncryptionService` as `@Service`. Spring's `@ConfigurationProperties` beans are processed before application beans. The `@PostConstruct` on the service (or constructor-time validation) fires after all dependencies are injected, which is safe.

---

## Code Examples

Verified patterns from existing codebase:

### Existing `@ConfigurationProperties` Pattern (NangoConfigurationProperties)

```kotlin
// Source: core/src/main/kotlin/riven/core/configuration/properties/NangoConfigurationProperties.kt
@ConfigurationProperties(prefix = "riven.nango")
data class NangoConfigurationProperties(
    val secretKey: String = "",
    val baseUrl: String = "https://api.nango.dev",
    val maxWebhookBodySize: Int = 1_048_576,
)
```

New `CustomSourceConfigurationProperties` follows the same pattern with prefix `riven.custom-source`:
```kotlin
@ConfigurationProperties(prefix = "riven.custom-source")
data class CustomSourceConfigurationProperties(
    val credentialEncryptionKey: String = "",  // maps to RIVEN_CREDENTIAL_ENCRYPTION_KEY
)
```

In `application.yml`:
```yaml
riven:
  custom-source:
    credential-encryption-key: ${RIVEN_CREDENTIAL_ENCRYPTION_KEY:}
```

### Existing `AuditableSoftDeletableEntity` Pattern

```kotlin
// Source: core/src/main/kotlin/riven/core/entity/util/AuditableSoftDeletableEntity.kt
@MappedSuperclass
@SQLRestriction("deleted = false")
abstract class AuditableSoftDeletableEntity : AuditableEntity(), SoftDeletable {
    @Column(name = "deleted", nullable = false)
    override var deleted: Boolean = false
    @Column(name = "deleted_at", nullable = true)
    override var deletedAt: ZonedDateTime? = null
}
```

### Existing `@PreAuthorize` + `@Transactional` Service Pattern

```kotlin
// Source: IntegrationConnectionService.kt
@Transactional
@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
fun updateConnectionStatus(workspaceId: UUID, connectionId: UUID, ...) {
    val userId = authTokenService.getUserId()
    // ...
}
```

### Existing `ExceptionHandler` — How New Exceptions Are Mapped

```kotlin
// Source: core/src/main/kotlin/riven/core/exceptions/ExceptionHandler.kt
// Pattern: domain exception -> HTTP status + ApiError enum value
@ExceptionHandler(IllegalArgumentException::class)
fun handleIllegalArgumentException(ex: IllegalArgumentException): ResponseEntity<ErrorResponse> {
    return ErrorResponse(statusCode = HttpStatus.BAD_REQUEST, error = ApiError.INVALID_ARGUMENT, ...).let {
        ResponseEntity(it, it.statusCode)
    }
}
```

New `SsrfRejectedException`, `ReadOnlyVerificationException` need handler methods added to `ExceptionHandler.kt` (→ 400 BAD_REQUEST). `CryptoException` and `DataCorruptionException` should NOT propagate to the HTTP layer (they transition `ConnectionStatus` in the service and are only exposed via the connection status field).

### Testcontainers Pattern (from SourceTypeJpaRoundTripTest)

```kotlin
// Source: SourceTypeJpaRoundTripTest.kt
@JvmStatic val postgres: PostgreSQLContainer = PostgreSQLContainer(
    DockerImageName.parse("pgvector/pgvector:pg16").asCompatibleSubstituteFor("postgres")
).withDatabaseName("riven_test").withUsername("test").withPassword("test")
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GCM without authentication tag check | Explicit `AEADBadTagException` catch | Java 7+ | Must catch `AEADBadTagException` (extends `BadPaddingException`) separately from generic `GeneralSecurityException` to distinguish data corruption from key error |
| Hostname-only SSRF check | DNS-resolved IP check + DNS-rebinding defense | 2019-era SSRF research | Must resolve hostname before connect; locked decision in CONTEXT.md |
| JDBC URL with plaintext password | Properties-object password passing | Always best practice | `DriverManager.getConnection(url, Properties())` keeps password out of URL string (and therefore out of any JDBC driver error messages that include the URL) |
| Logback `@Value`-injected patterns | `TurboFilter` or `PatternConverter` via `logback-spring.xml` | Spring Boot 2+ | Spring Boot's Logback auto-configuration supports `logback-spring.xml` with `<springProperty>` for profile-aware config |

**Deprecated/outdated:**
- `javax.crypto.spec.IvParameterSpec`: For AES-GCM, always use `GCMParameterSpec` (specifies both IV and authentication tag length). `IvParameterSpec` with GCM is incorrect and will throw at cipher init.
- `AES/CBC/PKCS5Padding`: No authenticated encryption, vulnerable to padding oracle. CONTEXT.md locks GCM.

---

## Open Questions

1. **`sslServerHostname` property — JDBC driver minimum version**
   - What we know: The `sslServerHostname` connection property enables separate hostname for TLS SNI vs IP in JDBC URL. Confirmed available in postgresql-jdbc 42.2.x+.
   - What's unclear: The Spring Boot BOM-managed `org.postgresql:postgresql` version. The build.gradle.kts uses BOM version management (`runtimeOnly("org.postgresql:postgresql")` without explicit version).
   - Recommendation: Verify the actual resolved version with `./gradlew dependencies | grep postgresql`. Spring Boot 3.5.x typically bundles postgresql 42.7.x which supports `sslServerHostname`. If below 42.2, fall back to the alternative noted in CONTEXT.md specifics.

2. **SAVEPOINT probe target — exact SQL**
   - What we know: CONTEXT.md says "planner picks the exact probe target." Options: (a) `CREATE TEMP TABLE __riven_ro_probe (v int)` then `INSERT INTO __riven_ro_probe VALUES (1)` — expects `42501`; (b) attempt write to `information_schema` — unreliable (system objects have different permission semantics).
   - Recommendation: Option (a) is cleanest: temp table creation succeeds for all roles (DDL on temp schema is allowed), but INSERT into a temp table requires the INSERT privilege on the session-local temp schema. Wait — actually CREATE TEMP TABLE itself may succeed for read-only roles since `pg_temp` is the role's own temp schema. Need to verify: the locked decision says attempt to write and expect `42501`. The safer probe is: attempt to CREATE a table in `public` schema (NOT temp): `CREATE TABLE __riven_ro_probe_$randomSuffix (v int)` — this will fail with `42501` for a read-only role that lacks `CREATE` on `public`. Then `ROLLBACK TO SAVEPOINT` to undo.
   - What's unclear: Whether `pg_temp` INSERT returns `42501` for a read-only role. **MEDIUM confidence — planner should verify with a Testcontainers test against both a superuser and an explicitly read-only role.**

3. **Exception tree placement — `ConnectionException` vs `AdapterException`**
   - What we know: Phase 1 established `sealed class AdapterException`. CONTEXT.md marks this as Claude's discretion.
   - Recommendation: Create a **sibling sealed hierarchy** `sealed class ConnectionException(message, cause) : RuntimeException(message, cause)` under `service.customsource.exception`. Reasoning: `AdapterException` is about adapter runtime failures (fetch/sync). `ConnectionException` is about connection management (validation gates, crypto). They have different HTTP mappings and different Temporal retry semantics. Keeping them separate avoids a `when` expression in Temporal retry config having to exclude non-Temporal exceptions.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | JUnit 5 + Mockito Kotlin 3.2.0 + Spring Boot Test |
| Config file | None explicit — `@SpringBootTest(classes = [...])` per test class |
| Quick run command | `./gradlew test --tests "riven.core.service.customsource.*"` |
| Full suite command | `./gradlew test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONN-01 | `CustomSourceConnectionEntity` soft-delete round-trip via JPA | Integration (Testcontainers) | `./gradlew test --tests "riven.core.entity.customsource.*"` | Wave 0 |
| CONN-02 | AES-256-GCM encrypt → decrypt round-trip; wrong-key throws `CryptoException`; corrupted tag throws `DataCorruptionException` | Unit | `./gradlew test --tests "riven.core.service.customsource.CredentialEncryptionServiceTest"` | Wave 0 |
| CONN-03 | Service CRUD enforces workspace scoping; cross-workspace access denied | Unit (`@WithUserPersona`) | `./gradlew test --tests "riven.core.service.customsource.CustomSourceConnectionServiceTest"` | Wave 0 |
| CONN-04 | Log appender captures events; URL masked in both direct log and exception stack | Unit (capture appender) | `./gradlew test --tests "riven.core.configuration.customsource.LogRedactionTest"` | Wave 0 |
| CONN-05 | Controller endpoints: create/list/get/update/delete return correct HTTP status codes | Unit (MockMvc) | `./gradlew test --tests "riven.core.controller.customsource.*"` | Wave 0 |
| SEC-01 | SSRF blocks: `127.0.0.1`, `10.0.0.1`, `192.168.1.1`, `172.16.0.1`, `169.254.169.254`, `100.64.0.1`, `0.0.0.1`, `224.0.0.1`, `::1` | Unit | `./gradlew test --tests "riven.core.service.customsource.SsrfValidatorServiceTest"` | Wave 0 |
| SEC-02 | Hostname that resolves to blocked IP is rejected (mock `InetAddress` resolution) | Unit | `./gradlew test --tests "riven.core.service.customsource.SsrfValidatorServiceTest.DNS rebinding*"` | Wave 0 |
| SEC-03 | Superuser role rejected; role with any INSERT/UPDATE/DELETE privilege rejected; clean read-only role accepted | Integration (Testcontainers) | `./gradlew test --tests "riven.core.service.customsource.ReadOnlyRoleVerifierServiceTest"` | Wave 0 |
| SEC-05 | `CryptoException` → `ConnectionStatus.FAILED`; no key material in logs | Unit | `./gradlew test --tests "riven.core.service.customsource.CustomSourceConnectionServiceTest.crypto error*"` | Wave 0 |
| SEC-06 | `DataCorruptionException` → `ConnectionStatus.FAILED`; user-facing message is re-entry prompt | Unit | `./gradlew test --tests "riven.core.service.customsource.CustomSourceConnectionServiceTest.data corruption*"` | Wave 0 |

### Sampling Rate

- **Per task commit:** `./gradlew test --tests "riven.core.service.customsource.*" --tests "riven.core.entity.customsource.*" --tests "riven.core.controller.customsource.*"`
- **Per wave merge:** `./gradlew test`
- **Phase gate:** Full suite green (`./gradlew test`) before `/gsd:verify-work`

### Wave 0 Gaps (files that must be created before implementation tasks)

- [ ] `src/test/kotlin/riven/core/service/customsource/CredentialEncryptionServiceTest.kt` — covers CONN-02
- [ ] `src/test/kotlin/riven/core/service/customsource/SsrfValidatorServiceTest.kt` — covers SEC-01, SEC-02
- [ ] `src/test/kotlin/riven/core/service/customsource/ReadOnlyRoleVerifierServiceTest.kt` — covers SEC-03 (Testcontainers)
- [ ] `src/test/kotlin/riven/core/service/customsource/CustomSourceConnectionServiceTest.kt` — covers CONN-03, SEC-05, SEC-06
- [ ] `src/test/kotlin/riven/core/entity/customsource/CustomSourceConnectionEntityTest.kt` — covers CONN-01 (Testcontainers)
- [ ] `src/test/kotlin/riven/core/controller/customsource/CustomSourceConnectionControllerTest.kt` — covers CONN-05
- [ ] `src/test/kotlin/riven/core/configuration/customsource/LogRedactionTest.kt` — covers CONN-04
- [ ] `src/test/kotlin/riven/core/service/util/factory/customsource/CustomSourceConnectionEntityFactory.kt` — test factory required by CLAUDE.md

---

## Sources

### Primary (HIGH confidence)

- Existing codebase — `NangoConfigurationProperties.kt`, `IntegrationConnectionService.kt`, `AuditableSoftDeletableEntity.kt`, `ExceptionHandler.kt`, `ConnectionStatus.kt`, `LoggerConfig.kt`, `NangoWebhookHmacFilter.kt`, `SourceTypeJpaRoundTripTest.kt` — patterns confirmed by direct file read
- JVM 21 stdlib — `javax.crypto.Cipher`, `java.net.InetAddress`, `java.util.Base64`, `javax.crypto.spec.GCMParameterSpec`, `javax.crypto.AEADBadTagException` — standard library, HIGH confidence
- `build.gradle.kts` — dependency versions confirmed (`slf4j-api:2.0.16`, `testcontainers-postgresql:2.0.3`, `runtimeOnly("org.postgresql:postgresql")`)
- `application.yml` — `riven.nango.secret-key` pattern for env var binding confirmed

### Secondary (MEDIUM confidence)

- PostgreSQL JDBC `sslServerHostname` property: documented in postgresql-jdbc CHANGELOG (42.2.x+). Spring Boot 3.5.x BOM typically resolves postgresql 42.7.x. Recommend verifying resolved version with `./gradlew dependencies`.
- Logback `TurboFilter` vs `PatternConverter` tradeoff: based on Logback documentation and Spring Boot Logback auto-configuration behavior. `logback-spring.xml` is the Spring Boot way to customize Logback without losing Spring-specific features.

### Tertiary (LOW confidence)

- SAVEPOINT probe with `CREATE TABLE in public schema` vs `INSERT INTO temp table`: behavior of read-only Postgres roles against temp schema requires empirical verification with Testcontainers. MEDIUM-LOW until planner verifies in Wave 0 integration test.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed in existing build.gradle.kts or JVM stdlib
- Architecture: HIGH — package structure, entity patterns, service patterns all have direct existing-codebase precedents
- Pitfalls: HIGH for crypto/logging pitfalls (well-documented JVM behavior); MEDIUM for SSRF TLS SNI specifics (JDBC driver version dependency)

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable Spring Boot + JVM stdlib domain; 30-day validity)
