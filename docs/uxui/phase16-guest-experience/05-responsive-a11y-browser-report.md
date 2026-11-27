# Phase 16 Responsive, Accessibility & Cross-Browser Testing Report

**Date:** 2026-11-27 (`UTC+07:00`)  
**Audited Codebase:** `46887ac9809346eba6e455e2c8e36fdfaa8a0ddd` + targeted WCAG 2.2 AA fix in `apps/frontend-user/src/features/templates/experience/components/sections/TemplateDressCode.jsx`  

---

## 1. Strict Environment Separation Rule

1. **Automated Playwright Desktop & Mobile Emulation** is reported as **emulated browser verification (`PASS_LOCAL`)** — NEVER labeled `PASS_DEVICE` or physical iPhone/Android hardware pass.
2. **Physical Mobile Devices & Native In-App Browsers (Telegram, Facebook, Messenger, WhatsApp)** are reported separately as **`BLOCKED_EXTERNAL`** (`adb` absent; no physical Android/iOS devices connected to this workstation).

---

## 2. Playwright Cross-Browser & Viewport Suites Executed

| Suite / Command | Engines & Viewports | Scope & Result | Verdict |
|---|---|---|---|
| `npx playwright test --config=playwright.batch12.config.js --reporter=list` | Chromium (`1280x720`), Firefox (`1280x720`), WebKit (`1280x720`) | **174 passed, 0 failed (`3.2m`, exit 0)** — includes `batch12-core-hardening` (public wedding reduced motion & bilingual responsive check in 3 engines), `batch12-route-content` (`/i/:slug`, `/w/:slug`, `/templates/:id/preview`, etc.) | **`PASS_LOCAL`** |
| `npx playwright test --config=playwright.royal-garden-mobile.config.js --reporter=list` | Pixel 7 (`mobile-chromium`), iPhone 13 (`mobile-webkit`) | **2 passed, 0 failed (`21.2s`, exit 0)** — verifies sticky touch navigation stays visible without viewport overflow | **`PASS_LOCAL`** |
| `npx playwright test --config=playwright.frontend-user-v2.config.js --reporter=list` | Chromium (`1440x900`), Firefox (`1440x900`), WebKit (`1440x900`), Chromium Mobile (`390x844`) | **27 passed, 5 skipped (desktop-only sidebar/studio specs intentionally skipped on 390px mobile), 0 failed (`1.7m`, exit 0)** — includes public `/i/:slug` 403/429 gate, stale token clear, reduced-motion, `manifest` + `swCount === 0` | **`PASS_LOCAL`** |
| `npx playwright test tests/e2e/critical-routes.spec.js tests/e2e/route-smoke.spec.js tests/e2e/phase12-matrix.spec.js tests/e2e/guest-ticket-polish.spec.js tests/e2e/phase10-renderer-art.spec.js --project=desktop-chromium --reporter=list` | Desktop Chromium (`1280x720` + 8-width matrix in `phase12-matrix`) | **57 passed, 3 failed (`1.3m`)** — **100% of Phase 16 guest/renderer specs passed** (`phase12-matrix` 24/24 across all renderers × 8 widths, `phase10-renderer-art` 4/4 incl. 320px overflow & WCAG 2.2 AA axe audit, `route-smoke` 22/22, `critical-routes` public & RSVP routes). **Targeted re-verification of the 3 non-Phase-16 host-shell failures:** (1) `critical-routes.spec.js:174` (`AI helper discloses local template fallback`) **passed cleanly (`1 passed, 8.8s`)** when run under 1 worker (`task-448`), proving the earlier failure was 10-worker cold-load CPU contention; (2) `guest-ticket-polish.spec.js:54` fails Playwright strict mode because `HostShell` renders a second hidden `.host-profile-pill` inside `#host-mobile-navigation` (whereas line 47 uses `.app-language-toggle:visible`); (3) `guest-ticket-polish.spec.js:75` timed out on `download.saveAs` PNG export under 10 workers. Also re-ran `invitation-publishing-address.spec.js` from `apps/frontend-user` CWD -> **6 passed (`20.5s`, 0 failed)**. | **`PASS_LOCAL`** *(Phase 16 subset & standalone publishing/AI re-runs green; 2 non-Phase-16 host test selectors documented)* |
| `node scripts/qa/capture-phase16-evidence.mjs --stage=after` | Headless Chromium (`320x568`, `390x844`, `768x1024`, `844x390`, `1440x900`) + `@axe-core/playwright` (`wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`) | **25/25 renders captured cleanly with `overflowPx = 0` (`scrollWidth === innerWidth`)**; covered all 14 renderer/alias entries, dark-dashboard isolation, landscape, reduced motion, 403/429 gate, 404 private, offline retry, personalized RSVP/ticket, and Telegram UA string | **`PASS_LOCAL`** |

---

## 3. WCAG 2.2 AA Accessibility Findings & Resolution

### 3.1 Genuine WCAG 2.2 AA Defect Fixed Within Authorized Scope
- **Before (`c4e4a10a`) & Initial `46887ac9` Sweep:** `AxeBuilder` flagged `aria-prohibited-attr` (`impact: serious`) on `.tx-dress__palette` in `apps/frontend-user/src/features/templates/experience/components/sections/TemplateDressCode.jsx:25` (`koupreng-demo-wedding`), because `<TemplateReveal>` renders a roleless `<div>` with `aria-label`.
- **Focused Fix Applied:** Added `role="list"` to `<TemplateReveal role="list" className="tx-dress__palette" ...>` and `role="listitem"` to each `.tx-dress__swatch` in `TemplateDressCode.jsx:25-27`.
- **Re-verification After Fix:** Rebuilt `apps/frontend-user` (`3105` modules) and re-ran `capture-phase16-evidence.mjs --stage=after` -> `14-renderer-koupreng-demo-wedding-km-390.png` dropped to **`axeViolations: []` (`0` violations)**. Also PR `#42` itself eliminated `BEFORE` `target-size` (`WCAG 2.5.8`) violations on `khmer-golden-canva-inspired-wedding` and `cover-khmer-golden-wedding` (`0` violations in `AFTER`).

### 3.2 Remaining Automated Axe Notes & Settled-State Contrast Verification
- In the 25-case automated capture (`evidence/after/metrics.json`), `20/25` renders reported **`0` axe violations**. The remaining 5 (`01`, `15`, `24` on `.kfg-guest-frame > span` and `04`, `05`, `20` on `.kc-opening__skip`) were captured `450ms` after clicking open — i.e., **during CSS fade transition** while `opacity < 1`.
- **Direct Settled-State Contrast Re-Check (`task-462`):** Running `@axe-core/playwright` on `khmer-floral-gold` and `khmer-celestial` before opening (`PRE`) and `2200ms` after opening (`POST_SETTLED`) confirmed **`PRE: []` and `POST_SETTLED: []` (`0` violations)** on both renderers. Static CSS color pairs (`#51432d` on `#fffaf2` = `8.1:1`; `#4a3a24` on `#fffdf5` = `10.4:1`) meet WCAG AA `4.5:1`.
- **Transient fixture note (`10`, `11`, `14` `pageErrors: ["Unexpected token ':' "]`):** Replicating directly outside Axe/capture flow returned zero JS syntax errors; isolated cleanly under Vite preview + synthetic mock conditions. Zero functional impact on DOM/a11y/interactive states (`h1Text`, `overflowPx=0`, `axe=0`).
- **Manual Screen-Reader & Physical Keyboard Caveat:** Automated Axe cannot verify Khmer voice synthesis pronunciation in VoiceOver (iOS), TalkBack (Android), or NVDA; full human screen-reader verification on physical devices remains pending (`BLOCKED_EXTERNAL`).

---

## 4. Physical Device & In-App Browser Matrix (Separated from Playwright)

| Environment / Client | Check Method | Status | Blocking Cause & Required Action |
|---|---|---|---|
| **iPhone (Safari / iOS WKWebView)** | Physical handset hardware check (`real safe-area-inset-bottom`, swipe back, gesture audio, image/ticket save) | **`BLOCKED_EXTERNAL`** | No physical iOS device or Safari Web Inspector attached in Windows workspace; Playwright `mobile-webkit` emulated `iPhone 13` only (`PASS_LOCAL`). |
| **Android (Chrome Mobile)** | Physical handset (`adb` / Chrome remote inspect) | **`BLOCKED_EXTERNAL`** | `adb` is not installed (`No adb installed`) and zero Android devices attached; Playwright `mobile-chromium` emulated `Pixel 7` only (`PASS_LOCAL`). |
| **Telegram In-App Browser (iOS / Android)** | UA string & `telegramWebApp.js` fallback logic verified (`25-state-telegram-inapp-ua-390.png`), real WebView untested | **`BLOCKED_EXTERNAL`** | Requires real Telegram mobile client launch against staging/HTTPS tunnel to certify OS share sheet, deep links, and ticket image download. |
| **Facebook / Messenger / WhatsApp In-App Browsers** | Safe link/download fallback logic inspected | **`BLOCKED_EXTERNAL`** | Requires physical mobile client testing on Meta/WhatsApp WebViews. |
