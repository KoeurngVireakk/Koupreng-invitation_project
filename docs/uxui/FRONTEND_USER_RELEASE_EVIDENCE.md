# Koupreng Frontend User Release Evidence Ledger (`f037b63e`)

**Verified Execution Environment:** Windows PowerShell 5.1 + Node.js + Chromium / Firefox / WebKit Playwright (`D:\Koupreng-invitation_project`, branch `feat/phase27-release-readiness` from verified `origin/main` `f037b63e90ee7d2632245702799d0de335ccba75`).

---

## 1. Exact Executed Commands & Observed Outcomes

| Check | Exact Command | Observed Output | Status |
|---|---|---|---|
| **Design Token Sync** | `node scripts/sync-design-tokens.cjs --check` | `Verified 2 application token exports.` | **`PASS`** |
| **Agent Routing Validation** | `python scripts/validate-agent-routing.py` | `Pinned Skills Verified: 10`, `Total Valid Skills: 58`, `Total Errors/Failures: 0` | **`PASS`** |
| **Repository & Security Policy Tests** | `node --test scripts/qa/*.test.mjs` | `tests 18`, `pass 18`, `fail 0` (`953.57ms`) | **`PASS`** |
| **ESLint (`apps/frontend-user`)** | `npm --prefix apps/frontend-user run lint` | `0` errors, `0` warnings | **`PASS`** |
| **Unused Exports / Deps (`knip`)** | `npm --prefix apps/frontend-user run analyze:knip` & `analyze:deps` | Exit `0` | **`PASS`** |
| **Complete Vitest Suite** | `npm --prefix apps/frontend-user test` | **`257` files / `1,979` tests passed** (`52.02s`) | **`PASS`** |
| **Production Bundle (`vite build`)** | `npm --prefix apps/frontend-user run build` | Built `3,106` modules in `2.48s`; `dist/index.html` `8.13 kB`, entry `index-*.js` `479.46 kB` (`142.84 kB` gzip) | **`PASS`** |
| **Cross-Browser Playwright v2** | `npx playwright test --config=playwright.frontend-user-v2.config.js` (cwd `apps/frontend-user`) | **`31` passed, `5` skipped** *(expected desktop-only cases skipped on `chromium-mobile`)*, **`0` failed** (`2.0m`) across `chromium-desktop`, `firefox-desktop`, `webkit-desktop`, `chromium-mobile` | **`PASS`** |
| **Route Smoke & Phases 23–26 E2E** | `npx playwright test --workers=2 tests/e2e/route-smoke.spec.js tests/e2e/phase23-team-notifications-ai.spec.js tests/e2e/phase24-admin-boundary.spec.js tests/e2e/phase25-template-studio-boundary.spec.js tests/e2e/phase26-cross-cutting-validation.spec.js` (cwd `apps/frontend-user`) | **`62` passed (`50.8s`), `0` failed** across `desktop-chromium` and `mobile-chromium` | **`PASS`** |
| **Multi-State Cross-Cutting Capture** | `node scripts/qa/capture-phase26-validation.mjs --stage=after` (`PR #53`, inherited verbatim on `f037b63e`) | **`96/96`** responsive overflow checks (`320–1440px`) `0px`; **`13/13`** WCAG 2.2 AA Axe states `0` violations; `serviceWorkerCount: 0`; `manifestValid: true` | **`PASS_LOCAL`** |

> [!NOTE]
> An unconstrained 10-worker local run (`task-1341`) hit local preview server contention/crash on parallel `4173`/`4174` workers; re-running the identical suite at deterministic `--workers=2` (`task-1355`, matching CI `playwright.batch12.config.js` concurrency) passed **`62/62` (`0` failed)**.

---

## 2. External Verification Required Before Live Production Cutover (`BLOCKED_EXTERNAL`)

1. Physical iOS Safari & Android Chrome device testing (`P16-G12`, `P20-G07`, `P26-G06`).
2. Native Telegram, Facebook, Messenger, and WhatsApp in-app WebView testing (`P16-G13`, `P26-G06`).
3. Live persistent staging Spring Boot + MySQL 8 + Cloudflare + ABA PayWay merchant alert settlement verification (`P16-G14`, `P21-G06` / `C08-013`).
