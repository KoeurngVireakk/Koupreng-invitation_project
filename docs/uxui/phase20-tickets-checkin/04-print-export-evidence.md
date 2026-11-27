# Phase 20 — Print, Export & Visual Accessibility Evidence

## 1. Visual & Accessibility Before/After Comparison (Playwright + Axe-Core)

| Artifact | Route / Viewport / Theme | Before (Overflow / Axe) | After (Overflow / Axe) |
|---|---|---|---|
| `01-ticket-designer-light-en-1440.png` | `/app/events/42/tickets/design` · 1440 · Light EN | `0px` / `0` non-header | `0px` / `0` non-header + Print/PDF action |
| `02-ticket-designer-obsidian-km-1440.png` | `/app/events/42/tickets/design` · 1440 · Obsidian KM | `0px` / `0` non-header | `0px` / `0` non-header |
| `03-ticket-designer-mobile-preview-390.png` | `/app/events/42/tickets/design` · 390 · Obsidian KM | `0px` / `0` non-header | `0px` / `0` non-header |
| `04-qr-management-light-en-1440.png` | `/app/events/42/qr` · 1440 · Light EN | `0px` / `0` non-header | `0px` / `0` non-header + Print QR button |
| `05-qr-management-obsidian-km-1440.png` | `/app/events/42/qr` · 1440 · Obsidian KM | `0px` / `0` non-header | `0px` / `0` non-header (white QR quiet-zone) |
| `06-checkin-desk-light-en-1440.png` | `/app/events/42/check-in` · 1440 · Light EN | `0px` / **`1` (`color-contrast`: 4 nodes)** | `0px` / **`0` clean** (`.checkin-tag-pill.table` `#6e4f1d`) |
| `07-checkin-desk-obsidian-km-1440.png` | `/app/events/42/check-in` · 1440 · Obsidian KM | `0px` / `0` non-header | `0px` / `0` non-header |
| `08-checkin-desk-mobile-obsidian-390.png` | `/app/events/42/check-in` · 390 · Obsidian EN | `0px` / `0` non-header (cramped quick-nav wrap) | `0px` / `0` clean (stacked mobile quick-nav) |
| `09-checkin-celebration-modal-obsidian-1440.png` | `/app/events/42/check-in` modal · 1440 · Obsidian EN | `0px` / **`1` (`color-contrast`: 2 nodes)** | `0px` / **`0` clean** + bilingual `Table 05` |

*Note:* Shared host header `button[aria-haspopup="menu"]` has a pre-existing shell `label-content-name-mismatch` item outside Phase 20 feature scope and is excluded from per-feature delta counts (`metrics.json` records both `axeViolations` and `totalAxeRaw`).

## 2. Print & Export Readiness Checks
- Ticket Designer supports **PNG · 2×** (`1200×1800px`), **PNG · 3×** (`1800×2700px`), **Web Share / Copy**, **Telegram** (General only), and **Print / PDF** (`window.print()` with `.ticket-preview` isolated print stylesheet).
- QR Management (`QrPage.jsx`) supports **PNG download** (`downloadPngDataUri` magic-byte verified), **Print QR** (`@media print` in `QrPage.css`), **Copy Link**, and **Open Invitation**.
