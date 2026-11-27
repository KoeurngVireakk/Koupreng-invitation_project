# Phase 22 Chart Accessibility, Contrast & Obsidian Dark Mode Evidence

## 1. Before vs After Quantitative Axe-core & Overflow Verification

Captured via `scripts/qa/capture-phase22-evidence.mjs` against production `dist/` bundles across `1440x900` Desktop and `390x844` Mobile viewports, English and Khmer locales, and Light (`data-color-mode="light"`) vs Obsidian Dark (`data-color-mode="dark"`) themes:

| Capture File | Viewport / Mode / Lang | Overflow Before -> After | Non-Header Axe Violations Before -> After | Root Cause Remediated |
| :--- | :--- | :--- | :--- | :--- |
| `01-expenses-budget-light-en-1440.png` | `1440px` Light EN | `0px -> 0px` | `3 -> 0` | `.exp-hero-tag` (`#6e4e1f`), `.exp-amount.is-over` (`#b91c1c`), `.exp-over-tag` (`#991b1b` on `#fee2e2`) |
| `02-expenses-budget-obsidian-km-1440.png` | `1440px` Dark KM | `0px -> 0px` | `1 -> 0` | `.exp-amount.is-over` (`#fca5a5`) replacing inline `#ef4444` + Obsidian badge/table/hero tokens |
| `03-expenses-budget-mobile-390.png` | `390px` Dark EN | `0px -> 0px` | `2 -> 0` | `.exp-amount.is-over` (`#fca5a5`), `.exp-over-tag` (`#fecaca` on `rgba(239,68,68,0.22)`) + mobile toolbar wrap |
| `04-attendance-analytics-light-en-1440.png` | `1440px` Light EN | `0px -> 0px` | `0 -> 0` | Semantic CSS tokens (`--app-surface`, `--app-border`, `--app-ink`) + inverted-date `role="alert"` |
| `05-attendance-analytics-obsidian-km-1440.png` | `1440px` Dark KM | `0px -> 0px` | `0 -> 0` | Obsidian surface/bar/table contrast tokens + `Refresh` recovery + `prefers-reduced-motion` |
| `06-financial-report-light-en-1440.png` | `1440px` Light EN | `0px -> 0px` | `12 -> 0` | Removed Tailwind `dark:text-*` class leakage + overrode `.money-card.is-*` cascade to `#047857` / `#92400e` / `#b91c1c` |
| `07-financial-report-obsidian-km-1440.png` | `1440px` Dark KM | `0px -> 0px` | `0 -> 0` | `:root[data-color-mode="dark"]` financial card, header, button, and tabular metric tokens |
| `08-financial-report-mobile-390.png` | `390px` Dark EN | `0px -> 0px` | `0 -> 0` | Responsive grid collapse, legible tabular numerals, `0px` horizontal overflow |

## 2. Chart & Data Alternatives

- `AttendanceAnalytics.jsx`: Visual bar chart (`analytics-bars`, marked decorative with `aria-hidden="true"`) is paired immediately with an accessible scrollable data `<table>` (`<caption>Daily data equivalent for the chart above</caption>`, keyboard `tabIndex={0}`, `role="region"`), explicit timezone (`Asia/Phnom_Penh`, `UTC+07`), and explicit unit (`records`).
- `ExpenseSummaryCards.jsx` & `CategoryBreakdown.jsx`: Visual progress bars carry `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, and descriptive `aria-label` attributes.
- Reduced Motion: `@media (prefers-reduced-motion: reduce)` rules disable hover lifts, modal pop animations, and progress transitions across `ExpensesPage.css`, `BudgetPages.css`, `AttendanceAnalytics.css`, and `ReportsPage.css`.
