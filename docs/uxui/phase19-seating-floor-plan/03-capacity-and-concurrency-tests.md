# Phase 19 — Capacity, Collision, Concurrency & Regression Verification

| Verification Scenario | Mechanism / Guard | Source Verification |
|---|---|---|
| Assignment exceeds table remaining seats | Computes `remaining = table.remainingSeats + currentSameTableSeats`; blocks submit with `role="alert"` (`capacityExceeded`) | `SeatingForms.jsx` + `seatingAccessibility.test.jsx` |
| Auto-arrange `30` and `100` tables collision-free | Symmetrical 2-wing / 5-column dynamic grid respects bounds and minimum inter-table distance (`>= 12` for 30, `>= 6.8` for 100) | `seating.test.jsx` (2 unit tests passed) |
| Optimistic layout save conflict / rejection | `useSeating.saveTablePositions` checks `layout.version` & confirms server response version `=== layout.version + 1`; failed save retains `Unsaved` status | `useSeating.js` + `seatingAccessibility.test.jsx` |
| Floor plan vs form edit preservation | Walkway orientation changes retain moved table positions (`30%`) and preserve unsaved indicator | `seatingAccessibility.test.jsx` |
| Export while floor plan has unsaved moves | Warns via `<ConfirmDialog>` before calling `seatingService.exportCsv` | `InvitationSeatingPage.jsx` + `seating.test.jsx` |
| Staff lacking `MANAGE_SEATING` | `canManageSeating = false` hides Create table, disables assignment form & card mutations, locks floor plan `readOnly={true}` | `InvitationSeatingPage.jsx` + `seating.test.jsx` |
| Blocking `window.confirm` removal | Replaced with async `feedback.confirm` in `SeatingTableCard.jsx` and `SeatingFloorPlan.jsx` | `SeatingTableCard.jsx`, `SeatingFloorPlan.jsx` |
