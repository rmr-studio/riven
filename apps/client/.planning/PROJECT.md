# Riven Onboarding Flow & Template Installation

## What This Is

A unified multi-step onboarding experience for new Riven users that consolidates user profile setup, workspace creation, template installation, and team invitations into a single guided flow. Features a split-panel layout with form inputs on the left and an animated live preview on the right that uses Framer Motion camera-style transitions (zoom, pan, focus) between contextual mockup sections as users progress through steps.

## Core Value

New users go from account creation to a fully configured workspace with pre-built entity types in one seamless, visually engaging flow — no dead ends, no manual setup.

## Requirements

### Validated

- ✓ User profile collection (name, phone, avatar) — existing OnboardForm
- ✓ Workspace creation (name, currency, plan, avatar) — existing WorkspaceForm
- ✓ Supabase auth with session management — existing auth layer
- ✓ Entity type management per workspace — existing entity feature module
- ✓ OpenAPI-generated API client with auth token attachment — existing API layer
- ✓ Member invite infrastructure — existing (possibly outdated) invite component

### Active

- [ ] Unified multi-step onboarding flow replacing current single-modal approach
- [ ] Split-panel layout: form left, animated preview right
- [ ] Framer Motion camera transitions (zoom-out → pan → zoom-in) between steps
- [ ] Extensible step framework for adding/reordering steps without rewriting animations
- [ ] Step 1: User profile (name, phone, avatar)
- [ ] Step 2: Workspace setup (name, currency, plan, avatar)
- [ ] Step 3: Template/bundle selection from backend catalog (skippable)
- [ ] Step 4: Invite teammates with email + role (skippable)
- [ ] Consolidated request object combining all step data for single backend POST
- [ ] Live focused preview mockups per step (profile card, workspace header, entity type grid, team members)
- [ ] Success celebration screen after completion, then redirect to workspace
- [ ] LocalStorage draft persistence so page refresh doesn't lose progress
- [ ] Backend template catalog API integration (fetch available templates/bundles)
- [ ] Template selection seeds workspace entity types on creation

### Out of Scope

- Backend consolidated endpoint implementation — separate backend branch, frontend just shapes the unified payload
- OTP/phone verification during onboarding — infrastructure exists but not wired for this flow
- Custom template creation by users — only pre-made backend-served templates
- Mobile-specific onboarding layout — desktop-first, responsive later
- Onboarding analytics/tracking — add after flow stabilises

## Context

**Brownfield:** The codebase has a working but minimal onboarding gate (`OnboardWrapper` checks `user.name`). User profile form and workspace creation exist as separate flows. The templates page is a stub. This project consolidates and elevates these into a polished guided experience.

**Animation architecture:** The preview panel uses a "virtual canvas" approach — all preview sections exist in a large container, and the visible viewport animates between them using Framer Motion `animate` with `x`, `y`, `scale` transforms. This makes adding new steps as simple as placing a new preview section on the canvas and defining its viewport coordinates.

**API strategy:** The frontend builds a unified onboarding payload object combining user profile, workspace config, selected templates, and invite list. Currently the backend has separate endpoints (`PUT /api/user/profile`, `POST /api/workspace`). The frontend will shape the consolidated object and initially call existing endpoints sequentially, ready to switch to a single endpoint when the backend branch lands.

**Existing components to reuse/adapt:**
- `OnboardForm` validation schemas (name, phone, avatar)
- `WorkspaceForm` validation schemas (name, currency, plan)
- `WorkspaceForm` currency selector, plan selector
- Member invite component (needs audit — may be outdated)
- `AvatarUploader` component
- Entity type display components

## Constraints

- **Tech stack**: Next.js 15 + React 19 + Framer Motion + shadcn/ui + Tailwind 4 — no new UI libraries
- **API contract**: Must work with existing separate endpoints initially, unified endpoint later
- **Auth flow**: OnboardWrapper gate stays — new flow replaces the modal it renders
- **Templates**: Backend-driven catalog, not hardcoded — requires template API endpoint
- **Bundle size**: Framer Motion already in the bundle — no additional animation libraries

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Split-panel layout (form left, preview right) | Matches Asana reference, provides visual context during data entry | — Pending |
| Camera-style Framer transitions between steps | Creates engaging flow, extensible to new steps via canvas coordinates | — Pending |
| Single POST at end (not per-step saves) | Simpler API contract, matches planned consolidated backend endpoint | — Pending |
| Templates optional, profile + workspace required | Users can explore templates later, but need a workspace to start | — Pending |
| Backend-driven template catalog | Templates can be updated without frontend deploys | — Pending |
| LocalStorage draft persistence | Protects against accidental page refresh without needing backend draft endpoint | — Pending |

---
*Last updated: 2026-03-08 after initialization*
