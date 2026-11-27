# Phase 26 — PWA Threat Model & Cache Policy

- **Target Application:** `apps/frontend-user` (`index.html`, `public/manifest.webmanifest`, `infra/nginx/koupreng-api.conf`, `infra/nginx/docker/gateway.conf.template`).

## 1. Service Worker & Offline Cache Posture

- **Verified State:** `navigator.serviceWorker.getRegistrations()` returns **`0` registrations** across anonymous and authenticated routes (`capture-phase26-validation.mjs` & `phase26-cross-cutting-validation.spec.js`).
- **Rationale / Security Decision:** No runtime Service Worker fetch interception or cache storage is enabled for `apps/frontend-user`. This prevents:
  1. Cross-user auth/token or private invitation leakage via shared device SW caches;
  2. Stale caching of `/api/v1/public/invitations/:slug`, `/api/v1/packages`, or `/api/v1/templates` after owner unpublish/password rotation or admin template deactivation;
  3. Payment return/settlement drift during ABA PayWay status polling.

## 2. Manifest & Transport Headers

- `/manifest.webmanifest` returns HTTP `200` with valid app metadata (`name`, `start_url`, `display`).
- Static HTML pre-paint scripts are limited to deterministic `public/color-mode.js` and Telegram WebApp init (`index.html`), keeping no inline secrets or mutable user payloads cached in SW.
- Gateway & API nginx configurations enforce `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Strict-Transport-Security` (TLS config), sandboxed `/uploads/` CSP (`default-src 'none'; style-src 'unsafe-inline'; sandbox`), and zero `Set-Cookie` forwarding on uploaded static assets.
