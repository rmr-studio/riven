---
tags:
  - component/active
  - layer/model
  - architecture/component
Created: 2026-02-09
Domains:
  - "[[Workflows]]"
---
# WorkflowDeleteEntityActionConfig

## Purpose

Deletes entity instances within workflows with cascade deletion tracking and impact reporting.

---

## Responsibilities

- Configure deletion parameters (entity ID, timeout)
- Validate entity ID template syntax or UUID format
- Execute entity deletion via [[EntityService]]
- Return deletion status and cascade impact count

## Dependencies

- [[EntityService]] — deletes entity with cascade handling
- [[WorkflowNodeConfigValidationService]] — validates template syntax and UUIDs
- [[WorkflowNodeConfig]] — sealed parent class for all node configurations

## Used By

- [[WorkflowNodeConfigRegistry]] — discovers at application startup via classpath scan
- [[WorkflowNode]] — executes via `execute()` method during workflow runtime

---

## Key Logic

The `execute()` method:

1. Extracts resolved `entityId` (UUID) from inputs
2. Calls `EntityService.deleteEntities()` with workspace ID and entity list
3. Checks for errors in deletion result
4. Throws `IllegalStateException` if deletion failed
5. Returns `DeleteEntityOutput` with entity ID, success flag, and cascade count

**Cascade handling**: The `impactedEntities` count represents entities affected by cascade deletion rules (e.g., deleting a client may cascade-delete related projects).

---

## Config Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `entityId` | UUID | Yes | UUID of entity to delete (supports templates like `{{ steps.find.output.entityId }}`) |
| `timeoutSeconds` | DURATION | No | Optional timeout override in seconds (default: workflow-level timeout) |

---

## JSON Examples

### Configuration

```json
{
  "version": 1,
  "type": "ACTION",
  "subType": "DELETE_ENTITY",
  "entityId": "{{ steps.find_expired_record.output.entityId }}"
}
```

### Output

```json
{
  "entityId": "550e8400-e29b-41d4-a716-446655440000",
  "deleted": true,
  "impactedEntities": 7
}
```

---

## Validation Rules

1. **entityId**: Must be valid UUID or template syntax (checked by `validateTemplateOrUuid`)
2. **timeoutSeconds**: Must be non-negative if provided (checked by `validateOptionalDuration`)

**Not validated (TODO):**
- Entity existence before deletion (deletion will silently succeed even if entity doesn't exist)

---

## Gotchas

### No Pre-Deletion Existence Check

The node does not verify that the entity exists before attempting deletion. This is explicitly marked as TODO in source code:

```kotlin
// TODO: Add validation for checking if the entity exists before deletion.
```

**Impact**: Deleting a non-existent entity will return `deleted: true` without error. Workflows cannot distinguish between successful deletion and no-op deletion.

**Workaround**: Precede deletion with a QUERY_ENTITY node if existence confirmation is required.

---

## Related

- [[Action Nodes]] — category-level overview of all action node types
- [[WorkflowNodeConfig]] — sealed parent class defining node configuration contract
- [[Entity Querying]] — related entity operations for pre-deletion existence checks
