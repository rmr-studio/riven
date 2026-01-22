---
phase: 02-service-migration
plan: 02
subsystem: api
tags: [openapi, typescript-fetch, entity-api, service-layer]

# Dependency graph
requires:
  - phase: 02-service-migration/01
    provides: createEntityApi factory function for session-based API configuration
provides:
  - EntityService migrated to use generated EntityApi wrapper
  - 400/409 ResponseError handling for saveEntity validation and impact errors
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 400/409 ResponseError catch pattern for validation and impact endpoints

key-files:
  created: []
  modified:
    - components/feature-modules/entity/service/entity.service.ts

key-decisions:
  - "400 and 409 responses both caught and returned as data for saveEntity"
  - "Reuse createEntityApi factory from Plan 01"

patterns-established:
  - "Validation methods: catch 400/409 ResponseError, return json payload"
  - "Simple methods: validate, create api, return api.method() directly"

# Metrics
duration: 2min
completed: 2026-01-22
---

# Phase 2 Plan 2: EntityService Migration Summary

**EntityService migrated from manual fetch to EntityApi with 400/409 error handling for entity instance validation and impact errors**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-22T10:00:00Z
- **Completed:** 2026-01-22T10:02:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Migrated all 4 EntityService methods from manual fetch to EntityApi
- saveEntity: catches both 400 (validation) and 409 (impact) ResponseErrors, returns json payload
- getEntitiesForType, getEntitiesForTypes, deleteEntities: direct API calls
- Removed dependencies on api(), handleError, fromError, isResponseError utilities

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate EntityService to use EntityApi** - `c79be22` (feat)

## Files Created/Modified

- `components/feature-modules/entity/service/entity.service.ts` - Migrated service using EntityApi instead of fetch

## Decisions Made

1. **400 and 409 both handled** - Unlike EntityTypeService (409 only), EntityService saveEntity also handles 400 for validation errors since both return SaveEntityResponse payload
2. **Reuse existing factory** - Used createEntityApi from lib/api/entity-api.ts established in Plan 01

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - pre-existing TypeScript errors in codebase (blocks module) are unrelated to this migration.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- EntityService migration complete
- All entity-related services (EntityTypeService, EntityService) now use generated API wrappers
- Pattern established for handling both 400 and 409 responses in save methods

---
*Phase: 02-service-migration*
*Completed: 2026-01-22*
