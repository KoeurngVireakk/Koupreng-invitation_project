# Phase 23 UI/UX Pro Max Search Raw Output

**Captured:** 2026-11-27T14:17:55+07:00
**Commands:**
1. `python .agents/skills/ui-ux-pro-max/scripts/search.py "team roles permissions settings workspace" --design-system`
2. `python .agents/skills/ui-ux-pro-max/scripts/search.py "notification preferences center accessibility" --domain ux`
3. `python .agents/skills/ui-ux-pro-max/scripts/search.py "AI assistant fallback transparency disclosure" --domain ux`

## Selected Decisions Applied to KoupReng Phase 23

- Preserved KoupReng canonical Obsidian Black (`#090909` / `#141414` / `#1c1c1c` / `#fafafa` / `#d8b875`) and Ivory Light (`#f7f5f0` / `#fffefb` / `#1e2824` / `#1c3a32` / `#8c6628`) semantic tokens rather than generic red SaaS palette output.
- Applied UX guidelines:
  - SVG Lucide icons only (replaced emoji icons such as `👑` in team/organization views).
  - Minimum `44x44px` interactive controls (`notif-action`, `k-org-action-btn`, `pe-ai-page` chips/buttons) and `focus-visible` outlines.
  - Explicit `role="alert"` / `role="status"` announcements for error, permission, preference persistence, and read/unread updates.
  - Transparent AI capability disclosure (`LOCAL_TEMPLATE` vs verified `AI_PROVIDER`) with explicit privacy boundary (never send private guest phone numbers or confidential notes) and fail-closed `401/403` handling.
  - Reduced-motion (`@media (prefers-reduced-motion: reduce)`) guards across organization, notification, profile, and assistant surfaces.
