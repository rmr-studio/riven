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
# Quick Design: Routable LLM Calls

## What & Why

- LLM Reasoning calls accrue a large cost, which will scale for every user query and every scheduled perspective agent invocation
	- GPT-4 Models with larger context windows will be the most appropriate for complex queries, but rack up larger costs and are too overkill for simple queries
	- Claude Sonnet and GPT-4o-mini handle simpler queries extremely well for a fraction of the cost. But if faced with a complex query will shit the bed
- When handling queries provided by the user. Functionality must be implemented to ensure that an appropriate model is selected based on the query type in order to minimise the cost accrued.

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