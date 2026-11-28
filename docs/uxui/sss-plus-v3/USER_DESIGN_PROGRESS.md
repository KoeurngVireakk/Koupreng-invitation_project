# Track U — User Design Progress & Architecture Decisions

- **Baseline SHA:** `d05b4267cd67d69208808e8a4a6fa7b36deebb53`
- **Track:** Track U (`apps/frontend-user` only; `apps/frontend-admin`, backend, Telegram worker, and Flyway migrations untouched)
- **Public Invitation Renderer Constraint:** Per explicit owner instruction, all files under `apps/frontend-user/src/features/templates/layouts/*` were preserved unmodified (`PRESERVED_VERIFIED`).

## Surface Dispositions & Key Redesigns

| Surface Family | Status | Implemented Changes | Key Source Files |
|---|---|---|---|
| Public Marketing Chrome & Hero | `REDESIGNED_LOCAL` | Full-bleed sticky editorial header with active underline divider, golden-rule kicker, Cormorant editorial headline rendered immediately at opacity 1 without `FadeContent` gate, 3-column architectural hairline capability ledger, Stageshow-inspired satellite badge, parchment backdrop plinth, bottom capsule dock (`order: -1` above mobile fold), dark-mode contrast fix on `.public-demo-launch-btn`. | `src/layouts/components/Header.jsx`, `MarketingChrome.css`, `LandingHero.jsx`, `LandingHero.css`, `LandingStory.jsx`, `InvitationDemo.jsx`, `InvitationDemo.css`, `MarketingFeature.css`, `src/shared/styles/app-experience.css` |
| Pricing, Contact, Venues & Auth | `REDESIGNED_LOCAL` | Left-aligned editorial mastheads with bottom hairline rules, 64px golden accent rule replacing legacy `.diamond` dividers, 14px/16px architectural containers without excess blur/pill chrome, vignette framing on auth cards, `PricingFactors` direct `BentoCard` import. | `MarketingPages.css`, `VenuesFeature.jsx`, `VenuesFeature.css`, `PricingFactors.jsx`, `AuthPage.css` |
| Template Catalog & Browse | `REDESIGNED_LOCAL` | Asymmetric split catalog header, consolidated filter bar panel, 4-column hairline metric summary strip, forest emerald (`#173128`) light / obsidian-gold dark action tokens, SVG specimen containment in `.tb-card-thumb[src$=".svg"]`. | `TemplateGrid.jsx`, `PublicTemplateCard.jsx`, `templates.css`, `BrowseTemplates.css` |
| Owner Dashboard, My Events & Event Onboarding | `REDESIGNED_LOCAL` | Deep forest-emerald event command hero with champagne gold Share CTA and white cover frame, connected 4-column hairline KPI strip, obsidian dark container framing on mobile My Events controls, refined onboarding/event settings surfaces. | `OwnerExperience.css`, `EventCreatePage.css`, `EventDetails.css` |
| Invitation Studio | `REDESIGNED_LOCAL` | Consolidated preview device/zoom iconbar inside `.studio-preview-dock`, tablet `@media (max-width: 1023px)` toolbar flex-wrap preventing right-edge overflow at 768px, mobile save-status sizing fix, accessible tooltip/title on click-to-edit control (`label-content-name-mismatch` resolved), lazy modal loading for `TemplateChooser` and `SpotifyMusicPicker` while keeping inline tab editors synchronous. | `InvitationForm.jsx`, `LivePhoneSimulator.jsx`, `InvitationStudio.css` |
| Operational Workspaces & Checkout | `REDESIGNED_LOCAL` | Connected semantic top-accent KPI bars and crisp tabular rows across RSVP, Delivery, Seating, Gifts, Expenses, Subscription Packages, and Checkout without gradient text clipping or pastel background wash. | `RsvpDashboardPage.css`, `DeliveryWorkspace.css`, `SeatingPage.css`, `GiftsFeature.css`, `ExpensesPage.css`, `SubscriptionPackagesPage.css`, `PaymentPages.css` |
| Public Invitation Renderers | `PRESERVED_VERIFIED` | All layout files under `src/features/templates/layouts/*` kept verbatim at `d05b4267`. | `src/features/templates/layouts/**` |
| Startup Performance | `REDESIGNED_LOCAL` | Removed root `<MotionConfig>` wrapper from `ThemeProvider` (`DisplayPreferences` / `reduced-motion` preserved via DOM attributes) and skipped redundant catalog preload on `?embed=` iframes in `App.jsx`. | `src/app/providers/ThemeProvider.jsx`, `src/app/App.jsx` |

## Skill & Reference Application Summary

- **Applied in code:** `brand-identity`, `frontend-design`, `ui-ux-pro-max`, `emil-design-eng`, `koupreng-premium-ux`, `wcag-audit-patterns`, `vercel-react-best-practices`, `koupreng-qa-release`, and `stageshow`-inspired product framing (adapted natively without inventing unverified motion artifacts).
- **awwwards-mcp / 60fps.design note:** Awwwards MCP remained unavailable offline/403 in prior session checks and was not relied upon for assets; visual grammar followed `DESIGN.md`, Obsidian Black x Champagne Gold tokens, forest-emerald editorial contrast, and 60fps compositor transform/opacity transitions.
- **License & Provenance:** Used existing repository OFL Khmer/Cormorant fonts, Lucide icons, and existing adapted MIT primitives (`BentoCard`, `EmptyState`); no unapproved third-party dependencies or fabricated mock data added to production code.
