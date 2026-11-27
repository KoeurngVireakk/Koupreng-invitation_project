# Koupreng Frontend User PWA & Security Policy

**Application Scope:** `apps/frontend-user`  
**Verified Base SHA:** `f037b63e90ee7d2632245702799d0de335ccba75`

---

## 1. Progressive Web App & Zero-Service-Worker Policy

- **Manifest:** [`apps/frontend-user/public/manifest.webmanifest`](../../apps/frontend-user/public/manifest.webmanifest) is served at `/manifest.webmanifest` (`HTTP 200`, valid JSON `name`, `start_url`, `display`).
- **Service Worker Registrations:** **Intentionally `0`** (verified dynamically via `navigator.serviceWorker.getRegistrations()` in [`phase26-cross-cutting-validation.spec.js`](../../apps/frontend-user/tests/e2e/phase26-cross-cutting-validation.spec.js)).
- **Security Rationale:** No SW `fetch` interceptor or runtime cache is registered so private invitations (`/api/v1/public/invitations/:slug`), auth sessions, payment status polls (`/api/v1/template-payments/:code`, `/subscriptions/orders/:code`), and deactivated templates (`Phase 24`) can never be served from stale cross-user caches after revocation, unpublishing, or logout.

---

## 2. Frontend Security Controls Verified in Software

1. **Auth & Route Fail-Closed Guards:** Protected `/app/**` routes immediately redirect unauthenticated users to `/login` (`safeRedirect.test.js`); RBAC checks fail closed (`403` `AccessFailureState`, AI helper `401/403` no-fallback rule, `Check-In` & `Seating` permission boundaries).
2. **Stored XSS & URL Sanitization:** React JSX escaping plus `safeImageUrl(...)` (blocking `javascript:` and unsafe protocol-relative URLs) and notification link allowlisting (`/app/`, `/templates/`, `/contact`) prevent script execution across guest wishes, names, covers, and galleries (`window.__xssFired === undefined`).
3. **Spreadsheet & Export Safety:** `safeCsvCell` prepends `'` on formula triggers (`=`, `+`, `-`, `@`, including after control/whitespace characters), escapes quotes cleanly, prepends UTF-8 `\uFEFF`, and keeps USD/KHR totals separated.
4. **Iframe PostMessage & JSON Boundary:** `previewMessaging.js` enforces exact `origin`, `event.source === window.parent`, and active session nonce; `preserveStudioJson` drops `__proto__` keys.
5. **Gateway & Static Upload Hardening (`infra/nginx/`):** Verified via CI `Deployment Configuration` and `scripts/qa/security-policy.test.mjs` (`18/18` passed), including `/uploads/` `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox` and `X-Content-Type-Options: nosniff`.
6. **External Dependencies (`BLOCKED_EXTERNAL`):** Live ABA PayWay merchant webhooks (`C08-013`), Telegram bot production webhooks, and production Cloudflare WAF rules require live staging/production verification outside CI mocks.
