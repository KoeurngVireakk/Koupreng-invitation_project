# Phase 19 `ui-ux-pro-max` Verbatim Tool Outputs

Captured from `.agents/skills/ui-ux-pro-max/scripts/search.py` during Phase 19 planning (`2026-11-27`).

## Query 1 — `--domain ux "keyboard accessible drag drop alternative zoom controls"`

```text
## UI Pro Max Search Results
**Domain:** ux | **Query:** keyboard accessible drag drop alternative zoom controls
**Source:** ux-guidelines.csv | **Found:** 3 results

### Result 1
- **Category:** Accessibility
- **Issue:** Dragging Movements
- **Platform:** All
- **Description:** WCAG 2.2 AA requires a single-pointer alternative for author-controlled drag operations
- **Do:** Add buttons menus or tap-to-move controls and retain keyboard operation
- **Don't:** Make dragging the only way to reorder resize or select
- **Code Example Good:** Move up and Move down buttons beside drag handle
- **Code Example Bad:** drag handle only
- **Severity:** High

### Result 2
- **Category:** Interaction
- **Issue:** Focus States
- **Platform:** All
- **Description:** Keyboard focus, including controls inside a modal, needs a visible indicator
- **Do:** Use a visible focus ring on every interactive control, including modal controls
- **Don't:** Remove focus outline without replacement
- **Code Example Good:** focus:ring-2 focus:ring-blue-500
- **Code Example Bad:** outline-none without alternative
- **Severity:** High

### Result 3
- **Category:** Accessibility
- **Issue:** Compact Control Semantics
- **Platform:** Web
- **Description:** Interactive chips need a native role accessible name state keyboard operation and visible focus
- **Do:** Prefer a button and expose pressed or selected state that matches the visible label
- **Don't:** Use a clickable div or reveal the only action on hover
- **Code Example Good:** <button aria-pressed='true'>Open now</button>
- **Code Example Bad:** <div class='selected' onclick='toggle()'>Open now</div>
- **Severity:** Critical
```

## Query 2 — `--design-system "floor plan banquet table seating chart capacity manager"`

```text
╔═════════════════════════════════════════════════════════════════════════════════════════╗
║  TARGET: FLOOR PLAN BANQUET TABLE SEATING CHART CAPACITY MANAGER - RECOMMENDED DESIGN SYSTEM║
╚═════════════════════════════════════════════════════════════════════════════════════════╝
├─── PATTERN ─────────────────────────────────────────────────────────────────────────────┤
│  Name: Hero + Features + CTA
├─── STYLE ───────────────────────────────────────────────────────────────────────────────┤
│  Name: Minimalism & Swiss Style
│     Requires: contrast-text-4.5, keyboard, visible-focus, reduced-motion
├─── PRE-DELIVERY CHECKLIST ──────────────────────────────────────────────────────────────┤
│     [ ] No emojis as icons (use SVG: Heroicons/Lucide)
│     [ ] cursor-pointer on all clickable elements
│     [ ] Hover states with smooth transitions (150-300ms)
│     [ ] Light mode: text contrast 4.5:1 minimum
│     [ ] Focus states visible for keyboard nav
│     [ ] prefers-reduced-motion respected
│     [ ] Responsive: 375px, 768px, 1024px, 1440px
└─────────────────────────────────────────────────────────────────────────────────────────┘
```
