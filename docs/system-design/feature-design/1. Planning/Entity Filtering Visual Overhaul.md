---
tags:
  - priority/low
  - status/draft
  - architecture/design
  - domain/entity
Created:
Updated:
Domains:
  - "[[Domain]]"
---
# Quick Design: Entity Filtering Visual Overhaul

## What & Why

The Current Entity filtering component has the following issues
	- There are currently multiple different filter popovers
		- One in the Entity Section
		- One used in the Block Layout section
	- Both of these layouts will be heavily linked to entity models. So it is important that both share a common, simplistic UI in order to easily filter a result page
		- Best to have alot of pre-defined filtering capabilities (ie. Dropdowns)
			- Dropdown for entity attribute, filtering type, etc etc
			- Limit the amount of user agency

---

![[Pasted image 20260201190537.png]]

## Gotchas & Edge Cases

_Things to watch out for_

---

## Tasks

- [ ] Move both filtering components out to a common feature-module/ shared ui directory, deprecate one to ensure that only one shared component is being used 
- [ ] Solidify filtering logic to ensure that a user is able to perform specific filtering
	- [ ] Make sure to include entity relationship filtering. Common examples include
		- *Show entities that have relationship with b*
		- *Show entities that have relationship with type z where attribute e*
		- [ ] Also need to add support for polymorphic filtering 
			- Filter x where relationship z includes type y where attribute d
- [ ]

---

## Notes

_Anything else relevant_