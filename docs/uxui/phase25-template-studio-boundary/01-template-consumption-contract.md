# Phase 25 — Customer Template-Consumption Contract (Frontend User Boundary Only)

- **Phase:** 25 — Admin Template Studio / CMS / Publishing Pipeline (Frontend User Boundary ONLY)
- **Scope Rule:** Zero Admin Studio authoring screens or general marketing-page CMS modules added to `apps/frontend-user`. Zero edits to `apps/frontend-admin` or `apps/backend`.

## 1. Consumption & Preservation Guarantees

1. **Template Catalog & Dynamic Registration:**
   - `templateCatalogService.list()` fetches `/v1/templates`, filters through `isPublicCatalogTemplate`, and computes `premium`/`isPremium` via server metadata.
   - `registerDynamicTemplates` updates runtime lookup without overriding static identities when stable slugs/codes are present.
2. **Removed / Unavailable Template Recovery:**
   - Both `PublicInvitationFeature.jsx` (`mergedPublicGarden === null`) and `InvitationPreviewFeature.jsx` (`rendered === null`) render canonical `<TemplateUnavailable />` (`role="alert"` with safe reload action) instead of borrowing an unrelated renderer layout.
3. **Unknown JSON & Schema Resilience:**
   - `preserveStudioJson` retains arbitrary unknown nested objects and custom block arrays (`customBlocks`, `studioV2`) across partial studio saves while filtering `__proto__`, `constructor`, and `prototype`.
   - `TemplateDemoFeature.jsx` catches partial/malformed JSON in `remoteTpl.description` safely without crashing.
4. **Iframe Origin & Nonce Enforcement (`previewMessaging.js`):**
   - Embedded preview messaging enforces exact origin equality, matching window `source`, 24–128 character nonce `sessionId`, and strict schema validation for `LIVE_PREVIEW_SYNC`, `TOGGLE_GATE`, `SCROLL_TO_SECTION`, `EDIT_STUDIO_SECTION`, and `PREVIEW_SCENE`.
   - Published invitations (`/w/*`) ignore `previewSession` / `previewOrigin` query parameters.
5. **General CMS Posture:**
   - Explicitly **NOT IMPLEMENTED / OUT OF SCOPE** inside `apps/frontend-user` per Master Spec §19.2 & §19.4 (requires separate approved backend/admin CMS module).
