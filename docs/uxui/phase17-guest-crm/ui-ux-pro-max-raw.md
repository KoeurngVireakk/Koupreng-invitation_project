# Phase 17 `ui-ux-pro-max` Verbatim Tool Outputs

Captured from real `.agents/skills/ui-ux-pro-max/scripts/search.py` executions during Phase 17 planning (`2026-11-27`).

## Query 1 — `--domain ux "accessible mobile data table bulk actions"`

```text
## UI Pro Max Search Results
**Domain:** ux | **Query:** accessible mobile data table bulk actions
**Source:** ux-guidelines.csv | **Found:** 3 results

### Result 1
- **Category:** Data Entry
- **Issue:** Bulk Actions
- **Platform:** Web
- **Description:** Editing one by one is tedious
- **Do:** Allow multi-select and bulk edit
- **Don't:** Single row actions only
- **Code Example Good:** Checkbox column + Action bar
- **Code Example Bad:** Repeated actions per row
- **Severity:** Low

### Result 2
- **Category:** Responsive
- **Issue:** Table Handling
- **Platform:** Web
- **Description:** Tables can overflow on mobile
- **Do:** Use horizontal scroll or card layout
- **Don't:** Wide tables breaking layout
- **Code Example Good:** overflow-x-auto wrapper
- **Code Example Bad:** Table overflows viewport
- **Severity:** Medium

### Result 3
- **Category:** Accessibility
- **Issue:** ARIA Labels
- **Platform:** All
- **Description:** Interactive elements need accessible names
- **Do:** Add aria-label for icon-only buttons
- **Don't:** Icon buttons without labels
- **Code Example Good:** aria-label='Close menu'
- **Code Example Bad:** <button><Icon/></button>
- **Severity:** High
```

## Query 2 — `--design-system "guest list table filters import CRM"`

```text
╔═════════════════════════════════════════════════════════════════════════════════════════╗
║  TARGET: GUEST LIST TABLE FILTERS IMPORT CRM - RECOMMENDED DESIGN SYSTEM                ║
╚═════════════════════════════════════════════════════════════════════════════════════════╝
┌─────────────────────────────────────────────────────────────────────────────────────────┐
├─── PATTERN ─────────────────────────────────────────────────────────────────────────────┤
│  Name: Product Demo + Features                                                          │
│     Conversion: Use an interactive demo only when it explains value better than static  │
│     media. Provide captions, transcript, visible play/pause controls, and a non-video   │
│     fallback; do not autoplay under reduced motion. Pause media when offscreen or       │
│     hidden and keep the final product state available as static content.                │
│     CTA: Video center + CTA right/bottom                                                │
│     Sections:                                                                           │
│       1. Hero                                                                           │
│       2. Product video/mockup (center)                                                  │
│       3. Feature breakdown per section                                                  │
│       4. Comparison (optional)                                                          │
│       5. CTA                                                                            │
├─── STYLE ───────────────────────────────────────────────────────────────────────────────┤
│  Name: Flat Design                                                                      │
│     Mode Support: Light supported | Dark supported                                      │
│     Keywords: 2D, minimalist, bold colors, no shadows, clean lines, simple shapes,      │
│     typography-focused, modern, icon-heavy                                              │
│     Best For: Web apps, mobile apps, cross-platform, startup MVPs, user-friendly,       │
│     SaaS, dashboards, corporate                                                         │
│     Performance: cost:low|drivers:none | Accessibility:                                 │
│     risk:low|requires:contrast-text-4.5,keyboard,visible-focus,reduced-motion           │
├─── COLORS ──────────────────────────────────────────────────────────────────────────────┤
│     Primary:           #2563EB    (--color-primary)                                     │
│     On Primary:        #FFFFFF    (--color-on-primary)                                  │
│     Secondary:         #3B82F6    (--color-secondary)                                   │
│     On Secondary:      #000000    (--color-on-secondary)                                │
│     Accent/CTA:        #059669    (--color-accent)                                      │
│     On Accent/CTA:     #000000    (--color-on-accent)                                   │
│     Background:        #F8FAFC    (--color-background)                                  │
│     Foreground:        #0F172A    (--color-foreground)                                  │
│     Card:              #FFFFFF    (--color-card)                                        │
│     Card Foreground:   #0F172A    (--color-card-foreground)                             │
│     Muted:             #F1F5FD    (--color-muted)                                       │
│     Muted Foreground:  #475569    (--color-muted-foreground)                            │
│     Border:            #E4ECFC    (--color-border)                                      │
│     Destructive:       #DC2626    (--color-destructive)                                 │
│     On Destructive:    #FFFFFF    (--color-on-destructive)                              │
│     Ring:              #2563EB    (--color-ring)                                        │
│     Notes: Professional blue + deal green                                               │
├─── TYPOGRAPHY ──────────────────────────────────────────────────────────────────────────┤
│  Poppins / Open Sans                                                                    │
│     Mood: modern, professional, clean, corporate, friendly, approachable                │
│     Best For: SaaS, corporate sites, business apps, startups, professional services     │
│     Google Fonts:                                                                       │
│     https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family  │
│     =Poppins:wght@400;500;600;700&display=swap                                          │
│     CSS Import: @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wgh...  │
├─── KEY EFFECTS ─────────────────────────────────────────────────────────────────────────┤
│     No gradients/shadows, simple hover (color/opacity shift), fast loading, clean       │
│     transitions (150-200ms ease), minimal icons                                         │
├─── AVOID ───────────────────────────────────────────────────────────────────────────────┤
│     Excessive decoration + Complex shadows + 3D effects                                 │
├─── PRE-DELIVERY CHECKLIST ──────────────────────────────────────────────────────────────┤
│     [ ] No emojis as icons (use SVG: Heroicons/Lucide)                                  │
│     [ ] cursor-pointer on all clickable elements                                        │
│     [ ] Hover states with smooth transitions (150-300ms)                                │
│     [ ] Light mode: text contrast 4.5:1 minimum                                         │
│     [ ] Focus states visible for keyboard nav                                           │
│     [ ] prefers-reduced-motion respected                                                │
│     [ ] Responsive: 375px, 768px, 1024px, 1440px                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

*(Koupreng Precedence Rule Applied: Brand identity remains Cambodian Heritage × Modern Luxury Obsidian `#090909` + Champagne Gold `#D6B26E`/`#B0926A` + Khmer/English typography (`Kantumruy Pro` / `Noto Sans Khmer`), adopting flat structural clarity, checkbox+action-bar bulk workflows, responsive card reflow, Lucide icon consistency, 4.5:1 WCAG AA contrast, and `prefers-reduced-motion` safety.)*
