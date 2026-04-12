---
phase: 02-secure-connection-management
plan: 04
subsystem: customsource
tags: [phase-2, wave-3, service, controller, rest, mockmvc, gate-chain]
dependency_graph:
  requires:
    - 02-01 (CustomSourceConnectionEntity/Repository/Model + ConnectionException hierarchy)
    - 02-02 (CredentialEncryptionService + EncryptedCredentials + global log redaction)
    - 02-03 (SsrfValidatorService + ReadOnlyRoleVerifierService)
  provides:
    - CustomSourceConnectionService (orchestrates SSRF -> RO verify -> encrypt -> save in @Transactional)
    - CustomSourceConnectionController (6 REST endpoints under /api/v1/custom-sources/connections)
    - SslMode enum (require/verify-ca/verify-full/prefer) with Jackson round-trip
    - CredentialPayload (internal JSON shape for encrypted credential blob)
    - CreateCustomSourceConnectionRequest + UpdateCustomSourceConnectionRequest + TestCustomSourceConnectionRequest
    - TestResult (aggregate gate-validation outcome)
    - ApiError.SSRF_REJECTED + ApiError.ROLE_VERIFICATION_FAILED
    - ExceptionHandler mappings -> HTTP 400 for SsrfRejected + ReadOnlyVerification
    - Activity.CUSTOM_SOURCE_CONNECTION + ApplicationEntityType.CUSTOM_SOURCE_CONNECTION
  affects:
    - Phase 3 (ingestion) can read CustomSourceConnectionEntity and decrypt credentials
      via CustomSourceConnectionService.getById(workspaceId, id) -> CustomSourceConnectionModel,
      or directly via CredentialEncryptionService.decrypt(EncryptedCredentials) + ObjectMapper
      readValue<CredentialPayload>() to recover host/port/database/user/password/sslMode.
tech_stack:
  added: []
  patterns:
    - "Gate chain inside @Transactional: SSRF validator -> RO verifier -> encrypt -> persist. Any step failure rolls back — no partial persist."
    - "CryptoException / DataCorruptionException at read-time surface via ConnectionStatus transition to FAILED with user-safe messages — NEVER propagated to HTTP (locked Phase-2 decision)."
    - "PATCH branches on UpdateCustomSourceConnectionRequest.touchesCredentials(): credential-touching fields trigger decrypt-merge-re-gate-re-encrypt; cosmetic-only (name) path skips the gate chain entirely."
    - "Per-row decrypt-failure isolation in listByWorkspace: one corrupt row yields a FAILED model, other rows still hydrate normally."
    - "toString() redaction on every request DTO + CredentialPayload — primary defence; the global Logback TurboFilter from Plan 02-02 is the backstop."
    - "Standalone MockMvc controller test with real ExceptionHandler wired via setControllerAdvice — @PreAuthorize blocking covered at the SpringBootTest service-layer test instead."
key_files:
  created:
    - core/src/main/kotlin/riven/core/enums/customsource/SslMode.kt
    - core/src/main/kotlin/riven/core/models/customsource/CredentialPayload.kt
    - core/src/main/kotlin/riven/core/models/customsource/request/CreateCustomSourceConnectionRequest.kt
    - core/src/main/kotlin/riven/core/models/customsource/request/UpdateCustomSourceConnectionRequest.kt
    - core/src/main/kotlin/riven/core/models/customsource/request/TestCustomSourceConnectionRequest.kt
    - core/src/main/kotlin/riven/core/service/customsource/CustomSourceConnectionService.kt
    - core/src/main/kotlin/riven/core/controller/customsource/CustomSourceConnectionController.kt
  modified:
    - core/src/main/kotlin/riven/core/enums/common/ApiError.kt
    - core/src/main/kotlin/riven/core/exceptions/ExceptionHandler.kt
    - core/src/main/kotlin/riven/core/enums/activity/Activity.kt
    - core/src/main/kotlin/riven/core/enums/core/ApplicationEntityType.kt
    - core/src/test/kotlin/riven/core/models/customsource/CredentialPayloadJacksonTest.kt
    - core/src/test/kotlin/riven/core/models/customsource/request/CreateCustomSourceConnectionRequestValidationTest.kt
    - core/src/test/kotlin/riven/core/service/customsource/CustomSourceConnectionServiceTest.kt
    - core/src/test/kotlin/riven/core/controller/customsource/CustomSourceConnectionControllerTest.kt
decisions:
  - "SslMode values stored as libpq-canonical strings (require / verify-ca / verify-full / prefer) via @JsonValue so the Jackson wire format matches what the JDBC driver consumes directly. @JsonCreator throws IllegalArgumentException on unknown values — Jackson wraps this in ValueInstantiationException (subtype of JsonMappingException), which is the contract asserted in CredentialPayloadJacksonTest."
  - "TestResult is a top-level data class colocated with CustomSourceConnectionService, not a nested class, to keep the controller's return-type import clean and match the Kotlin idiom for small result types."
  - "CryptoException and DataCorruptionException are NEVER thrown to HTTP — @ControllerAdvice has no handlers for them. At read-time they trigger transitionToFailed() on the entity plus a redacted [unavailable] model, so the client always gets a well-formed response with ConnectionStatus=FAILED + a safe message in lastFailureReason. This is the locked Phase-2 decision: credential failures are operational states, not API errors."
  - "@PreAuthorize cross-workspace blocking asserted at the SpringBootTest service-layer test (CustomSourceConnectionServiceTest.create blocks cross-workspace access via @PreAuthorize) rather than at the MockMvc controller layer, because MockMvcBuilders.standaloneSetup does not load Spring method-security. Keeps the controller test focused on HTTP wire format + bean-validation + ExceptionHandler mapping; keeps the security assertion in the layer where @PreAuthorize actually runs."
  - "decryptToModel catches DataCorruptionException BEFORE CryptoException — DataCorruptionException is the more specific subtype in our sealed hierarchy (narrower operational cause: tag mismatch / stored ciphertext unreadable), and we want its user-facing 're-enter the password' message to win over the generic CryptoException 'Configuration error' copy."
  - "update() credential-touching branch: decrypt current JSON -> CredentialPayload.copy(merge) -> gate chain on merged -> re-encrypt with a fresh IV. A field omitted from the PATCH request is preserved from the stored payload (including password). A field present in the PATCH overrides. All six credential-touching fields route through this merge to keep the gate chain meaningful (e.g. changing only host still exercises RO verify against the stored password)."
  - "Activity logging uses Activity.CUSTOM_SOURCE_CONNECTION + ApplicationEntityType.CUSTOM_SOURCE_CONNECTION (two new enum values added) for audit-trail consistency with IntegrationConnectionService's Activity.INTEGRATION_CONNECTION pattern. Extends both enums additively — no behaviour change to existing entries."
  - "ExceptionHandler additions follow the existing file's per-exception handler shape exactly: storeExceptionForAnalytics -> ErrorResponse -> .also { logger.error } -> ResponseEntity wrap. No refactor of the base class."
metrics:
  duration: "~9 min"
  completed: "2026-04-12"
  tasks: 3
  files_created: 7
  files_modified: 8
requirements:
  - CONN-03
  - CONN-05
  - SEC-05
  - SEC-06
requirements-completed: [CONN-03, CONN-05, SEC-05, SEC-06]
---

# Phase 02 Plan 04: CustomSourceConnection Service + Controller Summary

Close the Phase 2 CRUD loop: orchestrate SSRF validation, read-only role
verification, AES-256-GCM encryption, and persistence into a single
`@Transactional` create path; expose the full lifecycle over 6 REST
endpoints under `/api/v1/custom-sources/connections`. CryptoException
and DataCorruptionException become operational status transitions rather
than HTTP errors. CONN-03 / CONN-05 / SEC-05 / SEC-06 satisfied.

## Performance

- **Duration:** ~9 min
- **Started:** 2026-04-12T22:52:35Z
- **Completed:** 2026-04-12T23:01:37Z
- **Tasks:** 3
- **Files created:** 7 (5 main + 2 main: service + controller)
- **Files modified:** 8 (4 main enum/exception + 4 test populations)

## What Landed

### Production code

- **`SslMode` enum** — REQUIRE/VERIFY_CA/VERIFY_FULL/PREFER with `@JsonValue`
  carrying the libpq wire strings and `@JsonCreator` that throws on unknown
  values. Ensures JDBC driver consumes the stored string directly + any
  regression in the round-trip breaks the build.
- **`CredentialPayload`** — internal JSON shape `{host, port, database,
  user, password, sslMode}` that gets AES-encrypted and stored. `toString`
  redacts the password.
- **Request DTOs** — `CreateCustomSourceConnectionRequest`,
  `UpdateCustomSourceConnectionRequest` (all-nullable PATCH semantics with
  a `touchesCredentials()` helper), `TestCustomSourceConnectionRequest`
  (no `workspaceId` — dry-run only). All three redact `password` in
  `toString`; Create applies `@field:NotBlank` / `@field:NotNull` /
  `@field:Size(1..255)` / `@field:Min(1)` / `@field:Max(65535)`.
- **`CustomSourceConnectionService`** — 5 public methods:
  - `create(request)` — SSRF resolve -> RO verify -> encrypt -> save, all
    inside `@Transactional`. Any gate failure rolls back. Workspace
    scoping via `@PreAuthorize("@workspaceSecurity.hasWorkspace(#request.workspaceId)")`.
  - `test(request)` — gate chain only, aggregate `TestResult(pass,
    category, message)`. No side effects.
  - `update(workspaceId, id, request)` — two-path logic: if
    `request.touchesCredentials()`, decrypt the stored payload, merge the
    PATCH fields, run the full gate chain on the merged payload, and
    re-encrypt with a fresh IV; otherwise apply cosmetic change (name)
    only.
  - `getById` / `listByWorkspace` — decrypt + map to response model.
    `CryptoException` / `DataCorruptionException` transition
    `ConnectionStatus` to FAILED with user-safe copy and return a redacted
    `[unavailable]` model rather than throwing.
  - `softDelete` — sets `deleted=true` + `deletedAt=now`; no restore
    endpoint.
  - All mutations call `activityService.logActivity(Activity.CUSTOM_SOURCE_CONNECTION, ...)`.
- **`CustomSourceConnectionController`** — 6 endpoints under
  `/api/v1/custom-sources/connections`: `POST /test`, `POST /`, `GET /`,
  `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`. Thin — delegates to service.
  Swagger `@Tag` / `@Operation` / `@ApiResponses`; `@Valid` on every
  request body.
- **`ExceptionHandler`** — two new handlers: `SsrfRejectedException` ->
  400 `ApiError.SSRF_REJECTED`, `ReadOnlyVerificationException` -> 400
  `ApiError.ROLE_VERIFICATION_FAILED`. No handlers added for
  `CryptoException` / `DataCorruptionException` by design.
- **Enum extensions** — `ApiError` (+SSRF_REJECTED, +ROLE_VERIFICATION_FAILED),
  `Activity` (+CUSTOM_SOURCE_CONNECTION), `ApplicationEntityType`
  (+CUSTOM_SOURCE_CONNECTION).

### Tests (33 new tests across 4 files)

- **`CredentialPayloadJacksonTest`** — 7 tests: parameterised round-trip
  across all 4 `SslMode` values; full payload byte-for-byte round-trip;
  unknown-sslMode throws `JsonMappingException`; `toString()` redacts
  password.
- **`CreateCustomSourceConnectionRequestValidationTest`** — 6 tests using
  `jakarta.validation.Validator` directly: valid request has zero
  violations; blank password triggers `NotBlank`; port 0 triggers `Min`;
  port 70000 triggers `Max`; 300-char name triggers `Size`; `toString()`
  does not leak password value.
- **`CustomSourceConnectionServiceTest`** — 13 tests (SpringBootTest +
  `@WithUserPersona`): SSRF rejection rolls back (never saved, never
  encrypted); RO verify rejection rolls back; happy-path encrypt+save +
  activity-log verification; cross-workspace `@PreAuthorize` blocks with
  `AccessDeniedException`; CryptoException -> FAILED with "Configuration
  error" message; DataCorruptionException -> FAILED with "re-enter the
  password" message; `listByWorkspace` isolates per-row decrypt failures
  (good+bad both returned, one HEALTHY one FAILED); name-only update
  skips gate chain; host-change update re-runs gates with merged payload
  preserving original password; password-change update rotates
  ciphertext; missing-entity update throws `NotFoundException`;
  softDelete sets flags + logs activity with correct enum values.
- **`CustomSourceConnectionControllerTest`** — 11 MockMvc tests: POST
  /test 200; POST / 201 + no credential fields on response (password /
  encryptedCredentials / iv / keyVersion all absent); POST / 400 on blank
  password; POST / 400 on port 70000; POST / 400 on
  `SsrfRejectedException` with body containing `SSRF_REJECTED` and no
  CIDR leak; POST / 400 on `ReadOnlyVerificationException` with
  `ROLE_VERIFICATION_FAILED`; GET / list with redacted models; GET /{id}
  with no credential fields; GET /{id} 404 on NotFoundException; PATCH
  /{id} 200 + no password; DELETE /{id} 204.

## Verification

- `./gradlew test --tests "riven.core.models.customsource.CredentialPayloadJacksonTest"` -> 7/7 green
- `./gradlew test --tests "riven.core.models.customsource.request.CreateCustomSourceConnectionRequestValidationTest"` -> 6/6 green
- `./gradlew test --tests "riven.core.service.customsource.CustomSourceConnectionServiceTest"` -> 13/13 green
- `./gradlew test --tests "riven.core.controller.customsource.CustomSourceConnectionControllerTest"` -> 11/11 green
- `./gradlew test` full suite -> **1827/1827 green, 0 failures, 0 ignored**
- `./gradlew compileKotlin compileTestKotlin` -> BUILD SUCCESSFUL

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CredentialPayloadJacksonTest assertion type mismatch**

- **Found during:** Task 1 first test run.
- **Issue:** The plan suggested asserting `InvalidFormatException` when
  deserialising an unknown `sslMode`. In practice, `@JsonCreator` methods
  that throw `IllegalArgumentException` are wrapped by Jackson in a
  `ValueInstantiationException` (subtype of `JsonMappingException`), not
  `InvalidFormatException` (which is for primitive coercion failures
  only).
- **Fix:** Asserted `JsonMappingException` (the common parent). The
  contract — "deserialisation does not silently succeed for an unknown
  sslMode" — is preserved.
- **Files modified:** `core/src/test/kotlin/riven/core/models/customsource/CredentialPayloadJacksonTest.kt`
- **Commit:** `a5933cad0`

**2. [Rule 3 - Blocking] Companion-object const in class-level `@WithUserPersona`**

- **Found during:** Task 2 first compile attempt.
- **Issue:** Kotlin won't resolve companion-object `const val` references
  in a class-level annotation applied to the same class (the class
  doesn't exist yet at annotation-resolution time).
- **Fix:** Inlined the UUID literals at the two annotation sites;
  retained `val userId`/`val workspaceId` in the class body for readable
  test bodies.
- **Files modified:** `core/src/test/kotlin/riven/core/service/customsource/CustomSourceConnectionServiceTest.kt`
- **Commit:** `fbaf6750c`

**3. [Rule 3 - Blocking] `argThat<T>` `it` receiver resolution**

- **Found during:** Task 2 first compile attempt.
- **Issue:** mockito-kotlin's `argThat<T> { ... }` did not provide an
  implicit `it` receiver in this Kotlin version — the compiler rejected
  `argThat<CustomSourceConnectionEntity> { it.foo }` with "Unresolved
  reference 'it'".
- **Fix:** Replaced all implicit `it` with an explicit lambda parameter
  (`{ e -> e.foo }`) in every `argThat` call. No behavioural change.
- **Files modified:** `core/src/test/kotlin/riven/core/service/customsource/CustomSourceConnectionServiceTest.kt`
- **Commit:** `fbaf6750c`

**4. [Rule 3 - Blocking] Factory does not allow id override for unit-test stubbing**

- **Found during:** Task 2 test writing.
- **Issue:** `CustomSourceConnectionEntityFactory.create(...)` deliberately
  omits an `id` parameter per project rule ("Never manually generate
  UUIDs for JPA-managed entities" — guarantees `persist()` vs `merge()`
  semantics in integration tests). But unit tests need a post-save
  entity with `id` set to exercise `requireNotNull(saved.id)` inside the
  service.
- **Fix:** Introduced a local `entityWithId(...)` helper in the test that
  calls the factory, then uses reflection on the `id` field to install
  the UUID. Keeps the factory contract intact for integration tests
  while giving the unit test the post-save state it needs.
- **Files modified:** `core/src/test/kotlin/riven/core/service/customsource/CustomSourceConnectionServiceTest.kt`
- **Commit:** `fbaf6750c`

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking). No architectural
changes (Rule 4). No authentication gates. No checkpoints.

**Impact on plan:** Zero scope change. Every bullet in the plan's
`<done>` criteria is satisfied. `files_modified` frontmatter held — no
pruning needed.

## Commits

| Task | Commit      | Message                                                                           |
| ---- | ----------- | --------------------------------------------------------------------------------- |
| 1    | `a5933cad0` | feat(02-04): add SslMode + request DTOs + CredentialPayload + HTTP mappings       |
| 2    | `fbaf6750c` | feat(02-04): add CustomSourceConnectionService with gate chain orchestration      |
| 3    | `6da8dcd03` | feat(02-04): add CustomSourceConnectionController with 6 REST endpoints           |

## Requirements Status

- **CONN-03 (connection service orchestration)** — SATISFIED. Gate chain
  composes SSRF -> RO verify -> encrypt -> persist inside one
  `@Transactional` boundary; any step fails the whole create.
- **CONN-05 (REST CRUD surface)** — SATISFIED. 6 endpoints, correct
  status codes (201/200/200/200/200/204), `@Valid` + bean-validation
  -> 400, `@PreAuthorize` -> 403 (service-layer asserted), response
  DTOs never carry credential fields.
- **SEC-05 (defence-in-depth pre-connect validation order)** —
  SATISFIED. Service-layer tests verify SSRF runs first (mock
  `validateAndResolve` throws -> `repository.save` never called and
  `roVerifier.verify` never called), then RO verifier runs (mock
  `validateAndResolve` returns -> `roVerifier.verify` throws ->
  `repository.save` never called and `encryptionService.encrypt` never
  called). Encryption + save run last.
- **SEC-06 (failure-mode logging / safe error responses)** —
  SATISFIED. `CryptoException` and `DataCorruptionException` never
  reach HTTP — they transition `ConnectionStatus` to FAILED with
  user-safe copy ("Configuration error — contact support." /
  "Stored credentials are unreadable — please re-enter the password.").
  SSRF error copy asserted against the literal
  `SsrfValidatorService.GENERIC_MESSAGE` in Plan 02-03; the controller
  test re-asserts no CIDR leaks through the HTTP body. The global
  Logback TurboFilter from Plan 02-02 is a third line of defence.

## API Surface (final)

```
POST   /api/v1/custom-sources/connections/test    -> 200 TestResult
POST   /api/v1/custom-sources/connections         -> 201 CustomSourceConnectionModel
GET    /api/v1/custom-sources/connections         -> 200 List<CustomSourceConnectionModel>  (?workspaceId={id})
GET    /api/v1/custom-sources/connections/{id}    -> 200 CustomSourceConnectionModel        (?workspaceId={id})
PATCH  /api/v1/custom-sources/connections/{id}    -> 200 CustomSourceConnectionModel        (?workspaceId={id})
DELETE /api/v1/custom-sources/connections/{id}    -> 204                                    (?workspaceId={id})
```

Error codes: 400 on bean-validation / SSRF / RO verification; 403 on
cross-workspace access (via `@PreAuthorize`); 404 on missing id within
the workspace (via `ServiceUtil.findOrThrow`).

## Downstream Contracts (for Phase 3 ingestion)

Phase 3 can consume custom-source connections directly:

- **Service API:** `CustomSourceConnectionService.getById(workspaceId, id)
  -> CustomSourceConnectionModel` — returns decrypted host/port/db/user/sslMode
  with a FAILED status + user-safe message when credentials are
  unreadable.
- **Raw credential access** (ingestion will need the password):
  ```kotlin
  val entity = repository.findByIdAndWorkspaceId(id, workspaceId).orElseThrow(...)
  val json = encryptionService.decrypt(
      EncryptedCredentials(entity.encryptedCredentials, entity.iv, entity.keyVersion)
  )
  val payload: CredentialPayload = objectMapper.readValue(json)
  // payload.password is now available for JDBC connect
  ```
- **Contract:** credentials NEVER round-trip out of a
  `CustomSourceConnectionModel`. Ingestion that needs the password must
  go directly through `CredentialEncryptionService.decrypt` inside its
  own service boundary, which means ingestion code will be subject to
  the same global Logback redaction + service-layer exception sanitisation.
- **Entity state contract:** Phase 3 readers must treat
  `ConnectionStatus == FAILED` as "do not attempt to ingest — a prior
  read already transitioned this row; surface `lastFailureReason` to
  the user".

## Self-Check

- `core/src/main/kotlin/riven/core/enums/customsource/SslMode.kt`: FOUND
- `core/src/main/kotlin/riven/core/models/customsource/CredentialPayload.kt`: FOUND
- `core/src/main/kotlin/riven/core/models/customsource/request/CreateCustomSourceConnectionRequest.kt`: FOUND
- `core/src/main/kotlin/riven/core/models/customsource/request/UpdateCustomSourceConnectionRequest.kt`: FOUND
- `core/src/main/kotlin/riven/core/models/customsource/request/TestCustomSourceConnectionRequest.kt`: FOUND
- `core/src/main/kotlin/riven/core/service/customsource/CustomSourceConnectionService.kt`: FOUND
- `core/src/main/kotlin/riven/core/controller/customsource/CustomSourceConnectionController.kt`: FOUND
- `core/src/test/kotlin/riven/core/models/customsource/CredentialPayloadJacksonTest.kt`: FOUND (populated, no @Disabled)
- `core/src/test/kotlin/riven/core/models/customsource/request/CreateCustomSourceConnectionRequestValidationTest.kt`: FOUND
- `core/src/test/kotlin/riven/core/service/customsource/CustomSourceConnectionServiceTest.kt`: FOUND (populated, no @Disabled)
- `core/src/test/kotlin/riven/core/controller/customsource/CustomSourceConnectionControllerTest.kt`: FOUND (populated, no @Disabled)
- Commit `a5933cad0` present in git log: CONFIRMED
- Commit `fbaf6750c` present in git log: CONFIRMED
- Commit `6da8dcd03` present in git log: CONFIRMED
- Full suite 1827/1827 green: CONFIRMED

## Self-Check: PASSED

---
*Phase: 02-secure-connection-management*
*Completed: 2026-04-12*
