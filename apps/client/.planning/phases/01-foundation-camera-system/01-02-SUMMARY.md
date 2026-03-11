---
phase: 01-foundation-camera-system
plan: "02"
subsystem: ui
tags: [framer-motion, zustand, onboarding, skeleton, camera-animation, split-panel]

# Dependency graph
requires:
  - phase: 01-01
    provides: ONBOARD_STEPS config array with cameraX offsets and useOnboardStore singleton

provides:
  - OnboardShell: fixed inset-0 z-50 split-panel overlay (40% form / 60% preview)
  - OnboardCameraCanvas: three-phase useAnimate camera (zoom-out 200ms → pan 200ms → zoom-in 200ms)
  - OnboardPreviewPanel: right panel with BGPattern dots grid and camera canvas
  - OnboardFormPanel: left panel with logo mark and placeholder content/nav areas
  - 4 wireframe skeleton preview components (profile, workspace, templates, team)
  - Updated onboard-steps.ts using real PreviewComponents instead of placeholders
  - Updated OnboardWrapper routing to OnboardShell instead of legacy Sheet modal

affects:
  - 01-03-step-transitions (builds stepper and form content into OnboardFormPanel)
  - 02-01-profile-step (adds ProfilePreview content within camera canvas)
  - 02-02-workspace-step (adds WorkspacePreview content within camera canvas)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useAnimate (Framer Motion) for imperative three-phase camera animation sequence
    - isAnimating ref guard pattern for preventing rapid-navigation animation conflicts
    - isZoomedOut state driving conditional opacity on non-active preview sections
    - BGPattern dots grid as right-panel background texture

key-files:
  created:
    - components/feature-modules/onboarding/components/onboard-shell.tsx
    - components/feature-modules/onboarding/components/onboard-form-panel.tsx
    - components/feature-modules/onboarding/components/onboard-preview-panel.tsx
    - components/feature-modules/onboarding/components/onboard-camera-canvas.tsx
    - components/feature-modules/onboarding/components/previews/profile-preview.tsx
    - components/feature-modules/onboarding/components/previews/workspace-preview.tsx
    - components/feature-modules/onboarding/components/previews/templates-preview.tsx
    - components/feature-modules/onboarding/components/previews/team-preview.tsx
  modified:
    - components/feature-modules/onboarding/config/onboard-steps.ts
    - components/feature-modules/onboarding/context/onboard.wrapper.tsx

key-decisions:
  - "Three-phase animation locked at 200ms each (600ms total) per user decision — not configurable"
  - "isAnimating ref (not state) guards rapid navigation — avoids re-render overhead"
  - "Opacity applied via inner div wrapper rather than outer section container — avoids layout shifts during transition"
  - "BGPattern receives fill via CSS var (var(--muted-foreground)) for theme-aware dot color"

patterns-established:
  - "useAnimate over motion.div for imperative multi-phase sequences — await each phase for strict ordering"
  - "Scope ref on translateable canvas child, not outer clipping container — prevents clip interference"
  - "Canvas width = ONBOARD_STEPS.length * SECTION_WIDTH — scales automatically with step array"

requirements-completed: [ANIM-01, ANIM-02, ANIM-03, ANIM-04]

# Metrics
duration: 3min
completed: "2026-03-11"
---

# Phase 1 Plan 02: Split-Panel Layout Shell and Camera System Summary

**Full-screen split-panel onboarding overlay (40/60) with Framer Motion useAnimate three-phase camera transitions (zoom-out → pan → zoom-in) and 4 wireframe skeleton preview components.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-11T06:45:21Z
- **Completed:** 2026-03-11T06:47:47Z
- **Tasks:** 2 of 3 complete (Task 3 is checkpoint:human-verify — awaiting user)
- **Files modified:** 10

## Accomplishments
- OnboardShell renders `fixed inset-0 z-50` split-panel overlay with card/muted backgrounds and 40/60 width split
- OnboardCameraCanvas drives three-phase camera: zoom-out (scale 0.85, 200ms) → pan (targetX, 200ms) → zoom-in (scale 1, 200ms)
- 4 distinct wireframe skeleton previews: profile card, workspace header with stat blocks, 2x2 templates grid, 3-row team roster
- OnboardWrapper now renders OnboardShell instead of legacy Sheet-based Onboard component
- All 44 existing onboarding tests still pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Wireframe preview components and shell layout** - `b3710c8aa` (feat)
2. **Task 2: Camera canvas animation and OnboardWrapper update** - `fe32fa687` (feat)

**Plan metadata:** _(final docs commit — see below)_

## Files Created/Modified
- `components/feature-modules/onboarding/components/onboard-shell.tsx` - Fixed full-screen overlay, 40/60 split, mounts form + preview panels
- `components/feature-modules/onboarding/components/onboard-form-panel.tsx` - Left panel with Riven logo mark and placeholder content/nav areas
- `components/feature-modules/onboarding/components/onboard-preview-panel.tsx` - Right panel with BGPattern dots grid and OnboardCameraCanvas
- `components/feature-modules/onboarding/components/onboard-camera-canvas.tsx` - Virtual canvas with useAnimate three-phase camera animation
- `components/feature-modules/onboarding/components/previews/profile-preview.tsx` - Avatar circle, name/subtitle lines, two bio lines
- `components/feature-modules/onboarding/components/previews/workspace-preview.tsx` - Logo square, workspace name, three stat blocks
- `components/feature-modules/onboarding/components/previews/templates-preview.tsx` - 2x2 grid of cards with icon + two text lines
- `components/feature-modules/onboarding/components/previews/team-preview.tsx` - 3 rows of avatar + name + role badge
- `components/feature-modules/onboarding/config/onboard-steps.ts` - Updated to import real PreviewComponents instead of placeholders
- `components/feature-modules/onboarding/context/onboard.wrapper.tsx` - Updated to render OnboardShell instead of Onboard

## Decisions Made
- Used `isAnimating` ref (not state) to guard rapid navigation — avoids triggering re-renders on every navigation attempt
- Applied opacity to inner `div` wrapper around `PreviewComponent` rather than the outer section container to avoid layout shifts
- BGPattern `fill="var(--muted-foreground)"` + `className="opacity-15"` provides subtle theme-aware dot grid

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — TypeScript and lint both clean for all new onboarding files. Pre-existing errors in `panel-wrapper.tsx` and `type.factory.ts` are out of scope.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Shell and camera system are complete and wired; Plan 03 (step transitions) can add stepper + form content into OnboardFormPanel
- Preview components are placeholder wireframes; Phase 02 plans will enrich them with real step context
- Awaiting Task 3 visual verification checkpoint before marking plan complete

## Self-Check: PASSED

- FOUND: components/feature-modules/onboarding/components/onboard-shell.tsx
- FOUND: components/feature-modules/onboarding/components/onboard-form-panel.tsx
- FOUND: components/feature-modules/onboarding/components/onboard-preview-panel.tsx
- FOUND: components/feature-modules/onboarding/components/onboard-camera-canvas.tsx
- FOUND: components/feature-modules/onboarding/components/previews/profile-preview.tsx
- FOUND: components/feature-modules/onboarding/components/previews/workspace-preview.tsx
- FOUND: components/feature-modules/onboarding/components/previews/templates-preview.tsx
- FOUND: components/feature-modules/onboarding/components/previews/team-preview.tsx
- FOUND: components/feature-modules/onboarding/config/onboard-steps.ts (modified)
- FOUND: components/feature-modules/onboarding/context/onboard.wrapper.tsx (modified)
- FOUND commits: b3710c8aa, fe32fa687

---
*Phase: 01-foundation-camera-system*
*Completed: 2026-03-11 (Task 3 pending visual verification)*
