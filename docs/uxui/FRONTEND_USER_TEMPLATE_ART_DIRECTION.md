# Koupreng Frontend User Template Art Direction & Renderer Registry

**Registry & Mapping Sources:**
- [`apps/frontend-user/src/features/templates/registry/templateRegistry.js`](../../apps/frontend-user/src/features/templates/registry/templateRegistry.js)
- [`apps/frontend-user/src/features/templates/data/templatesData.js`](../../apps/frontend-user/src/features/templates/data/templatesData.js)
- [`apps/frontend-user/src/features/templates/experience/TemplateExperience.jsx`](../../apps/frontend-user/src/features/templates/experience/TemplateExperience.jsx)
- [`apps/frontend-user/src/features/templates/experience/TemplateRenderGuard.jsx`](../../apps/frontend-user/src/features/templates/experience/TemplateRenderGuard.jsx)

---

## 1. Preserved Individual Template Identities

KoupReng strictly prohibits collapsing distinct ceremonial wedding themes into a generic SaaS template or leaking host Obsidian Dark Mode onto guest views.

| Canonical ID | Resolved Layout Component | Aliases / Preset / DB Mapping Preserved | Art Direction Identity |
|---|---|---|---|
| `khmer-floral-gold` | `KhmerFloralGoldLayout` | `KHMER_FLORAL_GOLD` | Golden Cambodian kbach floral stationery, 8 date & 8 program styles, muted cover video |
| `royal-garden-cinematic` | `RoyalGardenCinematicLayout` | `ROYAL_GARDEN_CINEMATIC`, `royal-garden` | Ivory & botanical royal garden hero, illustrated Khmer venue map, split timeline |
| `silk-heritage` | `SilkHeritageLayout` | `SILK_HERITAGE`, `classic`, `luxury`, `modern-khmer`, `vintage-gold` | Crimson & gold woven silk frame, bilingual family honorifics |
| `khmer-celestial` | `KhmerCelestialLayout` | `KHMER_CELESTIAL`, `10`, `royal-khmer-wedding`, `royal-khmer`, `royal`, `RUBY_RED`, `1` (`RoyalKhmerLayout` forwards here) | Celestial twilight gold constellation opening & bilingual heritage typography |
| `the-digital-yes-wedding` | `DigitalYesLayout` | `the-digital-yes`, `digital-yes`, `GOLD_LUXURY`, `7` | Wax-seal envelope scene & crisp ivory editorial layout |
| `emerald-canva-luxe-wedding` | `EmeraldLuxeLayout` (`Card3DFlip`) | `emerald_royal_luxe`, `emerald-luxe`, `EMERALD_GREEN`, `2`, `9` | Deep emerald & gold 3D flip invitation |
| `withjoy-modern-portal` | `WithJoyPortalLayout` + `WithJoyPortalOpening` | `3` | Split glassmorphism portal & photography gallery |
| `bliss-editorial-wedding` | `BlissEditorialLayout` + `BlissEditorialOpening` | `4` | Warm magazine editorial print spread |
| `khmer-golden-canva-inspired-wedding` | `CanvaKhmerWeddingTemplate` | `cover-khmer-golden-wedding`, `CHAMPAGNE`, `KHMER_GOLDEN`, `5` | Champagne parchment grid & Cambodian multi-ceremony schedule |
| `template-boilerplate` | `TemplateBoilerplateLayout` | `custom-starter` | Modular base starter canvas |
| `event-essential` | `EventEssentialLayout` | `30` (non-wedding default) | Clean general celebration / corporate / birthday card layout |
| `koupreng-demo-wedding` | `WeddingTemplateExperience` | Default demo wedding | Unified configurable ceremony blocks (`DynamicTemplateRenderer`) |
| Removed / Unavailable | `<TemplateUnavailable />` / `DefaultTemplateLayout` (when explicit `useFallback`) | Fail-closed unavailability | Never borrows another template's layout or claims deactivated catalog access (`Phases 24–25`) |

---

## 2. Studio & Admin Compatibility Guarantees (Phases 24–25)

- `templateCatalogService.list({ force: true })` enforces fresh checkout/demo checks; `403`/`404`/`410` or non-`ACTIVE` statuses fail closed without borrowing local active cards.
- Unknown Studio JSON block structures preserve safe extension properties while stripping `__proto__` keys (`preserveStudioJson`), maintaining preview (`/app/events/:id/preview`) and published (`/i/:slug`, `/w/:slug`) parity.
- PostMessage iframe previews enforce strict exact origin + `event.source === parent` + active session nonce (`previewMessaging.js`).
