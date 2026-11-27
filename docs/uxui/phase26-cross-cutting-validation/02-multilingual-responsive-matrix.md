# Phase 26 — Multilingual (EN/KM) & 12-Viewport Responsive Matrix

- **Tooling:** `scripts/qa/capture-phase26-validation.mjs --stage=after` & `apps/frontend-user/tests/e2e/phase26-cross-cutting-validation.spec.js`.
- **Widths Verified (`12` viewports):** `320, 360, 375, 390, 414, 430, 600, 768, 820, 1024, 1280, 1440`.

## 1. Responsive Overflow Matrix (`scrollWidth - innerWidth`, px)

| Route | `320`..`1440` (All 12 Widths) | Result |
|---|---:|---|
| `/` | `0px` across all 12 widths | `PASS_LOCAL` |
| `/templates` | `0px` across all 12 widths | `PASS_LOCAL` |
| `/login` | `0px` across all 12 widths | `PASS_LOCAL` |
| `/app/events` | `0px` across all 12 widths | `PASS_LOCAL` |
| `/app/events/101/guests` | `0px` across all 12 widths | `PASS_LOCAL` |
| `/app/events/101/budget` | `0px` across all 12 widths | `PASS_LOCAL` |
| `/app/events/101/reports` | `0px` across all 12 widths | `PASS_LOCAL` |
| `/i/audit-event` | `0px` across all 12 widths | `PASS_LOCAL` |

Total viewport checks: **`96 / 96` (`0` overflow failures)**, plus short landscape (`844x390`) and `200%` font scale (`html { font-size: 200% }`) verified in Playwright (`0px` overflow).

## 2. Multilingual EN/KM Parity

- `useLanguageStore` normalizes stored locales strictly to `"km"` or `"en"`, synced to `document.documentElement.lang` in `App.jsx`.
- Toggling `.app-language-toggle` switches `"en" <-> "km"` while preserving active host route and keeping dropdown keyboard focus/Escape restoration intact.
- Cross-device checks on physical iOS Safari, Android Chrome, and native Telegram/Facebook WebViews remain **`BLOCKED_EXTERNAL`**.
