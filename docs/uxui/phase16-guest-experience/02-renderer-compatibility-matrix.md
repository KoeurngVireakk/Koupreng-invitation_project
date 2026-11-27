# Guest Invitation Renderer Compatibility Matrix (Phase 16)

**Source of Truth Inspected (`46887ac9`):**
- `apps/frontend-user/src/features/templates/registry/templateRegistry.js`
- `apps/frontend-user/src/features/templates/data/templatesData.js`
- `apps/frontend-user/src/features/templates/experience/TemplateExperience.jsx`
- `apps/frontend-user/src/features/templates/experience/TemplateRenderGuard.jsx`
- `apps/frontend-user/src/features/templates/model/templateModel.js`
- `apps/frontend-user/src/features/templates/registry/templateRegistry.test.jsx`
- `apps/frontend-user/src/features/templates/layouts/phase16RendererParity.test.jsx`

---

## 1. Reconciliation Against Historical 8-Renderer Handoff

Earlier prose documents cited eight shorthand names (`royal-garden-cinematic`, `khmer-floral-gold`, `khmer-celestial`, `silk-heritage`, `emerald-canva-luxe-wedding`, `digital-yes`, `with-joy-portal`, `bliss-editorial`). Comparing directly against `templateRegistry.js`, `TemplateExperience.jsx`, and `templatesData.js` yields **two canonical slug corrections** plus **five additional registered/experience renderers and one safe unknown-code fallback**:

1. **Typo reconciliation:**
   - `with-joy-portal` (historical prose) -> canonical registry ID is **`withjoy-modern-portal`**.
   - `bliss-editorial` (historical prose) -> canonical registry ID is **`bliss-editorial-wedding`**.
   - `digital-yes` (historical prose) -> alias of canonical registry ID **`the-digital-yes-wedding`**.
2. **Additional verified renderers & aliases preserved intact:**
   - `khmer-golden-canva-inspired-wedding` & `cover-khmer-golden-wedding` (`CanvaKhmerWeddingTemplate`)
   - `template-boilerplate` (`TemplateBoilerplateLayout`, alias `custom-starter`)
   - `event-essential` (`EventEssentialLayout`, routed in `TemplateExperience.jsx:818`)
   - `koupreng-demo-wedding` (shared `WeddingTemplateExperience` scene in `TemplateExperience.jsx:821`)
   - `royal-khmer-wedding` / `royal-khmer` (`KhmerCelestialLayout`; `RoyalKhmerLayout.jsx` forwards directly to `KhmerCelestialLayout`)
   - Unknown/unmapped code fallback (`DefaultTemplateLayout` when `useFallback` or `TemplateUnavailable`)

**Guarantee:** Zero canonical IDs, DB template numeric mappings (`DB_TEMPLATE_ID_MAP`), preset mappings (`PRESET_TO_VARIANT`), or catalog entitlements were altered during Phase 16 (`PR #41` + `PR #42`).

---

## 2. Complete Canonical Renderer Matrix

| # | Canonical ID | Known Aliases / DB IDs | React Component / Layout | Opening Scene Behavior | Reduced Motion (`prefers-reduced-motion: reduce`) | Dashboard Dark Mode Isolation | Capabilities / Date & Program Styling | Verified By |
|---|---|---|---|---|---|---|---|---|
| 1 | `khmer-floral-gold` | Preset floral floral-gold | `KhmerFloralGoldLayout` (`DedicatedComponent`) | Bespoke `.kfg-open` golden floral envelope gate + skip control | Simplifies transition (`invitation-styles.css` + reduced fade) | Isolated light/cream gold art direction | Supports 8 date styles (`data-date-style`), 8 program styles (`data-program-style`), 8 guest frames, muted/contain replay video | `phase16RendererParity.test.jsx`, `capture-phase16-evidence.mjs` (`01`, `15`), `playwright.batch12` |
| 2 | `royal-garden-cinematic` | `royal-garden` | `RoyalGardenCinematicLayout` (`DedicatedComponent`) | Dual gold cover + optional pre-wedding video modal (`CinematicOpeningProvider`, `demoVideo` public demo only) | Bypasses auto cinematic video playback (`CinematicOpeningProvider.jsx:24`), keeps static poster + instant reveal | Isolated ivory/royal gold botanical garden palette | Quick nav, music gesture control, full bilingual section fidelity | `RoyalGardenV3.test.jsx`, `royal-garden-mobile-navigation.spec.js`, `capture-phase16-evidence.mjs` (`02`, `16`) |
| 3 | `silk-heritage` | Heritage Silk | `SilkHeritageLayout` (`DedicatedComponent`) | Silk heritage cover & reveal + `.sh-skip` | Reduced CSS transitions, instant reveal | Isolated woven crimson/gold heritage palette | Supports date/program styles, bilingual RSVP, gallery lightbox | `phase12ContractMatrix.test.jsx`, `capture-phase16-evidence.mjs` (`03`, `19`) |
| 4 | `khmer-celestial` | `KHMER_CELESTIAL`, `10`, alias `royal-khmer-wedding`, `1`, `royal-khmer`, `RUBY_RED`, `ROYAL_KHMER` (`RoyalKhmerLayout` forwards here) | `KhmerCelestialLayout` (`DedicatedComponent`) | `CelestialOpening` golden gate & skip | Respects `usePrefersReducedMotion`, zero continuous orbital animation | Isolated celestial night/gold invitation surface | Supports family details, countdown, schedule, venue, gallery, RSVP | `phase12ContractMatrix.test.jsx`, `capture-phase16-evidence.mjs` (`04`, `05`, `20`) |
| 5 | `the-digital-yes-wedding` | `7`, `digital-yes`, `GOLD_LUXURY` | `DigitalYesLayout` (`DedicatedComponent`) | Wax seal / envelope cover (`tdy-envelope-scene`) with skip/open button | Reduced 3D flip/seal animation | Isolated paper/gold editorial palette | Supports `PR #42` responsive overflow/bottom dock clearance & clean mobile spacing | `phase16RendererParity.test.jsx`, `capture-phase16-evidence.mjs` (`06`, `25`) |
| 6 | `emerald-canva-luxe-wedding` | `emerald_royal_luxe`, `emerald-royal-luxe`, `emerald royal luxe`, `emerald-luxe-wedding`, `9`, `2`, `emerald-luxe`, `EMERALD_GREEN` | `EmeraldLuxeLayout` (`DedicatedComponent`) + `Card3DFlip` | Emerald card / 3D flip gate with accessible skip (`el-skip-btn`) | Simplified non-3D fade reveal (`Card3DFlip.jsx` hardened in PR `#42`) | Isolated emerald/champagne art direction | Preserves emerald palette regardless of host Obsidian dark mode | `phase16RendererParity.test.jsx`, `capture-phase16-evidence.mjs` (`07`) |
| 7 | `withjoy-modern-portal` *(prose typo: `with-joy-portal`)* | `3` | `WithJoyPortalLayout` + `WithJoyPortalOpening` | Opt-in glassmorphism split panels (`.wj-opening__enter` / `.wj-opening__skip`, Escape key); `coverless` flag avoids double `CinematicOpeningProvider` cover | **Fully bypassed** when `prefers-reduced-motion: reduce`, `preview`, or `showOpening: false` (`WithJoyPortalOpening.jsx:23`) | Isolated modern light portal aesthetic | `PR #42` added gallery lightbox, bilingual copy parity, floating nav/audio coordination | `guestCeremonyOpenings.test.jsx`, `phase16RendererParity.test.jsx`, `capture-phase16-evidence.mjs` (`08`, `18`) |
| 8 | `bliss-editorial-wedding` *(prose typo: `bliss-editorial`)* | `4` | `BlissEditorialLayout` + `BlissEditorialOpening` | Opt-in magazine cover turn (`.bliss-opening__turn` / `.bliss-opening__skip`, Escape key); `coverless` flag | **Fully bypassed** under `prefers-reduced-motion: reduce`, `preview`, or `showOpening: false` (`BlissEditorialOpening.jsx:22`) | Isolated warm editorial print palette | `PR #42` hardened `safeImageUrl` gallery images, RSVP section & mobile typography | `guestCeremonyOpenings.test.jsx`, `phase16RendererParity.test.jsx`, `capture-phase16-evidence.mjs` (`09`, `17`) |
| 9 | `khmer-golden-canva-inspired-wedding` | `5`, `CHAMPAGNE`, `KHMER_GOLDEN` | `CanvaKhmerWeddingTemplate` | Champagne golden gate with reduced-motion check (`CanvaKhmerWeddingTemplate.jsx:720`) | Reduced motion disables animated shimmer/scroll transforms | Isolated champagne parchment art direction | Supports multi-section Khmer ceremonial typography & Canva-inspired grid | `canva-khmer-wedding.css` PR `#42` diffs, `capture-phase16-evidence.mjs` (`10`) |
| 10 | `cover-khmer-golden-wedding` | Legacy cover slug | `CanvaKhmerWeddingTemplate` | Shared golden cover opener | Same reduced-motion guard as `#9` | Isolated champagne palette | Backwards-compatible slug for existing invitations | `capture-phase16-evidence.mjs` (`11`) |
| 11 | `template-boilerplate` | `custom-starter` | `TemplateBoilerplateLayout` (`coverless`) | Opt-in minimal starter reveal (`tpl-skip-opening-btn`) | Simplified opacity reveal | Isolated starter surface | Modular base starter layout for custom compositions | `capture-phase16-evidence.mjs` (`12`) |
| 12 | `event-essential` | Non-wedding / general event default (`id: 30`) | `EventEssentialLayout` (`TemplateExperience.jsx:818`) | No blocking ceremony curtain; direct event summary & details | Zero animated blocker | Isolated clean event card presentation | Designed for birthdays, corporate, anniversaries, concise weddings | `batch12-route-content.spec.js`, `capture-phase16-evidence.mjs` (`13`) |
| 13 | `koupreng-demo-wedding` | Default demo wedding | `WeddingTemplateExperience` (`TemplateExperience.jsx:821`) | `TemplateOpeningGate` (`khmer-royal` / `ribbon-untie` / `curtain` / `envelope-3d` / `magical-gate` / `celestial-cover`) | Reduced-motion sets instant exit/no scale animation | `[data-theme="wed"]` isolated tokens | Supports unified `DynamicTemplateRenderer` blocks and legacy sections | `batch12-core-hardening.spec.js`, `capture-phase16-evidence.mjs` (`14`) |
| 14 | Unknown / unmapped code | e.g. `unknown-slug` | `TemplateExperience` -> `resolveTemplateRenderer` -> `DefaultTemplateLayout` or `TemplateUnavailable` | `CoverBackground` without blocking gate when fallback applied | Instant static render | Safe neutral cream fallback | Prevents crashes when unknown catalog IDs or retired aliases are loaded (`TemplateRenderGuard` error boundary) | `templateRegistry.test.jsx`, `capture-phase16-evidence.mjs` (`unknown` case check) |

---

## 3. Contract Notes Observed in Code & Tests

1. **Intentional Reduced-Motion Cover Bypass vs Legacy Test Assertion (`invitation-styles-v2.spec.js`):**  
   `WithJoyPortalOpening.jsx:23` and `BlissEditorialOpening.jsx:22` intentionally bypass the cover layer (`if (bypassed || phase === "done") return null;`) when `prefers-reduced-motion: reduce` is set — aligning strictly with `MASTER_SCOPE.md` ("Respect `prefers-reduced-motion` through a real simplified path, not only a shorter duration"). Existing standalone spec `tests/e2e/invitation-styles-v2.spec.js:21` asserts a visible opener button even under `emulateMedia({ reducedMotion: 'reduce' })` for `withjoy-modern-portal`, `bliss-editorial-wedding`, and `koupreng-demo-wedding` (pre-existing test mismatch, non-regression).
2. **Template Data-Safe URL Parity Resolved (`WithJoyPortalLayout.jsx`):**  
   Aligned `WithJoyPortalLayout.jsx` (`coverImage` + `galleryImages`) with `BlissEditorialLayout.jsx` using `safeImageUrl(...)`, verified by new unit assertion in `phase16RendererParity.test.jsx`.
