# Phase 19 — Keyboard Alternatives, WCAG 2.5.3 & RBAC Permission Workflow

## 1. Complete Non-Drag Accessibility Alternatives

Every drag action on `SeatingFloorPlan.jsx` has equivalent non-pointer / keyboard controls:
1. **Arrow-key Precision Movement:** Focus any table node (`Move table ...`), Stage, Walkway, or Entrance and press `ArrowLeft/Right/Up/Down` (`1%` step) or `Shift + Arrow` (`5%` step).
2. **Numeric Coordinate Fieldset (`Advanced positioning`):** Select element (`stage`, `entrance`, `walkway`, or any `table:<id>`) and enter exact `X (%)` and `Y (%)` percentages clamped cleanly to safe ballroom bounds.
3. **Full Assignment Workflow in Form / Cards:** Select guest from list or dropdown -> choose target table with live remaining seat display -> adjust seat count & label -> Submit (`Assign` / `Move guest`) without opening the floor plan.

## 2. WCAG 2.2 AA & 2.5.3 Remediation Summary

- **Resolved `label-content-name-mismatch` on `6` Floor Plan Controls (`SeatingFloorPlan.jsx`):** Marked secondary decorative text inside draggable/selectable buttons (`sfp-drag-handle-hint`, `sfp-stage__sub`, `sfp-table-label`, `sfp-table-cap`, collision/highlight badges) `aria-hidden="true"`, keeping accessible names strictly aligned with visible primary labels (`stage`, `walkway`, `entrance`, `tableName`).
- **Resolved `color-contrast` across Light & Obsidian Dark Floor Plan (`SeatingFloorPlan.css`):** Unified `.sfp-toolbar`, `.sfp-btn--outline`, `.sfp-options`, `.sfp-advanced`, `.sfp-detail-panel`, `.sfp-legend`, `.sfp-segmented`, and `.sfp-tables-counter-badge` onto `--ui-theme-*` semantic tokens; deepened `.sfp-walkway__label` (`#4b3516` on `#e9dfce` beige aisle, `#fef3c7` on horizontal crimson carpet) and removed sub-4.5 opacity on `.sfp-drag-handle-hint`.
- **Removed Blocking `window.confirm`:** Both table delete (`SeatingTableCard.jsx`) and reload discard (`SeatingFloorPlan.jsx`) now route through `feedback.confirm(...)`.

## 3. Team RBAC Gating (`MANAGE_SEATING`)

- Derived `canManageSeating` via `EventContext.access` (`owner === true || permissions.includes('MANAGE_SEATING')`).
- Read-only collaborators (`VIEW_SEATING` without `MANAGE_SEATING`) can switch between List and Floor Plan, inspect tables/guests, and export CSV while all creation, drag/coordinate edits, assignments, unassignments, and deletions are cleanly hidden & disabled (`readOnly={true}`, `canManage={false}`).
