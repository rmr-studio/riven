---
tags:
  - priority/high
  - status/draft
  - architecture/feature
Created:
Updated:
Domains:
  - "[[Knowledge]]"
  - "[[Entities]]"
  - "[[Integrations]]"
---
# Quick Design: Entity Type Polymorphic Relationship Support for Semantic Categories

## What & Why

With the introduction of [[Semantically Imbued Entity Attributes]], this would allow us to give each entity type a specific category, ie.
	- Customer
	- Transaction
	- Communication
	- etc
Data synced from integrations and converted into entity models would also define entity types with these semantic types to allow for better relationship linking.
Because of this, we would need to overhaul how we structure and allow polymorphic relationship.
- Currently we allow for a relationship to accept
	- Specific Entity Type/s
	- Every entity type
- We should further extend this to allow a relationship to **only** accept specific entity types within a given entity type attribute
	- Ie. `Connected Accounts` relationship within a customer entity could allow for `User` entity types. Allowing a workspace to then connect that customer to Reddit, Linkedin, Gmail, and other external accounts that would be synced via these integrations.

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