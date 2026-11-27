# Phase 23 — Before/After Visual & Accessibility Evidence

- **Script:** `node scripts/qa/capture-phase23-evidence.mjs --stage=before|after`
- **Before Baseline (`docs/uxui/phase23-team-org-notifications-ai/evidence/before/metrics.json`):**
  - `01-organizations-light-en-1440.png`: `overflowX=0px`, `axe_non_header=0`
  - `02-organizations-obsidian-km-1440.png`: `overflowX=0px`, **`color-contrast` (`4` nodes: `.k-org-card-content > h3`, `.k-org-card-slug`)**
  - `03-organization-detail-obsidian-en-1440.png`: `overflowX=0px`, **`color-contrast` (`3` nodes: member table joined dates `td:nth-child(4)`)**
  - `04-organization-detail-mobile-390.png`: `overflowX=0px`, **`color-contrast` (`3` nodes: member table joined dates `td:nth-child(4)`)**
  - `05-event-team-obsidian-km-1440.png`: `overflowX=0px`, `axe_non_header=0`
  - `06-notifications-light-en-1440.png`: `overflowX=0px`, **`color-contrast` (`6` nodes: `.notif-meta > span`)**
  - `07-notifications-obsidian-km-1440.png`: `overflowX=0px`, **`color-contrast` (`1` node: `.notif-error`)**
  - `08-profile-obsidian-en-1440.png`: `overflowX=0px`, `axe_non_header=0`
  - `09-ai-assistant-obsidian-km-1440.png`: `overflowX=0px`, `axe_non_header=0`
  - `10-ai-assistant-light-en-1440.png`: `overflowX=0px`, `axe_non_header=0`

- **After Remediation (`docs/uxui/phase23-team-org-notifications-ai/evidence/after/metrics.json`):**
  - **`10/10` captures clean:** `0px` horizontal overflow and **`0` non-header Axe WCAG 2.2 AA violations** across every route (`01` through `10`).
  - Verified Obsidian Dark surfaces (`var(--ui-theme-surface)`, `var(--ui-theme-subtle)`), high-contrast dates/meta labels (`var(--ui-theme-muted)`), crisp `.notif-page .dash-btn` action styling, single-line `.k-org-action-btn` buttons (`white-space: nowrap`), Lucide `<Crown />` owner indicator replacing `"👑"` emoji, explicit role permissions guide, and `44px` touch targets.
