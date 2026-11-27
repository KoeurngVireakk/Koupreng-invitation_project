# Phase 15 Acceptance Reconciliation & Gate `FUV2-G43` / `FUV2-G44` Closeout

**Date:** 2026-11-27 (`UTC+07:00`)  
**Workspace:** `D:\Koupreng-invitation_project`  
**Verified `origin/main` SHA:** `46887ac9809346eba6e455e2c8e36fdfaa8a0ddd` (`Merge pull request #42 from KoeurngVireakk/feat/phase16-guest-experience`)  
**Authoritative Remote:** `https://github.com/KoeurngVireakk/Koupreng-invitation_project.git` (`origin` fetch + push; `legacy-origin` push `DISABLED`)  

---

## 1. Why Reconciliation Was Required

The earlier `docs/uxui/frontend-user-v2/` handoff (`12-Phase15-and-frontend-v2-handoff.md`, `acceptance-gates.json`) marked:
- `FUV2-G43` (*Phase 15 publishing acceptance separately completed before claiming Phase 15*) as `PARTIAL`, waiting on live Spring Boot + MySQL 8 HTTP integration; and
- `FUV2-G44` (*CI failure classification and safe Git publication gates recorded*) as `BLOCKED_EXTERNAL`, citing historical GitHub Actions failures (`#44694507572` Secret Scan / Browser E2E and `#45649809538` Secret Scan / Admin Frontend).

Subsequent commits merged to `KoeurngVireakk/Koupreng-invitation_project` `origin/main` superseded those blockers cleanly:
- `386a126b` — cleared proven Gitleaks false positives and unused admin shim.
- `81f091e4` — added `apps/backend/src/test/java/com/koupreng/backend/phase15/Phase15PublishingAccessMySqlTests.java` and wired it into `.github/workflows/ci.yml` (`backend-http-mysql` job).
- `1ca911ee` -> `c4e4a10a` -> `dd71f5bf` (PR `#41`) -> `46887ac9` (PR `#42`).

---

## 2. Verified Phase 15 Backend & CI Evidence

### 2.1 GitHub Actions Run `#45841524091` on `46887ac9`
- **Workflow Run:** `https://github.com/KoeurngVireakk/Koupreng-invitation_project/actions/runs/45841524091` (`conclusion: success`, all `11/11` jobs passed) + CodeQL run `#45841523965` (`conclusion: success`).
- **All 11 Passing CI Jobs:**
  1. `User Frontend` (`lint`, `vitest`, `build`, `analyze:knip`, `analyze:deps`)
  2. `Admin Frontend` (`lint`, `vitest`, `build`)
  3. `Fresh MySQL Flyway Migration` (`*MySqlTests,FreshDatabaseMigrationTests`)
  4. `Telegram Bot`
  5. `Backend Build, Test & Coverage`
  6. `Backend Static Analysis`
  7. `Real HTTP MySQL Ownership, RBAC & Entitlements` (`Phase7CollaborationMySqlTests,Phase9MediaMySqlTests,Phase15PublishingAccessMySqlTests`)
  8. `Browser E2E & Route Smoke` (`batch12`, `critical-routes`, `route-smoke`, `guest-workspace`, `studio-tickets`, `next-studio-ux`, `phase12-matrix`, `package-purchase-ux`)
  9. `Dependency Vulnerability Audit`
  10. `Secret Scan`
  11. `Deployment Configuration & Docker Applicability`

### 2.2 Exact Inspection of `Phase15PublishingAccessMySqlTests.java` & Job Logs
- Executed in CI job `Real HTTP MySQL Ownership, RBAC & Entitlements` (`backend-http-mysql`) against **ephemeral disposable MySQL 8.0 container (`phase7_disposable`)** on port `3416`.
- **Surefire summary in CI log:** `Tests run: 28, Failures: 0, Errors: 0, Skipped: 2`:
  - `Phase15PublishingAccessMySqlTests`: **`Tests run: 1, Failures: 0, Errors: 0, Skipped: 0`** (`3.422s`)
  - `Phase9MediaMySqlTests`: **`5` run, `0` skipped, `0` failed**
  - `Phase7CollaborationMySqlTests`: **`22` run, `2` environment-gated skips, `0` failed**
- **Assertions executed inside `Phase15PublishingAccessMySqlTests` (lines 1–259):**
  1. Rejects blank/incomplete publish readiness with HTTP `400` (`publish_missing_fields`) without exposing credentials.
  2. Publishes `PUBLIC` invitation -> public `GET /api/v1/public/invitations/{slug}` returns `200`, survives reload, and exposes zero `accessPassword` / `$2` bcrypt hashes.
  3. Unpublishes -> public `GET` returns `404` non-leaking response.
  4. Sets `PRIVATE` + re-publishes -> anonymous public `GET` returns `404`; authenticated owner returns `200`; scoped guest token returns `200`.
  5. Sets `PASSWORD_PROTECTED` -> anonymous public `GET` returns `403`; wrong password attempts `1..5` return `403` and 6th triggers HTTP `429` rate limit (`InvitationPasswordAttemptLimiterTests`); valid password returns `accessToken` bearer granting `200` public read without `$2`/password leakage.
  6. Rotates password -> old password fails (`403`), new password succeeds (`200`), **explicitly noting in source (`Phase15PublishingAccessMySqlTests.java:179-181`) that an already-issued pre-rotation bearer `accessToken` remains valid until its TTL expiry** rather than being revoked synchronously on password update.

### 2.3 Fresh Local Verification on `46887ac9`
| Check | Command | Exit Code | Observed Output |
|---|---|---|---|
| Token Sync | `node scripts/sync-design-tokens.cjs --check` | `0` | `Verified 2 application token exports.` |
| Skill Routing | `python scripts/validate-agent-routing.py` | `0` | `Pinned Skills Verified : 10 \| Total Valid Skills : 58 \| Total Errors/Failures : 0` |
| Lint | `npm --prefix apps/frontend-user run lint` | `0` | Clean (`0` errors, `0` warnings) |
| Dead Code | `npm --prefix apps/frontend-user run analyze:knip` | `0` | Clean |
| Unused Deps | `npm --prefix apps/frontend-user run analyze:deps` | `0` | Clean |
| Production Build | `npm --prefix apps/frontend-user run build` | `0` | `✓ 3105 modules transformed`, built in `1.62s` |
| Vitest Unit/Contract | `npm --prefix apps/frontend-user run test` | `0` | `Test Files 253 passed (253)`, `Tests 1935 passed (1935)` (`42.66s`) |
| FUV2 + Phase 15 Cross-Browser | `npx --prefix apps/frontend-user playwright test --config=apps/frontend-user/playwright.frontend-user-v2.config.js --reporter=list` | `0` | `27 passed, 5 skipped (desktop-only on 390px mobile), 0 failed (1.7m)` across Chromium, Firefox, WebKit, Mobile Chromium |

---

## 3. Updated Gate Verdicts (`acceptance-gates.json`)

| Gate | Prior Status | Updated Status | Truthful Rationale & Boundary |
|---|---|---|---|
| `FUV2-G43` | `PARTIAL` | **`VERIFIED_LOCAL`** *(disposable MySQL CI + mocked browser local)* | Disposable MySQL 8 real-HTTP Phase 15 suite (`1/1`, `0` skipped) and Frontend Vitest + cross-browser Playwright passed on `46887ac9`. **Strictly NOT marked `VERIFIED_STAGING` / `PASS_STAGING`**: persistent staging DB, browser-to-live-Spring-Boot end-to-end journey, and pre-rotation bearer `accessToken` revocation window remain unverified live. |
| `FUV2-G44` | `BLOCKED_EXTERNAL` | **`VERIFIED_LOCAL`** | All `11/11` CI jobs in `#45841524091` (including `Secret Scan`, `Admin Frontend`, `Dependency Vulnerability Audit`, `Browser E2E & Route Smoke`) and CodeQL `#45841523965` passed on `46887ac9`. |

Revised `acceptance-gates.json` summary (`44` total gates): `VERIFIED_LOCAL: 40`, `VERIFIED_STAGING: 0`, `PARTIAL: 4` (`FUV2-G16`, `FUV2-G17`, `FUV2-G30`, `FUV2-G36`), `FAILED: 0`, `REVIEW_REQUIRED: 0`, `BLOCKED_EXTERNAL: 0`.
