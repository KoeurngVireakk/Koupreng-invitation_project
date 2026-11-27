# Phase 17 — Guest CRM & Delivery Route and Component Inventory

**Phase:** 17 — Guest CRM, groups, import and delivery management  
**Worktree:** `D:\Koupreng-Phase17-worktree` (`feat/phase17-guest-crm`)  
**Base Verified SHA:** `ae9f7c8395f56f18318575e2c8e36fdfaa8a0ddd`

## 1. Canonical & Alias Routes Governed by Phase 17

| Route ID | Canonical Route | Aliases | Primary Feature Component | Access & Authority |
|---|---|---|---|---|
| `FU-R039` / `FU-R078` / `FU-R090` / `FU-R103` | `/app/events/:eventId/guests` | `/dashboard/guests`, `/guests`, `/dashboard/invitations/:invitationId/guests` | `features/guests/GuestsPage.jsx` | Owner or team collaborator (`VIEW_GUESTS` read; `MANAGE_GUESTS` mutate/delete/import) |
| `FU-R046` / `FU-R088` / `FU-R097` / `FU-R100` | `/app/events/:eventId/delivery` | `/dashboard/delivery`, `/dashboard/share`, `/dashboard/invitations/:invitationId/delivery` | `features/invitations/InvitationDeliveryManager.jsx` | Owner (`isOwner`) delivery readiness, email dispatch, manual share confirmation, delivery CSV report |

## 2. Architecture & Component Responsibilities

| Component / Module | Responsibility | Key Phase 17 Enhancement |
|---|---|---|
| `features/guests/GuestsPage.jsx` | Server-authoritative paged guest workspace (`25`/`50`/`100` per page), overview KPIs, status tabs, search/group/category filters, bulk bar, import/QR/ticket modals | Enforces `canManageGuests` from `EventContext.access`, resets `selectedIds`/`editingGuest` on `eventId` change, adds accessible `.guest-bulk-bar` (`Export CSV`, `Mark sent`, `Delete selected`, `Clear selection`) using `feedback.confirm` |
| `features/guests/GuestWorkspace.css` | Workspace layout tokens across light warm luxury & Obsidian `#090909` dark mode | Semantic KPI icon classes (`pe-summary-icon-*`), `.guest-note` lock pill, `.guest-bulk-bar` styling, fixed `#ffffff`/`white` form/select leaks (`L167`, `L300`) |
| `features/guests/components/GuestStats.jsx` | 4-card summary bar (Guest records, Reserved seats, Marked sent/opened, Responded) | Removed raw hex `text-[#B98B42]` / Tailwind color classes in favor of semantic token classes |
| `features/guests/components/GuestTable.jsx` | Responsive table/mobile card rows, inline edit/add row, double-click edit, private note accordion | Guards double-click edit when mutating callbacks are absent; adds `<Lock />` + `Owner only` / `ឯកជន` indicator on guest notes |
| `features/guests/components/GuestImportModal.jsx` + `.css` | 5-step CSV/XLSX/paste/Google Sheets import wizard (mapping, server preview, commit, summary) | Fixed Obsidian Dark Mode contrast defect (replaced hardcoded `#ffffff`/`#fdfbf7`/`#2a1f10`/`#991b1b` with semantic `--ui-theme-*` tokens; `axe` violations `1` -> `0`) |
| `features/guests/model/guestCsvUtils.js` | Client CSV download helpers + spreadsheet formula defense | Extracted shared `triggerCsvDownload`, applied `safeCsvCell` to every header/cell + `\uFEFF` BOM, labeled private note column `"កំណត់ចំណាំឯកជន (Owner Private Note)"`, added `exportDeliveryReportCsv` |
| `features/invitations/InvitationDeliveryManager.jsx` + `DeliveryWorkspace.css` | Delivery summary, recipient search/filter, personal share (`Copy link`, `Copy message`, Telegram, WhatsApp, `Share`), email/reminder dispatch, event timeline | Replaced blocking `window.confirm` on email & manual share with async `feedback.confirm`, added status/channel filters + CSV report export in `.delivery-history`, fixed dark mode surface leaks & `prefers-reduced-motion` |
