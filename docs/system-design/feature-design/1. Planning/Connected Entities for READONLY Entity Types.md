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
# Quick Design: Connected Entities for READONLY Entity Types

## What & Why

_One paragraph: what are we building and why?_

Currently we need to define specific relationship definitions for entity types to connect with other entities. This is fine and suggested for a workspaces custom entities. But we run into the following situations
	- Entity types derived from Integration sources are READONLY and must stay protected
		- However. During Identity resolution. There may be situations where an entity from another integration source might related to an existing entity from another integration source. With no real way of forming a connection If i cannot alter the base model
	- Also during Identity resolution processes. There may be a situation where a new entity is matched to an existing entity, but there isnt an appropriate entity type relationship definition to assign it to.
- There needs to be a common attribute across all entity types that acts as a `Other connected entities`
	- This itself should contain all entities connected via existing relationship definitions. But should also serve as a cover all


---

## Data Changes

**New/Modified Entities:**

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