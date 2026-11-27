# Phase 26 — Cross-Cutting Security Regression Report (`apps/frontend-user`)

## 1. Client-Side & Boundary Controls Verified

1. **Authentication Gate:** Unauthenticated navigation to `/app/events` fails closed and redirects immediately to `/login` (`unauthRedirectedToLogin: true`).
2. **XSS / Markup Injection Defense:** Injected `<img src=x onerror="window.__xssFired=true">` payloads inside public invitation wishes (`phase26-cross-cutting-validation.spec.js`) render strictly as escaped text with `window.__xssFired === undefined`.
3. **Preview Messaging & Prototype Pollution (`Phase25TemplateStudioBoundary.test.jsx`):** Embedded iframe listeners require exact origin + `event.source === parent` + active preview session nonce, while unknown Studio JSON preserves safe data and strips `__proto__` keys.
4. **URL & Upload Sanitization:** Public/host renderers filter `javascript:` and unsafe protocol-relative URLs (`safeImageUrl` across covers, galleries, QR cards, notification internal links).
5. **Repository & Supply-Chain Policy Tests (`node --test scripts/qa/*.test.mjs`):** All `18/18` automated repository, compose, NVD freshness, Scalar packaging, and security suppression policy tests passed.

## 2. Explicit Scope Boundaries & Residual External Items

- Zero changes made to Spring Boot security filters, Flyway migrations, `apps/frontend-admin`, or `apps/telegram-bot`.
- Live ABA PayWay merchant settlement (`C08-013`), Telegram webhook delivery, and persistent production WAF/Cloudflare rule verification remain **`BLOCKED_EXTERNAL`**.
