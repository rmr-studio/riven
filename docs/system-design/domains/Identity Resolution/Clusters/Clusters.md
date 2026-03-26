---
tags:
  - architecture/subdomain
  - domain/identity-resolution
Created: 2026-03-17
Domains:
  - "[[Identity Resolution]]"
---

# Clusters

## Overview

Manages identity clusters — groups of entities confirmed as representing the same real-world identity. Phase 4 feature design covers the confirmation state machine and Union-Find cluster management — see [[Identity Cluster Confirmation and Union-Find Management]].

## Components

| Component | Purpose | Type |
|---|---|---|
| IdentityClusterEntity | Workspace-scoped cluster container with member count tracking, soft-deletable | Entity |
| IdentityClusterMemberEntity | Join table linking entities to clusters — hard-deleted (not AuditableSoftDeletableEntity) | Entity |
| IdentityClusterRepository | Basic CRUD for clusters | Repository |
| IdentityClusterMemberRepository | Basic CRUD for cluster members | Repository |

## Technical Debt

- Services (IdentityClusterService, IdentityConfirmationService) planned in Phase 4 — not yet implemented.
- Unique index on `entity_id` enforces one-cluster-per-entity constraint at the database level.

## Recent Changes

| Date | Change | Domains |
|---|---|---|
| 2026-03-17 | Entity scaffolding for cluster system | Identity Resolution |
| 2026-03-18 | Phase 4 feature design: confirmation and Union-Find management | Identity Resolution, Entities |
