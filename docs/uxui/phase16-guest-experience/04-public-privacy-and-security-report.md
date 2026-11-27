# Phase 16 Public Privacy, Security & Access-Control Regression Report

**Date:** 2026-11-27 (`UTC+07:00`)  
**Audited Revision:** `46887ac9809346eba6e455e2c8e36fdfaa8a0ddd` (`PR #42`, including security follow-up commits `19a46269` and `a62e3508`)  

---

## 1. Executive Summary

Public guest invitation routes (`/i/:slug`, `/w/:slug`, `/templates/:id/preview`, `/templates/:id/demo`, `/api/v1/public/invitations/*`) **preserve all Phase 15 server authority, `C10-001` guest PII isolation, and XSS/preview-channel security contracts**. No client-side ownership inference or password bypass exists, no guest directory/phone list is fetched or rendered on public routes, and zero Service Workers remain registered (`swCount === 0`).

Two **non-blocking residual items** observed directly in source are documented transparently below (`WithJoyPortalLayout.jsx` gallery `safeImageUrl` parity gap and server-side pre-rotation `accessToken` TTL window documented in `Phase15PublishingAccessMySqlTests.java`).

---

## 2. Verified Security & Privacy Controls

| Control ID | Security / Privacy Invariant | Verified Implementation | Verification Evidence | Status |
|---|---|---|---|---|
| **SEC-P16-01** | `PUBLIC` / `PRIVATE` / `PASSWORD_PROTECTED` server authority (`Phase 15`) | `PublicInvitationFeature.jsx` relies strictly on HTTP `200`/`403`/`404`/`429` responses; never reads client flags to unlock private or protected content | `phase15PublishingAccess.test.jsx` (`5/5`), `Phase15PublishingAccessMySqlTests` (`1/1` in CI `#45841524091`), `capture-phase16-evidence.mjs` cases `21..22` | **PASS_LOCAL** |
| **SEC-P16-02** | Stale `accessToken` wipe on password/session rejection | `httpClient.js` + `PublicInvitationFeature.jsx` clear saved invitation `accessToken` upon HTTP `403` rejection so rotated/invalid tokens never loop | `httpClient.test.js`, `phase15PublishingAccess.test.jsx`, `frontend-user-v2.spec.js` | **PASS_LOCAL** |
| **SEC-P16-03** | Zero `accessPassword` / `$2` bcrypt / token leakage in DOM, storage, exports, URLs | Password inputs clear post-save (`useStudioPersistence.js`), `PublicInvitationFeature.jsx` uses session-scoped headers rather than leaky query params for passwords, backend DTOs omit credentials | `Phase15PublishingAccessMySqlTests.java`, `useStudioPersistence.test.jsx` (`9/9`) | **PASS_LOCAL** |
| **SEC-P16-04** | Guest PII & private note isolation (`C10-001`) | Public invitation payload renders only scoped invited guest summary (`guestName`, seat/table when token-authorized via `?token=`); zero full guest directory or private owner notes or sibling guests' phones | `PublicGuestExperience.test.jsx`, `batch12-core-hardening.spec.js` | **PASS_LOCAL** |
| **SEC-P16-05** | Preview `postMessage` origin & channel validation + SVG/media sanitization (`PR #42`) | `previewMessaging.js` enforces exact origin & channel token check; PR `#42` commits `19a46269` & `a62e3508` tightened safe URLs, map deep links (`safeDirections`), KHQR image sources, and strict raster allowlists (excluding dangerous `svg`/`javascript:` URLs in preview media) | `git show 19a46269`, `git show a62e3508`, `httpClient.test.js`, `PublicGuestExperience.test.jsx`, `phase16RendererParity.test.jsx` | **PASS_LOCAL** |
| **SEC-P16-06** | Theme/session leakage & offline cache isolation | `0` registered Service Workers (`swCount === 0`); public guest route does not cache authenticated host `/api/v1/invitations/*` payloads or leak host Obsidian dark mode onto public template CSS | `frontend-user-v2.spec.js` (`manifest + swCount === 0`), `capture-phase16-evidence.mjs` case `19` | **PASS_LOCAL** |
| **SEC-P16-07** | Error non-enumeration for `PRIVATE`, `DRAFT`, `UNPUBLISHED`, missing slugs | UI displays uniform generic "Invitation unavailable / not found" view for all `404` responses without revealing whether an invitation exists or belongs to someone else | `capture-phase16-evidence.mjs` case `22`, `PublicGuestExperience.test.jsx` | **PASS_LOCAL** |

---

## 3. Hardening Follow-ups & Residual Backend Contracts (Verified)

1. **`WithJoyPortalLayout.jsx` & `CoverBackground.jsx` URL Sanitization Parity — CLOSED:**  
   Updated `WithJoyPortalLayout.jsx` (`coverImage` and `galleryImages`) and shared `CoverBackground.jsx` (`resolveMediaUrl`) to validate URLs via `safeImageUrl(...)`, verified in `phase16RendererParity.test.jsx` (drops `javascript:` and `//evil.example` across both cover and gallery slots while retaining valid `/uploads/*.webp`).
2. **Pre-Rotation `accessToken` TTL Behavior (`Phase15PublishingAccessMySqlTests.java:179-181`, Backend-Owned Contract):**  
   Verified backend test explicitly notes that rotating an invitation password rejects subsequent unlocks using the old password (`403`), **while a previously issued bearer `accessToken` continues returning `200` until expiry**. Frontend correctly wipes stale tokens whenever HTTP `403` occurs, and synchronous revocation of pre-rotation tokens on password rotation remains an explicit backend enhancement deferred without touching Spring Boot code without approval.
3. **Physical In-App Browser Referrer Header Behavior (`BLOCKED_EXTERNAL` -> Deferred to Phase 26):**  
   Stripping/token-scoping of `?token=` across real iOS/Android WKWebView/Chrome Custom Tabs within Telegram/Messenger/Facebook cannot be certified via headless desktop Chromium alone.

---

## 4. Negative Security Scenarios Covered

- `P16-N01`: Invalid / unpublished / `PRIVATE` slug returns uniform `404` non-enumerating state.
- `P16-N02`: `PASSWORD_PROTECTED` invitation opened anonymously blocks content (`403`) until verified.
- `P16-N03`: Wrong password submitted 5+ times triggers HTTP `429` rate limit messaging & clears stale `accessToken`.
- `P16-N04`: Stale or cross-invitation `accessToken` is cleared automatically upon server `403` rejection.
- `P16-N05`: Malicious `javascript:` / non-HTTPS map or KHQR/media URLs stripped/neutralized (`19a46269`, `a62e3508`, `safeDirections`).
- `P16-N06`: Untrusted `window.postMessage` events with wrong origin or mismatched `previewChannel` are ignored (`previewMessaging.js`).
- `P16-N07`: Public endpoints never render host-only private notes, owner billing status, or full guest directory PII.
- `P16-N08`: Network failure / abort during initial load surfaces non-crashing retry recovery without leaking partial data.
