# Phase 20 Formal Acceptance Report — Ticket Design, QR, Delivery, Attendance & Check-In

**Date:** 2026-11-27 (`UTC+07:00`)  
**Worktree & Branch:** `D:\Koupreng-Phase20-worktree` (`feat/phase20-tickets-checkin`)  
**Base Verified `origin/main` SHA:** `2f773ba69b82f7ac3ad0d1b985d019b906198577` (`PR #46`)  
**Selected Skills (per `.agents/ROUTER.md`):** Primary `ui-ux-pro-max`; Supporting `wcag-audit-patterns`, `koupreng-qa-release`  

---

## 1. Executive Verdict

- **Phase 20 Status:** **`PASS_LOCAL`** across all functional, Obsidian dark mode / light mode contrast (`6 -> 0` non-header WCAG contrast violations across 9 views), RBAC permission gating, print/PDF ticket & QR readiness, offline rejection, full Vitest (`254/254` files, `1950/1950` tests), and Playwright v2 cross-browser E2E gates (`P20-G01`–`P20-G06`).
- **Deferred External Gate (`P20-G07`):** Physical hardware QR camera & native in-app WebView verification remains `DEFERRED_P26` alongside `P16-G12`/`P16-G13`.
- **Scope Discipline:** Zero modifications to `apps/frontend-admin`, `apps/backend`, Flyway migrations, payments, or preserved stashes/historical worktrees.

---

## 2. Implemented Improvements

1. **Ticket Designer & Print/PDF Export Readiness (`TicketActions.jsx`, `TicketDesigner.jsx`, `TicketPreview.jsx`, `tickets.css`):**
   - Added a `Print / PDF` (`window.print()`) action alongside 2× (`1200×1800px`) / 3× (`1800×2700px`) PNG export, Share, Copy Link, and General-only Telegram share, with dedicated `@media print` stylesheets isolating `.ticket-preview` cleanly without application chrome.
   - Styled error alerts (`.ticket-error-banner`), upload progress bars (`.ticket-upload-status`), print/QR-authority note (`.ticket-print-note`), in-app browser long-press preview fallback, and cleared stale preview state on canvas render error (`setHasRendered(false)`).
2. **QR Management Obsidian Dark Mode & Print Polish (`QrPage.jsx`, `QrPage.css`):**
   - Added a `Print QR` action (`window.print()`) and migrated `.qr-card`, `.qr-title`, `.qr-guest`, `.qr-type-badge`, `.qr-link`, and `.qr-empty` to semantic `--app-*` tokens while keeping `.qr-frame` pure `#ffffff` with `16px` quiet-zone padding for scanner legibility in dark mode.
3. **Check-In Desk Negative Scenarios, Contrast & RBAC Hardening (`InvitationCheckInPage.jsx`, `useCheckInDesk.js`, `QrCameraScanner.jsx`, `InvitationPages.css`):**
   - Eliminated Obsidian Dark Mode contrast failures inside Celebration Modal (`#2a1f10` guest name and `#8c7a65` subtitle migrated to `var(--app-ink)` / `var(--app-muted)` -> `axe 2 -> 0`) and Light Mode `.checkin-tag-pill.table` (`var(--ui-theme-gold-text, #6e4f1d)` -> `axe 4 -> 0`), localized bilingual table numbers in Celebration Modal (`Table 05` / `តុលេខ 05`), and fixed mobile quick-nav spacing at `390px`.
   - Separated check-in scan rejections (`INVALID`, `OFFLINE`, `DUPLICATE`, `SUCCESS`) from page-level `AccessFailureState` (`401`/`403`/load failure) with explicit Retry and accessible dismiss controls (`aria-label`), blocking offline server check-in fabrication (`navigator.onLine === false` / `ERR_NETWORK`).
   - Enforced `MANAGE_CHECKIN` RBAC (read-only banner + disabled camera/manual scan/row buttons + hidden undo action) and guarded `QrCameraScanner` against stale `"verifying"` status (`await onScanRef.current(token)` + `2.5s` same-token dedup + `isInAppBrowser()` WebView advisory).

---

## 3. Observed Verification Results

- `npm --prefix apps/frontend-user run lint` -> Exit `0`
- `npm --prefix apps/frontend-user run analyze:knip` -> Exit `0`
- `npm --prefix apps/frontend-user run analyze:deps` -> Exit `0`
- `npm --prefix apps/frontend-user run build` -> Exit `0` (`1.42s`)
- `npm --prefix apps/frontend-user run test` -> Exit `0` (**`254 passed (254)` files / `1950 passed (1950)` tests** in `44.25s`)
- `node scripts/qa/capture-phase20-evidence.mjs --stage=after --port=4335` -> Exit `0` (**`9/9` captures with `0px` horizontal overflow and `0` non-header Axe violations**, down from `6` contrast violations before)
- `npx playwright test --config=playwright.frontend-user-v2.config.js` -> Exit `0` (**`27 passed, 5 skipped`** desktop-only on mobile, **`0 failed`**, `1.2m`)
- `node scripts/sync-design-tokens.cjs --check` & `python scripts/validate-agent-routing.py` -> Exit `0`

---

## 4. Phase 20 Deliverables Index

- [`docs/uxui/phase20-tickets-checkin/01-ticket-design-specification.md`](./phase20-tickets-checkin/01-ticket-design-specification.md)
- [`docs/uxui/phase20-tickets-checkin/02-qr-privacy-contract-review.md`](./phase20-tickets-checkin/02-qr-privacy-contract-review.md)
- [`docs/uxui/phase20-tickets-checkin/03-checkin-state-diagram.md`](./phase20-tickets-checkin/03-checkin-state-diagram.md)
- [`docs/uxui/phase20-tickets-checkin/04-print-export-evidence.md`](./phase20-tickets-checkin/04-print-export-evidence.md)
- [`docs/uxui/phase20-tickets-checkin/05-camera-manual-device-matrix.md`](./phase20-tickets-checkin/05-camera-manual-device-matrix.md)
- [`docs/uxui/phase20-tickets-checkin/phase20-acceptance-ledger.json`](./phase20-tickets-checkin/phase20-acceptance-ledger.json)
- [`docs/uxui/FRONTEND_USER_ROUTE_FEATURE_STATE_MATRIX.csv`](./FRONTEND_USER_ROUTE_FEATURE_STATE_MATRIX.csv)

---

## 5. Next Sequential Phase Handoff

Proceed after PR `#47` merge to **`Phase 21 — Gifts, purchases, payments, contributions and transactional UX`** (`feat/phase21-gifts-payments`) in an isolated worktree synchronized to updated `origin/main` (remaining Gemini-only phase before switching to the independent Codex review workflow in Phases 22–27).
