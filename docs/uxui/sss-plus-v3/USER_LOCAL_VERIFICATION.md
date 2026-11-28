# Track U — Local Verification & Performance Ledger

**Branch:** `feat/frontend-user-premium-v3`  
**Worktree:** `D:/koupreng-v3-user`  
**Baseline:** `d05b4267cd67d69208808e8a4a6fa7b36deebb53`  
**Remote CI Status:** `REMOTE_CHECKS_NOT_AWAITED` (GitHub Actions / CodeQL not triggered or polled per assignment rules).

## Final Local Code, Build & Unit Suite

| Check | Command | Outcome | Notes |
|---|---|---|---|
| ESLint | `npm --prefix apps/frontend-user run lint` | Passed (`exit 0`) | Run after final source edit |
| Knip unused files/exports/deps | `npm --prefix apps/frontend-user run analyze:knip` | Passed (`exit 0`) | Run after final source edit |
| Knip dependencies | `npm --prefix apps/frontend-user run analyze:deps` | Passed (`exit 0`) | Run after final source edit |
| Vite production build | `npm --prefix apps/frontend-user run build` | Passed (`exit 0`) | 3,107 modules transformed |
| Vitest full suite | `npm --prefix apps/frontend-user test` | **258 / 258 files, 1,981 / 1,981 tests passed** | Happy-DOM suite run after final source edit |
| Template UI preservation check | `git diff --stat d05b4267 -- apps/frontend-user/src/features/templates/layouts/ apps/frontend-admin apps/backend` | Empty diff (0 files changed) | Template UI, Admin, and Backend strictly untouched |

## Final Targeted Playwright & Accessibility Checks (`--workers=2`, `vite preview`)

| Suite | Scope | Result | Notes |
|---|---|---|---|
| `phase7-accessibility.spec.js` + `marketing-pages.spec.js` + `event-overview-design.spec.js` + `package-purchase-ux.spec.js` | Desktop Chrome + Pixel 7 Mobile Chrome (`en` & `km`) | **73 passed, 1 pre-skipped, 0 failed** | Re-run after final CSS fix; Axe WCAG 2.0/2.1/2.2 checks pass on create, studio, packages, guests, team, analytics in both EN & KM |
| `after-final-3` visual matrix capture | 16 routes across Desktop 1440 (`en-light`), Mobile 390 (`km-dark`), plus Home/Events/Studio Tablet 768 | **35 captures, 0 horizontal overflow** | Confirmed dark-mode demo button contrast `#141414` on `#D8B875` and 768px Studio toolbar wrapping |
| Earlier full-suite sweep (`marketing-landing.spec.js`, `khmer-floral-gold.spec.js`, prior to final dark CTA CSS tweak) | Desktop + Mobile Chrome (`--workers=2`) | `khmer-floral-gold.spec.js`: 24/26 passed (`:176` E2E wizard step preselection mismatch); `marketing-landing.spec.js`: pre-existing `d05b4267` spec drift on lines 75, 120, 152, 184, 193, 226, 260 (mobile) | Mobile first-fold hero & empty-catalog `role="status"` checks passed |

## W11 Throttled Lab Benchmark (4x CPU, 1.6 Mbps Down / 750 Kbps Up, 150ms RTT)

- **Home (`/`, EN Light 1440x1000):** Observed LCP `2,804 ms` (vs V2 baseline median `3,144 ms`), CLS `0.0101` (`9,777 ms` total throttled document settle).
- **Invitation Studio (`/app/events/101/invitation`, EN Light 1440x1000):** Toolbar ready `5,800 ms`, live preview iframe ready `18,840 ms` (vs V2 median `23,145 ms`, **-18.6% readiness latency**).
- *Scope note:* Lab fixture-backed measurements in local Chromium; does not claim field CWV or live backend latency.
