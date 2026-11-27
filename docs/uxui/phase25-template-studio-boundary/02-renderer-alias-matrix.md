# Phase 25 — Renderer & Legacy Alias Compatibility Matrix

| Incoming Code / Alias / PresetId | Resolved Variant (`resolveVariant`) | Dedicated Layout Component (`templateRegistry`) | Status |
| --- | --- | --- | --- |
| `silk-heritage` / `SILK_HERITAGE` / `classic` / `luxury` / `modern-khmer` / `vintage-gold` | `silk-heritage` | `SilkHeritageLayout` | Preserved & Verified |
| `khmer-floral-gold` / `KHMER_FLORAL_GOLD` | `khmer-floral-gold` | `KhmerFloralGoldLayout` | Preserved & Verified |
| `royal-garden-cinematic` / `ROYAL_GARDEN_CINEMATIC` | `royal-garden-cinematic` | `RoyalGardenCinematicLayout` | Preserved & Verified |
| `khmer-celestial` / `KHMER_CELESTIAL` / `10` | `khmer-celestial` | `KhmerCelestialLayout` | Preserved & Verified |
| `royal-khmer` / `royal-khmer-wedding` / `royal` / `RUBY_RED` / `ROYAL_KHMER` / `1` | `royal-khmer-wedding` | `KhmerCelestialLayout` | Preserved & Verified |
| `the-digital-yes-wedding` / `the-digital-yes` / `digital-yes` / `GOLD_LUXURY` / `7` | `the-digital-yes-wedding` | `DigitalYesLayout` | Preserved & Verified |
| `emerald-canva-luxe-wedding` / `EMERALD_GREEN` / `emerald-luxe` / `2` / `9` | `emerald-canva-luxe-wedding` | `EmeraldLuxeLayout` | Preserved & Verified |
| `withjoy-modern-portal` / `3` | Default / Registry component | `WithJoyPortalLayout` | Preserved & Verified |
| `bliss-editorial-wedding` / `4` | Default / Registry component | `BlissEditorialLayout` | Preserved & Verified |
| `khmer-golden-canva-inspired-wedding` / `cover-khmer-golden-wedding` / `CHAMPAGNE` / `KHMER_GOLDEN` / `5` | `khmer-golden-canva-inspired-wedding` / `cover-khmer-golden-wedding` | `CanvaKhmerWeddingTemplate` | Preserved & Verified |
| `template-boilerplate` / `custom-starter` | Default / Registry component | `TemplateBoilerplateLayout` | Preserved & Verified |
| Removed / Unknown custom code (`removed-studio-template-999`) | Fail-closed (`available: false`) | `<TemplateUnavailable />` | Fail-Closed Verified |
