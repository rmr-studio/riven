---
tags:
  - priority/high
  - status/draft
  - architecture/feature
  - tools/nango
Created:
Updated:
Domains:
  - "[[Integrations]]"
Sub-Domain: "[[Entity Integration Sync]]"
---
# Quick Design: Integration Access Layer

## What & Why

The main goal of the application is to serve as a unified platform to an extremely large amount of integrations and third party toolings to allow a team to connect and create cross domain intelligence across their external platforms. Because of this, an abstract and centralised process and layer is needed to create connections to these third party tools in order to continuously sync data from, and perform actions to in.

Currently. The overall lean is towards using [[2. Areas/2.1 Startup & Business/Riven/2. System Design/infrastructure/Nango|Nango]] as a centralised manager layer to handle core integration infrastructure, such as
	- Prebuilt OAuth flows for common integrations
	- authentication management
	- token handling and automated refreshing
	- Webhook connection management
		- **and** unified event format 
	- rate limit backoff
	- failure retries
	- independent user configuration for integration settings
	- data mapping support
		- fits into the [[Integration Schema Mapping]] section
	- historical sync
	- integration action execution
		- Used for [[Workflows]]
  

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