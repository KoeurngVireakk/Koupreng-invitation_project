# Phase 18 — Before / After Visual Evidence & Accessibility Delta

**Capture Tool:** `scripts/qa/capture-phase18-evidence.mjs`  
**Playwright Browser:** Chromium (`1440x900`, `390x844`) with `@axe-core/playwright`  
**Before Capture:** `metrics.json` on `84a9fb99` (`evidence/before/`)  
**After Capture:** `2026-11-27T03:12:32.359Z` (`evidence/after/`)

## 1. Visual & Axe Delta Summary

| Scenario Screenshot | Viewport / Theme / Lang | Before Overflow | Before Axe | After Overflow | After Axe | Observed Outcome |
|---|---|---|---|---|---|---|
| `01-rsvp-dashboard-light-en-1440.png` | `1440` Light `EN` | `0px` | `1` (`header [aria-haspopup="menu"]`) | `0px` | `1` (`header [aria-haspopup="menu"]`) | Added `Export CSV`; zero Phase 18 RSVP board/KPI Axe issues |
| `02-rsvp-dashboard-obsidian-km-1440.png` | `1440` Dark `KM` | `0px` | `1` (`header [aria-haspopup="menu"]`) | `0px` | `1` (`header [aria-haspopup="menu"]`) | Obsidian `#090909` dark mode + localized KM `នាំចេញ CSV` verified |
| `03-rsvp-dashboard-mobile-dark-390.png` | `390` Dark `EN` | `0px` | `0` | `0px` | `0` | Clean card reflow & zero horizontal overflow |
| `04-rsvp-wishes-wall-obsidian-1440.png` | `1440` Dark `EN` | `0px` | `1` (`header [aria-haspopup="menu"]`) | `0px` | `1` (`header [aria-haspopup="menu"]`) | Wishes Wall cards render with uniform luxury hierarchy |
| `05-wishes-page-obsidian-en-1440.png` | `1440` Dark `EN` | `0px` | `1` (`header [aria-haspopup="menu"]`) | `0px` | `1` (`header [aria-haspopup="menu"]`) | Dark mode contrast tokens applied to counter pill, delete buttons & privacy notice |
| `06-wishes-page-mobile-km-390.png` | `390` Light `KM` | `0px` | **`2` (`color-contrast`, `label-content-name-mismatch` x2)** | `0px` | **`0`** | Fixed `.wishes-counter-badge` `#6e4f1d` contrast + synchronized Khmer button visible text (`លុបពាក្យជូនពរ`) |
| `07-public-rsvp-general-1440.png` | `1440` Light `EN` | `0px` | `0` | `0px` | `0` | Displays `"Guest RSVP form · Please reply by 15 Dec 2026 · Up to 4 guests"` cleanly |
| `08-public-rsvp-mobile-390.png` | `390` Light `KM` | `0px` | `0` | `0px` | `0` | Mobile KH RSVP form fits cleanly above viewport chrome |
| `09-public-rsvp-qr-pass-1440.png` | `1440` Light `EN` | `0px` | **`1` (`color-contrast` on QR hint `div:nth-child(3) > p`)** | `0px` | **`0`** | Fixed `#78716c` -> `#57534e` hint text (`>= 7:1` contrast on QR pass card) |

*Scope note:* The desktop-only `button[aria-haspopup="menu"]` finding originates from the global DashboardLayout user profile trigger outside Phase 18 scope and is tracked separately for shared shell hardening. Every Phase 18 public RSVP, owner RSVP board, Wishes Wall, and Wishes Management surface resolved **all** Axe findings (`3` Phase 18 defects fixed -> `0` Phase 18 Axe findings remaining).
