package riven.core.service.util.factory.customsource

/**
 * Test factory for CustomSourceConnectionEntity.
 *
 * Phase 2 Wave 0 scaffold — populated by plan 02-01 once
 * CustomSourceConnectionEntity (CONN-01) lands. Required by
 * core/CLAUDE.md rule: never construct JPA entities inline in tests;
 * always route construction through a factory.
 *
 * TODO(plan 02-01): add `fun create(...): CustomSourceConnectionEntity`
 * with sensible defaults (workspaceId, name, connectionStatus,
 * encryptedCredentials, iv, keyVersion).
 */
object CustomSourceConnectionEntityFactory
