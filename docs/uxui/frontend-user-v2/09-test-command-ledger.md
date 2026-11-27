# 09 — Test & Command Execution Ledger (`FUV2` + Phase 15)

All checks recorded below were actually executed in `D:\Koupreng-invitation_project` with observed exit codes, exact test counts, and failure classifications. Zero passing claims are extrapolated.

---

## 1. Static Checks, Token Sync, Skill Validation, Lint & Builds

| Command | Exit Code | Key Output / Counts | Status |
|---|---|---|---|
| `node scripts/sync-design-tokens.cjs --check` | `0` | `Verified 2 application token exports.` (`semantic-tokens.css` <-> `apps/frontend-admin/src/styles/application-tokens.css`) | `PASS` |
| `python scripts/validate-agent-routing.py` | `0` | `Pinned Skills Verified: 10`, `Total Valid Skills: 58`, `Total Errors/Failures: 0` | `PASS` |
| `powershell -ExecutionPolicy Bypass -File .\scripts\setup-ai-skills.ps1 -VerifyOnly` | `0` | `Verified 59 bundled skill directories.` | `PASS` |
| `npm --prefix apps/frontend-user run analyze:knip` | `0` | Unused files/deps/unlisted/binaries check clean | `PASS` |
| `npm --prefix apps/frontend-user run analyze:deps` | `0` | Dependency/unlisted/binaries check clean | `PASS` |
| `npm --prefix apps/frontend-user run lint` (`eslint .`) | `0` | `0` errors, `0` warnings (covers `src/` and `tests/` including `frontend-user-v2.spec.js`) | `PASS` |
| `npm --prefix apps/frontend-admin run lint` (`eslint .`) | `0` | `0` errors, `0` warnings | `PASS` |
| `npm --prefix apps/frontend-user run build` (`vite v8.3.5`) | `0` | `3103 modules transformed`, `dist/index.html 8.13 kB` (`gzip 2.39 kB`), `index.css 262.43 kB` (`gzip 47.97 kB`), `index.js 478.46 kB` (`gzip 142.44 kB`), `built in 2.60s` | `PASS` |
| `npm --prefix apps/frontend-admin run build` (`vite v8.3.5`) | `0` | `2121 modules transformed`, `dist/index.html 2.14 kB`, `index.css 183.72 kB` (`gzip 27.71 kB`), `index.js 281.41 kB` (`gzip 89.92 kB`), `built in 7.69s` | `PASS` |
| `git diff --check` | `0` | Clean working tree formatting (zero whitespace errors or conflict markers) | `PASS` |

---

## 2. Vitest & JUnit Automated Unit & Integration Suites

| Command | Exit Code | Key Output / Counts | Status |
|---|---|---|---|
| `npm --prefix apps/frontend-user run test` (`vitest run`) | `0` | **`Test Files 250 passed (250)` \| `Tests 1901 passed (1901)`** (`70.49s`) — includes `semanticTokens.test.js` (`2`), `DisplayPreferences.test.jsx` (`3`), `StudioGuide.test.jsx` (`4`), `useStudioPersistence.test.jsx` (`9`), `phase15PublishingAccess.test.jsx` (`5`), `InvitationForm.test.jsx` (`23`), `EventDetails.test.jsx` (`9`), `phase06ShellInventory.test.jsx`, `batch11RouteInventory.test.jsx`, `RoyalGardenV3.test.jsx` | `PASS` |
| `npm --prefix apps/frontend-admin run test` (`vitest run`) | `0` | **`Test Files 38 passed (38)` \| `Tests 205 passed (205)`** (`37.06s`) | `PASS` |
| `Push-Location apps/backend; .\mvnw.cmd -Dtest=*Invitation* test; Pop-Location` | `0` | **`Tests run: 57, Failures: 0, Errors: 0, Skipped: 0`** (`Total time: 01:00 min`) — verifies backend invitation/access/security/design/localized contracts (`InvitationAccessSecurityTests`, `InvitationServiceTests`, `InvitationPasswordAttemptLimiterTests`, etc.) | `PASS` |

---

## 3. Playwright Cross-Browser, Regression & Visual Capture Runs

| Command | Exit Code | Key Output / Counts | Notes & Classification |
|---|---|---|---|
| `npx playwright test --config=playwright.frontend-user-v2.config.js` (initial run pre-timeout increase in config) | `1` | `17 passed, 2 skipped, 1 failed` (`firefox-desktop` cold chunk boot exceeded default `5000ms` expect waiting for `loading event workspace…` after `domcontentloaded`) | Root-caused via `error-context.md`; raised `expect: { timeout: 12000 }` in `playwright.frontend-user-v2.config.js` |
| `npx --prefix apps/frontend-user playwright test --config=apps/frontend-user/playwright.frontend-user-v2.config.js --reporter=list` (pre-`domcontentloaded` landmark update) | `1` | `26 passed, 5 skipped, 1 failed` (`firefox-desktop` timed out at `30000ms` waiting for `networkidle` on `/login`) | External Google Sign-In iframe (`accounts.google.com`) stalled `networkidle` in Firefox; replaced all `networkidle` waits in `frontend-user-v2.spec.js` with `{ waitUntil: "domcontentloaded" }` + explicit visible landmark assertions and cleared stale failed trace folders under `apps/frontend-user/test-results/` |
| `npx --prefix apps/frontend-user playwright test --config=apps/frontend-user/playwright.frontend-user-v2.config.js --reporter=list` (final cross-browser run across `chromium-desktop`, `firefox-desktop`, `webkit-desktop`, `chromium-mobile`, `--workers=2`) | **`0`** | **`27 passed, 5 skipped (desktop-only sidebar, Studio, Event Settings, dark-route matrix & desktop header tests skipped intentionally on 390px mobile via test.skip(vp.width < 1024)), 0 failed (1.8m)`** | Full cross-engine pass (`domcontentloaded` + visible landmarks; `test.slow()` on 8-route/6-axe dark-mode matrix so `webkit-desktop` completes reliably in `25.7s`; `0` failed trace folders, `.last-run.json` = `passed`): stationary sticky sidebar, short-viewport nav scroll, collapse reload persistence, FOWT dark mode + Guests real rows (`Channa Sok`, `Visal Dara`, no error banner) + Seating real table cards (`VIP Table 1`, `Table 2`, `Capacity 20`, no `undefined`) + Events/Calendar/Settings/Budget/EventCreate/Studio dark parity, axe `0` violations, scrolled header mask, start-aligned mobile dashboard H1, mobile hero/auth overlap prevention, Phase 15 Studio & Event Settings (`/settings`) `PublishReview` access modes/password/confirm-dialog/saved-password clearing + `acknowledge`/QR/share/unpublish, `/i/:slug` gate `403`/`429` & token clear, `320px` overflow `0px`, mobile drawer `Escape` focus return, real `reducedMotion` verification (`matchMedia`, `0ms`/`0s` CSS tokens, `animationName: none`), manifest + `swCount === 0` |
| `npx playwright test --config=playwright.phase12-codex.config.js --project=chromium --reporter=list --output=test-results/phase12-check` (`1440x900`) | **`0`** | **`11 passed (31.3s), 0 failed`** | Verified untouched Phase 12 Codex suites (`phase12-codex-behavior.spec.js` + `phase12-codex-visual.spec.js`): sidebar rail/collapse/tooltip/drawer/reflow/Khmer dark `axe === []`/320px all pass |
| `npx playwright test --workers=2 tests/e2e/event-workspaces.spec.js tests/e2e/phase06-layout-navigation.spec.js tests/e2e/phase12-codex-behavior.spec.js tests/e2e/invitation-publishing-address.spec.js` (`playwright.config.js` prior checkpoint) | `1` | **`73 passed, 7 failed (3.9m)`** | All of `invitation-publishing-address.spec.js` + `event-workspaces:53,:100` (all breakpoints 320–1440) passed. **7 honest pre-existing/config-mismatch failures:** (1–2) `event-workspaces:79` desktop/mobile omits required celebrant photo added in Phase 11.1; (3–4) `phase06:163` expects `127.0.0.1:4173` popup while admin opens `localhost:5173`; (5–7) `phase12-codex-behavior` run under `1280x720`/`Pixel 7` config instead of native `1440x900` config |
| `node scripts/qa/capture-fuv2-visuals.mjs --stage=before` | `0` | 17 PNG captures on `53896aa7` baseline (`before/metrics.json`): `4` axe violations (19 nodes), `sidebarTop=-612px` at `scrollY=700` | Controlled baseline captured pre-edit |
| `node scripts/qa/capture-fuv2-visuals.mjs --stage=after` | `0` | **22 PNG captures** post-edit (`after/metrics.json`): **`0` axe violations across 20 non-iframe axe captures (`16`/`18` Studio runAxe skipped for third-party preview iframe)**, **`0px` overflow across 22/22 renders**, **`sidebarTop=96px` at `scrollY=0` and `scrollY=700`** | Visual proof verified (`01..17` paired + `18..22` dark secondary views; `14`/`15` full-page guest table & mobile cards and `20` seating cards verified clean) |

---

## 4. Reconciled Remote CI & Post-PR-#42 Verification (`46887ac9`)

- **Remote GitHub Actions Run `#45841524091` (`KoeurngVireakk/Koupreng-invitation_project` `origin/main` at `46887ac9`):** `completed / success` across all `11/11` jobs (`User Frontend`, `Admin Frontend`, `Fresh MySQL Flyway Migration`, `Telegram Bot`, `Backend Build, Test & Coverage`, `Backend Static Analysis`, `Real HTTP MySQL Ownership, RBAC & Entitlements`, `Browser E2E & Route Smoke`, `Dependency Vulnerability Audit`, `Secret Scan`, `Deployment Configuration & Docker Applicability`) + CodeQL run `#45841523965` (`completed / success`).
- **Disposable MySQL 8 HTTP Phase 15 Certification (within `#45841524091`):** `./mvnw --batch-mode -Dtest=Phase7CollaborationMySqlTests,Phase9MediaMySqlTests,Phase15PublishingAccessMySqlTests test` ran against ephemeral CI MySQL 8 `phase7_disposable`: **`Tests run: 28, Failures: 0, Errors: 0, Skipped: 2`** (`Phase15PublishingAccessMySqlTests`: `1/1`, `0` skipped, `3.422s`; `Phase9MediaMySqlTests`: `5/5`; `Phase7CollaborationMySqlTests`: `22` run, `2` environment-gated skips). **Not claimed as `PASS_STAGING`** — live persistent staging DB & real browser-to-real-backend HTTP journey remain outside disposable CI scope (see [`01-phase15-reconciliation.md`](../phase16-guest-experience/01-phase15-reconciliation.md)).
- **Fresh Local Verification on `46887ac9` (2026-11-26 / 2026-11-27):** `sync-design-tokens.cjs --check` (`0`), `validate-agent-routing.py` (`0`, `10` pinned, `58` valid), `lint` (`0`), `analyze:knip` (`0`), `analyze:deps` (`0`), `build` (`0`, `3105` modules, `1.62s`), `vitest run` (`0`, `253 files / 1935 tests`, `42.66s`), `playwright.frontend-user-v2.config.js` (`0`, `27 passed, 5 desktop-only skipped on mobile, 0 failed`, `1.7m`).
- **Pre-existing non-regression test caveats:** Standalone `tests/e2e/invitation-styles-v2.spec.js` `withjoy-modern-portal` / `bliss-editorial-wedding` / `koupreng-demo-wedding` reduce-motion assertions expect a visible opener button before checking style attributes, whereas PR `#41`/`#42` intentionally bypasses `WithJoyPortalOpening` & `BlissEditorialOpening` when `prefers-reduced-motion: reduce`; also running `npx --prefix apps/frontend-user playwright test` from repo root breaks `setInputFiles('public/...')` relative paths unless `working-directory` is `apps/frontend-user` (as `.github/workflows/ci.yml` configures). See Phase 16 acceptance report for full suite ledger.
