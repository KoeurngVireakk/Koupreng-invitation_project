# Phase 22 USD/KHR Reconciliation & Export Comparison Fixtures

## 1. Strict Currency Separation Rules

1. **Expenses Ledger (`ExpensesList.jsx` / `ExpenseTable.jsx` / `ExpenseSummaryCards.jsx`)**:
   - Controlled mock fixture (`capture-phase22-evidence.mjs`):
     - `USD`: Planned `$4,500`, Actual `$3,000`, Remaining `$1,500` (`67%`)
     - `KHR`: Planned `1,200,000 ៛`, Actual `1,500,000 ៛`, Over Budget `+KHR 300,000` (`100%`)
   - Rendered as distinct `USD` and `KHR` summary card bands; KHR and USD amounts are never converted or summed into a blended total.
2. **Financial Report (`ReportsPage.jsx` / `financialReport.js`)**:
   - Controlled mock fixture (`capture-phase22-evidence.mjs`):
     - Gift Income (`ABA QR` + `Cash`): `$150.00` (USD) and `400,000 ៛` (KHR)
     - Planned Budget vs Actual Expenses: `$4,500.00` / `$3,000.00` (USD) and `1,200,000 ៛` / `1,200,000 ៛` (KHR)
     - Unpaid Balance shown separately for `USD` and `KHR`.

## 2. Export Consistency & Spreadsheet Formula Defense

- `apps/frontend-user/src/features/expenses/expenseCsv.js` (`buildFilteredExpensesCsv`, `exportFilteredExpensesCsv`):
  - Exports **only** the currently visible filtered subset (`filtered` matching active Category pill + Currency filter `All`/`USD`/`KHR` + Search text), never unfiltered stale rows.
  - Prepends UTF-8 BOM (`\uFEFF`) for reliable Khmer Unicode rendering in Excel/Sheets.
  - Passes every exported cell through `safeCsvCell` (`@/features/guests/model/guestImport`), prefixing leading formula characters (`=`, `+`, `-`, `@`, including after control/whitespace characters) with `'`.
  - Appends **separate** per-currency summary rows (`Subtotal (USD)` and `Subtotal (KHR)`) labeled `Summary (no currency mixing)` when multiple currencies appear in the filtered export.
- Unit-verified in `apps/frontend-user/src/features/expenses/expenses.test.jsx` (`=SUM(A1:A2)` -> `'=SUM(A1:A2)`, `@EvilVendor` -> `'@EvilVendor`, separate `Subtotal (USD)` and `Subtotal (KHR)` rows, and `KHR` filter isolation).
