# Riven Landing Page

## What This Is

A pre-launch landing page for Riven — a customizable CRM/workspace platform where everything (entities, attributes, relationships, workflows) adapts to how your business actually works. The landing page builds buzz and captures waitlist signups while the main application is in development.

## Core Value

Communicate that Riven lets you build a CRM that fits your business instead of forcing your business to fit the CRM — and capture emails from founders who want early access.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Hero section with bold headline and waitlist signup CTA
- [ ] Pain points section calling out what's broken with existing CRMs
- [ ] Features breakdown showcasing entity model, workflows, non-linear pipelines, templates
- [ ] Waitlist form that captures email addresses
- [ ] TanStack Query setup for API calls (matching /client patterns)
- [ ] Mutation hook ready for backend waitlist endpoint
- [ ] Bold, disruptive visual branding (colors, typography, visual language)
- [ ] Responsive design (mobile + desktop)

### Out of Scope

- Backend waitlist endpoint — user will wire this up separately
- Email verification or double opt-in — v1 is simple capture
- Pricing section — product isn't priced yet
- Login/signup flows — this is pre-launch, main app handles auth
- Blog or content pages — just the landing page for now

## Context

**Target audience:** Founders and small teams building their first real sales/ops infrastructure. People frustrated with rigid CRMs who need flexibility.

**Tone:** Bold, disruptive, confident. "We're not like the others." Anti-enterprise, pro-builder.

**Existing codebase:**
- `/landing` is an existing Next.js 16 project (separate from main `/client` app)
- Main app uses TanStack Query, Supabase, shadcn/ui patterns
- Landing should follow similar technical patterns for consistency

**Product positioning:**
- Riven = customizable workspace/CRM where everything is dynamic
- Key differentiators: custom entity model, n8n-style workflow automation, non-linear pipelines, templates for fast setup
- Pitch: "Stop contorting your business to fit your CRM. Build one that fits you."

## Constraints

- **Tech stack**: Next.js (existing /landing project), TanStack Query, TypeScript
- **Branding**: Creating from scratch — no existing brand kit
- **Scope**: Single landing page, no multi-page site
- **Backend**: Form submits to mutation hook; actual endpoint is out of scope

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use /landing project | Already exists, separate from main app | — Pending |
| TanStack Query for form | Matches /client patterns, ready for backend | — Pending |
| Bold/disruptive tone | Target audience (founders) responds to confidence | — Pending |
| Skip research phase | Landing page domain is well-understood | — Pending |

---
*Last updated: 2026-01-18 after initialization*
