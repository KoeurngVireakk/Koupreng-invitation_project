# Koupreng Frontend User Design System

**Application Scope:** `apps/frontend-user`  
**Token Source of Truth:** [`apps/frontend-user/src/shared/styles/semantic-tokens.css`](../../apps/frontend-user/src/shared/styles/semantic-tokens.css)  
**Token Synchronization:** `node scripts/sync-design-tokens.cjs --check` (synchronizes semantic tokens to `apps/frontend-admin`)  
**Verified Base SHA:** `f037b63e90ee7d2632245702799d0de335ccba75`

---

## 1. Three Surface Systems & Architectural Isolation

KoupReng (`គូព្រេង`) intentionally separates its visual architecture into three distinct, non-bleeding surface systems:

1. **System A — Host Management & Atelier Chrome (`HostShell`, `EventWorkspace`, `Guests`, `Budget`, `Reports`, `Seating`, `Check-In`, `Team`, `Profile`):**
   - Light Mode pairs Warm Ivory Canvas (`--ui-theme-canvas: #f7f5f0`), Crisp Paper (`--ui-theme-surface: #fffefb`), Subtle Sand (`--ui-theme-subtle: #efebe2`), Deep Forest Primary Action (`--ui-theme-action: #1c3a32`), and Executive Emerald Navigation Rail (`--ui-rail-bg: #172b25`, `--ui-rail-gold: #d8b875`).
   - **Obsidian Dark Mode** (`:root.dark`, `:root[data-color-mode="dark"]`) pairs Obsidian Black Canvas (`--ui-theme-canvas: #090909`), Carbon Panel (`--ui-theme-surface: #141414`), Raised Surface (`--ui-theme-raised: #242424`), Champagne Gold Action (`--ui-theme-action: #d8b875` with `--ui-theme-on-action: #141414`), High-Contrast Ink (`--ui-theme-ink: #fafafa`), and Dark Focus Ring (`--ui-theme-focus: #f0cf8b`).
2. **System B — Public Marketing, Discovery, Auth & Commerce (`/`, `/templates`, `/pricing`, `/venues`, `/contact`, `/login`, `/app/packages`, `/app/payments`):**
   - Editorial serif/Khmer headings, restrained parchment cards, semantic Dark/Light overrides across pricing filters, checkout summary cards, PayWay QR status displays (preserving crisp `#ffffff` QR scan boxes in dark mode), and printable `@media print` A4 financial reports & receipts (`FinancialReport.css`, `ReportsPage.css:not(.is-print-preview)`).
3. **System C — Public Guest Ceremonial Invitations (`/w/:slug`, `/i/:slug`, `/templates/:id`):**
   - **Strictly isolated** from host Obsidian Dark Mode (`[data-color-mode="dark"]`) so each wedding theme preserves its authored palette, typography, paper texture, and ceremony lighting.

---

## 2. Canonical Color, Spacing & Typography Tokens (`semantic-tokens.css`)

| Role | Light Mode | Obsidian Dark Mode |
|---|---|---|
| Canvas | `#f7f5f0` (`--ui-theme-canvas`) | `#090909` (`--ui-theme-canvas`) |
| Surface / Card | `#fffefb` (`--ui-theme-surface`) | `#141414` (`--ui-theme-surface`) |
| Primary Ink / Muted | `#1e2824` / `#525f58` | `#fafafa` / `#a3a3a3` |
| Primary Action / On Action | `#1c3a32` / `#ffffff` | `#d8b875` / `#141414` |
| Champagne Gold Accent | `#8c6628` (`--ui-theme-gold`) | `#d8b875` (`--ui-theme-gold`) |
| Focus Appearance (`WCAG 2.2`) | `#176f67` (`--ui-theme-focus`) | `#f0cf8b` (`--ui-theme-focus`) |
| Semantic Status (`Success` / `Warning` / `Danger` / `Info`) | `#166534` / `#92400e` / `#b91c1c` / `#1d5c77` | `#86efac` / `#f2cb82` / `#ffb4ab` / `#93c5fd` |
| Bilingual Font Stack | `"DM Sans", "Kantumruy Pro", system-ui, sans-serif` (`--ui-font-management`) | Same; Khmer line height `1.8` (`--ui-leading-khmer`) vs Latin `1.5` |
| Fluid Type & Spacing | `--ui-text-page-title: clamp(1.375rem, 1.15rem + 1.1vw, 2rem)`, `--ui-page-gutter: clamp(14px, 3.2vw, 40px)`, `--ui-target-comfort: 44px` | Same across all 12 verified viewports (`320px`–`1440px`) |

---

## 3. Bilingual Khmer / English & Anti-Overlap Standards

- `useLanguageStore` enforces `"km"` or `"en"`, synced to `document.documentElement.lang` in [`App.jsx`](../../apps/frontend-user/src/app/App.jsx).
- Pre-paint dark-mode hydration runs synchronously in [`public/color-mode.js`](../../apps/frontend-user/public/color-mode.js) without FOWT.
- Management currency surfaces (`Budget`, `Expenses`, `Gifts`, `Financial Report`, `Receipts`) strictly separate `USD` and `KHR` figures without fabricated client-side exchange conversion.
