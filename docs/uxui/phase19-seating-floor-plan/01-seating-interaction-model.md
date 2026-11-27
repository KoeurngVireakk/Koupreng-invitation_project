# Phase 19 — Seating & Floor Plan Interaction Model

**Phase:** 19 — Floor plan, seating arrangement and guest assignment  
**Worktree:** `D:\Koupreng-Phase19-worktree` (`feat/phase19-seating-floor-plan`)  
**Base Verified SHA:** `c4b8c081557311fa04f269d94ffa12fa905c2d9e` (`PR #45`)

## 1. Dual Synchronized Workspace Modes

| Mode / Surface | Component | Capabilities | Mobile Behavior |
|---|---|---|---|
| Table List & Capacity Cards | `SeatingTableCard.jsx` | Shows capacity meter (`assignedSeats / capacity`), remaining seats/Full badge, assigned guest rows, keyboard-accessible `Move` & `Unassign` buttons, plus `FeedbackHost` delete confirmation | Default active tab (`Tables`); full-width stacked cards (`0px` overflow) |
| Interactive Floor Plan Studio | `SeatingFloorPlan.jsx` + `.css` | Pan/zoom viewport (`50%`–`200%` + `Fit view`), light blueprint / dark ballroom toggle, symmetrical center-aisle auto-arrange (`100`-table collision-free grid), table overlap push/tooltip, inspector drawer outside zoom surface | Dedicated mobile `Floor plan` tab inside `.sfp-viewport` (`overscroll-behavior: contain`) |
| Assignment & Unassigned Panel | `SeatingForms.jsx` | Guest search, guest/table select, live capacity arithmetic (`remainingSeats + existingGuestSeats`), inline error (`capacityExceeded`) preventing overfill | Dedicated mobile `Assign guests` tab with automatic focus transfer on Move/Assign |

## 2. Synchronized State & Unsaved Change Safety

- Dirty floor-plan edits call `onDirtyChange(isDirty)` back to `InvitationSeatingPage.jsx` AND attach `beforeunload` browser guard.
- Clicking `Export CSV` while `floorPlanDirty` is active opens an accessible `<ConfirmDialog>` warning that server-saved data is exported, preventing silent discrepancies between unpersisted canvas moves and printed CSVs.
- Switching `invitationId` resets `createOpen`, `floorPlanDirty`, and `mobilePanel`.
