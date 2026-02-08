---
tags:
  - priority/low
  - priority/medium
  - priority/high
  - status/draft
  - status/designed
  - status/implemented
  - architecture/design
  - architecture/feature
Created:
Updated:
Domains:
  - "[[Domain]]"
---
# Quick Design: Schema Change Handler

## What & Why
- Given the core fundamentals of data embedding and its relation to the current schema at the time data is processed through the pipeline. When a user makes alterations to a schema
	- New Attributes
	- Removal of relationships
	- deletion of an entity type
- The embedding for an existing workspace environment must be altered to meet the new patterns and structure

- Functionality must be implemented tation will
	- Detect which entities are affected by a schema change
	- Prioritize re-embedding based on impact
		- Use temporal workflow execution to re-embed in the background
		- Provide visibility into re-embedding progress for large-scale changes


| Change Type                               | Affected Entities                                   | Re-embedding Priority           |
| ----------------------------------------- | --------------------------------------------------- | ------------------------------- |
| Entity type semantic description changed  | All entities of that type                           | High                            |
| Attribute semantic description changed    | All entities with non-null value for that attribute | Medium                          |
| Attribute deleted                         | All entities of that type                           | Medium                          |
| Attribute added                           | None (new data only)                                | N/A                             |
| Relationship semantic description changed | All entities with that relationship                 | Medium                          |
| Relationship deleted                      | All entities that had that relationship             | Low (remove from enriched text) |
| Template applied to existing workspace    | All entities matching template types                | High                            |

- Schema mutations fire events to a Temporal workflow 
- Workflow queries for affected entity IDs 
- Workflow batches entities into child embedding workflows (batch size ~100) 
- Progress tracked in a schema_migration_jobs table 
- UI shows migration progress when active
- Queries and Perspectives might be disabled/delayed while there is active re-embedding

---

## Data Changes

**New/Modified Entities:**

- **Migration Job**
```
status, 
total_entities, 
processed_entities, 
error_count
```

**New/Modified Fields:**

---

## Components Affected

- [[Component1]] - what changes
- [[Component2]] - what changes

---

## API Changes

_New endpoints or modifications (if any)_

---

## Failure Handling

_What happens if this fails? Any new failure modes?_

---

## Gotchas & Edge Cases

_Things to watch out for_

---

## Tasks

- [ ]
- [ ]
- [ ]

---

## Notes

_Anything else relevant_