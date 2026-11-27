# Phase 17 — Guest Import UX, Validation & Dark Mode Parity Matrix

**Components:** `GuestImportModal.jsx`, `GuestImportModal.css`, `model/guestImport.js`, `model/guestCsvUtils.js`

## 1. Five-Step Import Funnel States

| Step | User Goal | Validation & Server Authority | Responsive / Dark Mode Verification |
|---|---|---|---|
| 1. Choose source | Pick sample CSV/XLSX, upload workbook, paste delimited list, or paste public Google Sheet URL | Validates extension/size (`5 MB`), row cap (`1,000`), and passes public sheet links through server `inspectImport` proxy/validator | Fixed dark-mode hardcoded light surfaces (`#ffffff` / `#fdfbf7`) in `GuestImportModal.css` (`axe`: `1` serious `color-contrast` -> `0` across step rail, dropzone, and accordions) |
| 2. Map columns | Align detected spreadsheet headers to Koupreng fields (`name`, `phone`, `email`, `group`, `sideType`, `seatCount`, `tableNumber`, `note`) | Preserves leading zeros on Cambodian phone numbers via text normalization | Responsive CSS grid collapses cleanly below `640px` without horizontal overflow |
| 3. Review rows | Inspect parsed rows before write (`previewBatch` server dry-run) | Highlights duplicate phones, invalid counts, or quota constraints returned by server preview | High-contrast warning/error badge tokens (`--ui-theme-danger`) across Light and Obsidian Dark |
| 4. Confirm | Explicit review before persistence (`commitBatch` / `importGuests`) | Preserves draft/server truth; disables double-submit via `saving` | Uses semantic focus rings and `44px` button targets |
| 5. Results | Summary of created, skipped, or errored rows | Offers recoverable retry on conflict/network error | Status icons paired with Khmer/English labels |

## 2. Export & Spreadsheet Safety

- **UTF-8 BOM (`\uFEFF`)**: Preserves Khmer script (`Kantumruy Pro` / `Noto Sans Khmer` Unicode characters) in Microsoft Excel and Apple Numbers.
- **CSV Formula Injection Defense**: Both `exportGuestsToCsv` and `exportDeliveryReportCsv` pass every header and cell through `safeCsvCell` (`guestImport.js`), prefixing values matching leading `=`, `+`, `-`, `@`, `\t`, `\r`, `\n` or control chars with a single quote (`'`) and escaping inner double quotes.
- **Privacy Column Clarity**: Exported notes use explicit `"កំណត់ចំណាំឯកជន (Owner Private Note)"` header alignment.
