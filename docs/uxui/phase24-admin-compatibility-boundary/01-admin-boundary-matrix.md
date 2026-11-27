# Phase 24 — Frontend User / Admin Integration Boundary Matrix

- **Phase:** 24 — Admin Platform Modernization (Frontend User Compatibility Boundary ONLY)
- **Scope Rule:** Zero modifications to `apps/frontend-admin`, `apps/backend`, or Flyway migrations.

## 1. Cross-App Boundary & Route Isolation Matrix

| Boundary Domain | Admin-Owned Source of Truth | Frontend User Consumption Path | Safeguard & Fail-Closed Behavior |
| --- | --- | --- | --- |
| **Template Availability** | `templates.status` (`ACTIVE` vs `INACTIVE`/`ARCHIVED`) | `templateCatalogService.list()`, `templateService.getPublic*` | `isPublicCatalogTemplate` drops non-`ACTIVE`/retired rows; `TemplateDemoFeature` rejects non-`ACTIVE` or `403`/`404`/`410` without borrowing local templates |
| **Template Checkout Pricing** | Server-approved `checkoutEligible`, `checkoutAmount`, `checkoutCurrency` | `TemplateCheckoutPage.jsx` (`templateCatalogService.list({ force: true })`) | Forces fresh catalog lookup on checkout open & auto-revalidates on `403`/`404`/`409`; `checkoutOffer` refuses synthetic fallback offers |
| **Packages & Entitlements** | `subscriptions/packages`, `subscriptions/entitlements` | `EntitlementProvider.jsx`, `SubscriptionPackagesPage.jsx`, `accessDecision.js` | Polls every 60s, on window focus, and via `koupreng:access-refresh`; reloads plans on `400`/`403`/`404`/`409` purchase errors |
| **Route & Auth Isolation** | Separate `apps/frontend-admin` app & `/v1/admin/*` APIs | `hostRoutes.jsx`, `marketingRoutes.jsx`, `safeReturnTo`, `safeRedirect` | `apps/frontend-user` makes zero `/v1/admin` API calls, renders no admin links, and redirects `/admin/*` back to `/app/events` or wildcard 404 |
| **Role & Moderation Privacy** | Internal `role`, `moderationNote`, `auditLogId` | `ProfileFeature.jsx`, `AccessFailureState.jsx`, `ErrorState.jsx` | Profile omits `role` & internal moderation fields; `accessFailure` maps HTTP statuses to sanitized localized decisions |

## 2. Documented Backend/Admin Contract Notes (No Unauthorized Edits)

- `templateService.getPublic` / `getPublicBySlug` fallback for local templates applies only on transient network failures; explicit `403`/`404`/`410` or non-`ACTIVE` responses are treated strictly as unavailable so admin deactivation takes effect immediately across cold direct links.
- All price, package eligibility, quota, and payment confirmation states remain backend-authoritative (`409`/`403` errors trigger live state reconciliation).
