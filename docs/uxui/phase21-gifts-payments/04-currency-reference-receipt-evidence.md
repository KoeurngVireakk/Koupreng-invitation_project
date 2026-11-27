# Phase 21 — Currency, Order Reference & Visual Accessibility Evidence

## 1. Before vs After Screenshot & WCAG 2.2 AA Audit (`11` Captures)

| Screenshot | Route / Viewport / Mode | Before (`overflowX` / Non-Header Axe) | After (`overflowX` / Non-Header Axe) |
|---|---|---|---|
| `01-template-checkout-light-en-1440.png` | `/templates/khmer-floral-gold/checkout` · 1440 · Light EN | `0px` / `0` | `0px` / `0` + active `$15.00` server catalog offer |
| `02-template-checkout-obsidian-km-1440.png` | `/templates/khmer-floral-gold/checkout` · 1440 · Obsidian KM | `0px` / **`5` `color-contrast`** (`.checkout-kicker`, `h1`, card headings) | `0px` / **`0` clean** (Obsidian `#141414` cards) |
| `03-payment-status-qr-light-en-1440.png` | `/payments/ORD-2026-PENDING/status` · 1440 · Light EN | `0px` / `0` | `0px` / `0` + transaction type bar |
| `04-payment-status-qr-obsidian-km-1440.png` | `/payments/ORD-2026-PENDING/status` · 1440 · Obsidian KM | `0px` / **`4` `color-contrast`** (invisible status badge & dark `h1`) | `0px` / **`0` clean** (amber dark badge + crisp QR quiet-zone) |
| `05-payment-status-qr-mobile-390.png` | `/payments/ORD-2026-PENDING/status` · 390 · Obsidian EN | `0px` / **`6` `color-contrast`** (dark footer links & header) | `0px` / **`0` clean** |
| `06-payment-history-obsidian-km-1440.png` | `/app/payments` · 1440 · Obsidian KM | `0px` / `0` | `0px` / `0` + status filter, Refresh & currency note |
| `07-payment-receipt-obsidian-en-1440.png` | `/app/payments/ORD-2026-PAID` · 1440 · Obsidian EN | `0px` / `0` | `0px` / `0` + `Print / PDF` button & Server-Verified eyebrow |
| `08-subscription-packages-obsidian-km-1440.png` | `/app/packages` · 1440 · Obsidian KM | `0px` / **`6` `color-contrast`** (`pkg-history th` cream on light text) | `0px` / **`0` clean** (`--app-subtle` table header) |
| `09-subscription-checkout-modal-obsidian-1440.png` | `/app/packages` modal · 1440 · Obsidian EN | `0px` / `0` | `0px` / `0` |
| `10-wedding-gifts-ledger-obsidian-km-1440.png` | `/app/events/42/gifts` · 1440 · Obsidian KM | `0px` / **`1` `label-content-name-mismatch`** | `0px` / **`0` clean** (`USD 150 · KHR 200,000` + tx clarity note) |
| `11-wedding-gifts-light-mobile-390.png` | `/app/events/42/gifts` · 390 · Light EN | `0px` / **`5`** (`4` contrast on `.wg-hero-tag` + `.wg-danger-btn`; `1` label mismatch) | `0px` / **`0` clean** |

**Net Accessibility Result:** Eliminated **`27/27`** non-header WCAG 2.2 AA violations across all 11 checkout, payment status, subscription history, receipt, and gift ledger surfaces (`0px` horizontal overflow across all mobile & desktop frames).

## 2. Automated Test Evidence
- `npm --prefix apps/frontend-user run lint` -> Exit `0`
- `npm --prefix apps/frontend-user run analyze:knip` & `analyze:deps` -> Exit `0`
- `npm --prefix apps/frontend-user run test` -> Exit `0` (**`255 passed (255)` files, `1952 passed (1952)` tests** in `42.87s`, including `PaymentSuccessPage.test.jsx`, `PaymentReceiptPage.test.jsx`, `PaymentStatusPage.test.jsx`, `PaymentQrCard.test.jsx`, `TemplateCheckoutPage.test.jsx`, `SubscriptionPackagesPage.test.jsx`, `gifts.test.jsx`, `khqr.test.js`, `checkoutOffer.test.js`)
- `npx playwright test --config=playwright.frontend-user-v2.config.js` -> Exit `0` (`27 passed, 5 skipped` desktop-only on mobile, `0 failed`, `1.1m`)
