# TODOs

## STALE connection detection

**What:** Implement STALE detection — connections with no recent sync activity should transition to STALE status.
**Why:** ConnectionStatus has a STALE state but nothing transitions to it. Connections that stop syncing (e.g., Nango sync disabled, provider API revoked) would remain in HEALTHY/DEGRADED indefinitely.
**Pros:** Users see accurate connection health; STALE connections surface in UI for investigation.
**Cons:** Needs a scheduled job or threshold check — adds infrastructure beyond the current event-driven model.
**Context:** STALE is already in the ConnectionStatus enum with valid transitions (STALE → SYNCING, STALE → DISCONNECTING, STALE → FAILED). Implementation options: (1) scheduled job that scans connections by lastSyncedAt, (2) check during health evaluation if syncState.updatedAt is older than threshold. The threshold value (e.g., 7 days) should be configurable.
**Depends on / blocked by:** Phase 4 health service must be complete first.

## SYNC-01 through SYNC-07 traceability cleanup

**What:** Update SYNC-01 through SYNC-07 from "Pending" to "Complete" in the REQUIREMENTS.md traceability table.
**Why:** These requirements were implemented in Phase 3 but the traceability table wasn't updated. The table currently shows them as Pending, which is inaccurate.
**Pros:** Accurate project tracking; prevents confusion about what's done.
**Cons:** None — pure housekeeping.
**Context:** Phase 3 plans 03-01 and 03-02 implemented all SYNC requirements. The checkbox section correctly marks them, but the traceability table at the bottom of REQUIREMENTS.md still shows "Pending."
**Depends on / blocked by:** Nothing — can be done anytime.
