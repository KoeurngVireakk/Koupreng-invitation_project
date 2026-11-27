# Phase 17 — Bulk Permissions, Delivery Workflow & Ten-Library UI/UX Review

## 1. Team Collaboration & Authorization Matrix (`EventContext`)

| Capability | Event Owner (`access.owner === true`) | Team Staff with `MANAGE_GUESTS` | Read-only Team Staff (`VIEW_GUESTS`) |
|---|---|---|---|
| View KPIs, guest table, search/filter, server pagination | Allowed | Allowed | Allowed |
| Add guest / Inline add / Edit guest / Double-click edit | Allowed | Allowed | Hidden & Disabled |
| Open Import CSV/XLSX Modal | Allowed | Allowed | Hidden & Disabled |
| Bulk Export Selected CSV (`exportSelection` / CSV download) | Allowed | Allowed | Allowed |
| Bulk Mark Sent (`feedback.confirm`) & Individual Mark Sent | Allowed | Hidden (Owner share tools only) | Hidden & Disabled |
| Bulk Delete (`feedback.confirm` destructive) & Row Delete | Allowed | Allowed | Hidden & Disabled |
| Access `/app/events/:id/delivery` | Allowed | Gated by owner tools | Redirect / Permission Alert |

*Implementation detail:* `GuestsPage.jsx` clears `selectedIds`, `editingGuest`, and `bulkBusy` inside `useEffect(..., [eventId])` whenever switching events and derives `groups`/`categories` from the active `eventId` key so cached selections never bleed across events.

## 2. Delivery Status Semantics Preserved

| Workspace | Action | Send Status Transition | Confirmation / Audit |
|---|---|---|---|
| `/guests` (`GuestQrModal` / `GuestRowActions`) | Copy invite link, copy message, open Telegram | Transitions `PENDING` -> `SENT` (owner only, on clipboard/share success) | Existing Phase 15–16 Playwright E2E contract preserved |
| `/delivery` (`InvitationDeliveryManager`) | `Copy link`, `Copy message` | Remains `PENDING` (allows host to inspect/preview copy first) | Unit-verified in `InvitationDeliveryManager.test.jsx` |
| `/delivery` (`InvitationDeliveryManager`) | `Open Telegram`, `WhatsApp`, `navigator.share` (non-aborted) | Calls `deliveryService.markShared` -> `SENT` | Recorded in delivery events |
| `/delivery` (`InvitationDeliveryManager`) | `Record manual share`, `Send Email`, `Send Reminder` | Requires accessible `<ConfirmDialog>` via `feedback.confirm(...)` (zero `window.confirm`) | Auditable delivery events + status/channel filtering + CSV export |

## 3. Canonical UI/UX Laws, Heuristics & Ten-Library Audit

- **Laws of UX**:
  - *Hick's Law*: Bulk actions remain hidden until 1+ rows are checked, surfacing a focused contextual `.guest-bulk-bar` instead of permanent clutter.
  - *Fitts's Law*: Minimum `44px` interactive height across checkboxes (`guest-select-control`), status pills, search clear buttons, and mobile delivery action buttons.
  - *Jakob's Law & Recognition over Recall*: Familiar checkbox header indeterminate state + contextual bulk bar + status/channel dropdowns inside Delivery History.
  - *Miller's Law*: 4-card Guest KPI header + grouped filters cleanly separated above the data table.
- **Nielsen Heuristics**: Non-blocking accessible confirmation modals (`feedback.confirm`), explicit owner-privacy `<Lock />` indicator on notes, live selection count (`aria-live="polite"`), and recoverable `ErrorState`.
- **Ten-Library Pattern Audit (Zero Extra Runtime Dependencies Added)**: Patterns adapted into project CSS & modular React primitives (`@radix-ui`-inspired modal accessibility, `lucide-react` uniform iconography, Obsidian Gold shadcn-style surface tokens, TanStack-like server-paginated query reset ergonomics, mobile responsive card collapse, and `prefers-reduced-motion` safeguards).
