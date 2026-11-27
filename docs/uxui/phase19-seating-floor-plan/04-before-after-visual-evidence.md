# Phase 19 — Before / After Visual & Accessibility Evidence

**Capture Tool:** `scripts/qa/capture-phase19-evidence.mjs`  
**Playwright Browser:** Chromium (`1440x900`, `768x1024`, `390x844`) with `@axe-core/playwright`  
**After Capture:** `2026-11-27T03:45:36.515Z` (`evidence/after/metrics.json`)

## 1. Visual & Axe Comparison

| Screenshot Case | Viewport / Theme / Lang | Before Overflow | Before Contrast Axe | After Overflow | After Contrast Axe | Visual / A11y Outcome |
|---|---|---|---|---|---|---|
| `01-seating-list-light-en-1440.png` | `1440` Light `EN` | `0px` | `0` | `0px` | `0` | Light warm cards, KPI strip & assignment panel verified (`1` shell header menu rule) |
| `02-seating-list-obsidian-km-1440.png` | `1440` Dark `KM` | `0px` | `0` | `0px` | `0` | Obsidian dark cards, Khmer capacity badges & Export CSV guard verified |
| `03-seating-tablet-dark-768.png` | `768` Dark `EN` | `0px` | `0` | `0px` | `0` | Tablet 2-column grid reflow (`290px` assignment panel) verified |
| `04-seating-mobile-guests-km-390.png` | `390` Light `KM` | `0px` | `0` | `0px` | `0` | Mobile `Assign guests` task tab & sticky controls fit cleanly |
| `05-seating-floorplan-light-1440.png` | `1440` Light `EN` | `0px` | **`1` (`.sfp-drag-handle-hint` contrast)** | `0px` | **`0`** | Deepened `.sfp-walkway__label` (`#4b3516`) & `.sfp-drag-handle-hint` opacity `1` (`>= 7:1` contrast) |
| `06-seating-floorplan-obsidian-1440.png` | `1440` Dark `EN` | `0px` | **`3` (`100%`, `Venue options`, walkway)** | `0px` | **`0`** | **Fixed unreadable white-on-white dark-mode toolbar, segmented switcher, zoom readout & legend** onto Obsidian `--ui-theme-surface` tokens |
| `07-seating-floorplan-mobile-390.png` | `390` Dark `EN` | `0px` | **`3` (`100%`, `Venue options`, walkway)** | `0px` | **`0`** | Mobile floor plan toolbar & scrollable `.sfp-viewport` render in full Obsidian dark mode |
| `08-seating-empty-obsidian-390.png` | `390` Dark `KM` | `0px` | `0` | `0px` | `0` | Empty state CTA hierarchy verified (`axe=0`) |

*Honest A11y Note (`label-content-name-mismatch`):* Draggable canvas nodes retain their explicit `aria-label` contracts tested by `seatingAccessibility.test.jsx` (`Move main stage`, `Move table ...`, `Move entrance`), and the global header profile trigger keeps its shell markup. All color-contrast defects on Floor Plan (`3` dark-mode + `1` light-mode) were eliminated (`0` contrast violations remaining across all `8/8` scenes).
