# Phase 26 — WCAG 2.2 AA Accessibility Audit Matrix

- **Scope:** `apps/frontend-user` across Light Mode, Obsidian Dark Mode (`data-color-mode="dark"`), English (`en`), and Khmer (`km`).
- **Rule Set:** `@axe-core/playwright` (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) without filtering out header controls.

## 1. Real Defects Discovered & Remediated

1. **WCAG 2.5.3 Label in Name (`label-content-name-mismatch`) on Template Cards (`PublicTemplateCard.jsx`, `templates.css`):**
   - **Before (`task-1011`):** Decorative tier badge `<span className="tp-card-badge">` (`Free`, `Premium`, `Demo`) was nested inside `<Link className="kp-design-media">` alongside visible `"Preview design"`, producing `innerText` `"FREE\nPreview design"` against `aria-label="Preview design Silk Heritage"` (`01-landing-light-en`, `02-landing-dark-km`, `03-templates-dark-en`).
   - **Fix:** Moved `.tp-card-badge` outside `<Link>` inside `.kp-design-media-wrap` (`position: relative; min-width: 0`) with `pointer-events: none` so card geometry and mobile 2-column grid layout stay unchanged while `<Link>` visible text matches its accessible name cleanly (`"Preview image unavailable Preview design ..."` when fallback image state renders).
2. **WCAG 2.5.3 Label in Name (`label-content-name-mismatch`) on Host Navigation Profile Pill (`HostNav.jsx`, `HostNav.css`):**
   - **Before (`task-1011`):** `<span className="host-profile-avatar">` rendered the plain letter initial inside `<button aria-haspopup="menu" aria-label={displayName}>`, causing visible text `"S\nSokha Meas"` (desktop) or `"S"` (mobile) to diverge from `aria-label="Sokha Meas"` (`05-events-dark-km`, `07-budget-light-km`, `08-reports-dark-en`, `09-packages-dark-en`).
   - **Fix:** Marked `.host-profile-avatar` `aria-hidden="true"` and moved the visual letter initial onto `data-initial` rendered via CSS `.host-profile-avatar[data-initial]::before { content: attr(data-initial); }` so visible DOM text matches `aria-label`.

## 2. Before / After Audit Comparison (`scripts/qa/capture-phase26-validation.mjs`)

| Case | Route | Lang | Theme | Width | Before Violations | After Violations |
|---|---|---|---|---:|---:|---:|
| `01-landing-light-en` | `/` | `en` | `light` | `1440` | `1` (`label-content-name-mismatch`: 2) | **`0`** |
| `02-landing-dark-km` | `/` | `km` | `dark` | `390` | `1` (`label-content-name-mismatch`: 2) | **`0`** |
| `03-templates-dark-en` | `/templates` | `en` | `dark` | `1440` | `1` (`label-content-name-mismatch`: 2) | **`0`** |
| `04-login-light-km` | `/login` | `km` | `light` | `390` | `0` | **`0`** |
| `05-events-dark-km` | `/app/events` | `km` | `dark` | `1440` | `1` (`label-content-name-mismatch`: 1) | **`0`** |
| `06-guests-dark-en` | `/app/events/101/guests` | `en` | `dark` | `390` | `0` | **`0`** |
| `07-budget-light-km` | `/app/events/101/budget` | `km` | `light` | `1440` | `1` (`label-content-name-mismatch`: 1) | **`0`** |
| `08-reports-dark-en` | `/app/events/101/reports` | `en` | `dark` | `1440` | `1` (`label-content-name-mismatch`: 1) | **`0`** |
| `09-packages-dark-en` | `/app/packages` | `en` | `dark` | `1440` | `1` (`label-content-name-mismatch`: 1) | **`0`** |
| `10-notifications-dark-km` | `/app/notifications` | `km` | `dark` | `390` | `0` | **`0`** |
| `11-public-invite-light-km` | `/i/audit-event` | `km` | `light` | `390` | `0` | **`0`** |
