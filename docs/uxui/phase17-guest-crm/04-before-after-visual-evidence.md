# Phase 17 — Before / After Visual Evidence & Contrast Audit

**Capture Tool:** `scripts/qa/capture-phase17-evidence.mjs`  
**Playwright Browser:** Chromium (`1440x900`, `768x1024`, `430x932`, `390x844`) with `@axe-core/playwright`  
**Before Capture:** `2026-11-27T02:30:36.676Z` (baseline `ae9f7c83` in `evidence/before/`)  
**After Capture:** `2026-11-27T02:39:36.539Z` (post-edit `feat/phase17-guest-crm` in `evidence/after/`)

## 1. Visual & Axe Delta Table

| Scenario Screenshot | Viewport / Theme / Lang | Before Overflow | Before Axe | After Overflow | After Axe | Observed Improvement |
|---|---|---|---|---|---|---|
| `01-guests-light-en-1440.png` | `1440` Light `EN` | `0px` | `0` | `0px` | `0` | Clean semantic KPI icon tokens (`pe-summary-icon-*`), lock privacy pill on private guest note |
| `02-guests-obsidian-km-1440.png` | `1440` Dark `KM` | `0px` | `0` | `0px` | `0` | Unified Obsidian `#090909` inputs/selects in inline add row & page-size dropdown |
| `03-guests-tablet-dark-768.png` | `768` Dark `EN` | `0px` | `0` | `0px` | `0` | Tablet sidebar toggle and card reflow verified |
| `04-guests-mobile-light-km-390.png` | `390` Light `KM` | `0px` | `0` | `0px` | `0` | Clean Khmer Kantumruy Pro stack and mobile guest cards |
| `05-guests-mobile-dark-430.png` | `430` Dark `EN` | `0px` | `0` | `0px` | `0` | High-contrast KPI cards and scrollable status pills in Obsidian Dark |
| `06-guests-selected-bulk-1440.png` | `1440` Dark `EN` | `0px` | `0` | `0px` | `0` | Contextual Champagne Gold `.guest-bulk-bar` (`1 selected`: `Export CSV`, `Mark sent`, `Delete selected`, `Clear selection`) |
| `07-guests-import-modal-dark-1440.png` | `1440` Dark `EN` | `0px` | **`1` (`color-contrast`, 3 nodes)** | `0px` | **`0`** | Fixed unreadable white-box contrast leak in `GuestImportModal.css` (`li[aria-current="step"]`, `.import-sheets > summary`, paste accordion) |
| `08-guests-empty-km-390.png` | `390` Dark `KM` | `0px` | `0` | `0px` | `0` | Empty state CTA hierarchy and Khmer typography verified |
| `09-delivery-dark-en-1440.png` | `1440` Dark `EN` | `0px` | `0` | `0px` | `0` | Eliminated light `#ffffff` card/form leaks, unified `DeliveryWorkspace.css` Obsidian surfaces, added history filters & CSV export |
| `10-delivery-mobile-km-390.png` | `390` Light `KM` | `0px` | `0` | `0px` | `0` | Mobile card delivery controls and Khmer confirmation labels preserved |

## 2. Artifact Paths

- Before captures & metrics: [`docs/uxui/phase17-guest-crm/evidence/before/`](./evidence/before/metrics.json)
- After captures & metrics: [`docs/uxui/phase17-guest-crm/evidence/after/`](./evidence/after/metrics.json)
