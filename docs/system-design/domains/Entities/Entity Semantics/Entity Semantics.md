---
Created: 2026-02-06
Domains:
  - "[[Entities]]"
  - "[[Knowledge]]"
tags:
---
# Subdomain: Entity Semantics
## Overview

Entity types, attributes, and relationships carry semantic metadata that defines what they mean, not just what they're called.

- Each entity type carries a semantic definition (natural language description of what this entity represents in the business model)
- Each attribute carries a semantic type classification (identifier, categorical, quantitative, temporal, freetext, relational reference) and natural language description
- Each relationship carries semantic context (the nature of the connection, e.g., "customer purchased product" vs "customer viewed product")
- Semantic metadata is inherited from templates but user-editable
- Changes to semantic metadata trigger re-enrichment of affected entities 
	- [[Schema Change Handling]]
## Components

| Component | Purpose | Type                            |
| --------- | ------- | ------------------------------- |
| [[]]      |         | Service/ Controller /Repository |

## Technical Debt

|Issue|Impact|Effort|
|---|---|---|
||High/Med/Low|High/Med/Low|

---

## Recent Changes

| Date | Change | Feature/ADR |
| ---- | ------ | ----------- |
|      |        | [[]]        |
