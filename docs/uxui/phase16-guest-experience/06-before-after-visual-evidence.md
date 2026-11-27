# Phase 16 Before vs. After Visual Evidence (`c4e4a10a` vs. `46887ac9` + `TemplateDressCode` fix)

**Script:** `scripts/qa/capture-phase16-evidence.mjs`  
**Before Baseline Commit:** `c4e4a10a` (`Merge pull request #38 from KoeurngVireakk/fix/post-migration-hardening`, built in isolated temporary worktree cleanly removed afterward)  
**After Implementation Commit:** `46887ac9` (`PR #42` merged on `origin/main` + targeted ARIA `role="list"` fix in `TemplateDressCode.jsx`)  
**Browser:** Headless Chromium (`wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` via `@axe-core/playwright`)  
**Output Artifacts:** `docs/uxui/phase16-guest-experience/evidence/before/` (`25` PNGs + `metrics.json`) and `docs/uxui/phase16-guest-experience/evidence/after/` (`25` PNGs + `metrics.json`)  

---

## 1. Visual & Metric Delta Highlights

1. **Zero Horizontal Overflow Across Every Tested Width:** Both `before` (`25/25`) and `after` (`25/25`) measure `overflowPx = 0` (`scrollWidth === innerWidth`) across `320px`, `390px`, `768px`, `844x390` landscape, and `1440px`.
2. **WCAG 2.2 AA (`target-size`) Resolved on Canva Khmer Renderers (`PR #42`):**
   - `10-renderer-khmer-golden-canva-inspired-wedding-km-390.png`: `before` had `target-size` violation -> `after` has **`0` axe violations**.
   - `11-renderer-cover-khmer-golden-wedding-km-390.png`: `before` had `target-size` violation -> `after` has **`0` axe violations**.
3. **WCAG 2.2 AA (`aria-prohibited-attr`) Resolved (`TemplateDressCode.jsx` fix):**
   - `14-renderer-koupreng-demo-wedding-km-390.png`: `before` had `aria-prohibited-attr` on `.tx-dress__palette` -> `after` has **`0` axe violations**.
4. **Password-Protected Rate-Limit Gate (`21-state-password-gate-rate-limit-390.png`):**
   - Visually inspected: displays `.protected-gate-card` (`បញ្ចូលពាក្យសម្ងាត់`), inline Khmer 429 rate-limit banner, eye toggle, crisp emerald focus outline, `axe = 0`, `overflow = 0px`.
5. **Dark Dashboard Isolation (`19-silk-heritage-dashboard-dark-isolated-390.png`):**
   - Even with `localStorage['koupreng.colorMode'] === 'dark'`, public guest view preserves light/ivory invitation surface (`rgb(251, 246, 238)`), zero Obsidian leakage, `axe = 0`.

---

## 2. Paired Before/After Visual Registry (`25` Scenarios)

| # | Case File | Route & Viewport | Before (`c4e4a10a`) Overflow / Axe | After (`46887ac9+`) Overflow / Axe | Observed Disposition |
|---|---|---|---|---|---|
| 01 | `01-renderer-khmer-floral-gold-km-390.png` | `/i/guest-khmer-floral-gold` (`390x844` KM) | `0px` / `1` *(fade)* | `0px` / `1` *(mid-fade `.kfg-guest-frame`)* | Preserved unique floral art; settled axe 0 |
| 02 | `02-renderer-royal-garden-cinematic-km-390.png` | `/i/guest-royal-garden-cinematic` (`390x844` KM) | `0px` / `0` | `0px` / `0` | Clean botanical gate & skip |
| 03 | `03-renderer-silk-heritage-km-390.png` | `/i/guest-silk-heritage` (`390x844` KM) | `0px` / `0` | `0px` / `0` | Clean silk heritage layout |
| 04 | `04-renderer-khmer-celestial-km-390.png` | `/i/guest-khmer-celestial` (`390x844` KM) | `0px` / `0` | `0px` / `1` *(mid-fade `.kc-opening__skip`)* | Celestial gate; static CSS contrast `10.4:1` |
| 05 | `05-renderer-royal-khmer-wedding-km-390.png` | `/i/guest-royal-khmer-wedding` (`390x844` KM) | `0px` / `0` | `0px` / `1` *(mid-fade `.kc-opening__skip`)* | Alias routing to `KhmerCelestialLayout` verified |
| 06 | `06-renderer-the-digital-yes-wedding-km-390.png` | `/i/guest-the-digital-yes-wedding` (`390x844` KM) | `0px` / `0` | `0px` / `0` | Digital Yes mobile spacing verified |
| 07 | `07-renderer-emerald-canva-luxe-wedding-km-390.png` | `/i/guest-emerald-canva-luxe-wedding` (`390x844` KM) | `0px` / `0` | `0px` / `0` | Emerald Luxe verified |
| 08 | `08-renderer-withjoy-modern-portal-km-390.png` | `/i/guest-withjoy-modern-portal` (`390x844` KM) | `0px` / `0` | `0px` / `0` | Inspected visually: clean Khmer headers & ticket dock |
| 09 | `09-renderer-bliss-editorial-wedding-km-390.png` | `/i/guest-bliss-editorial-wedding` (`390x844` KM) | `0px` / `0` | `0px` / `0` | Editorial print layout verified |
| 10 | `10-renderer-khmer-golden-canva-inspired-wedding-km-390.png` | `/i/guest-khmer-golden-canva-inspired-wedding` (`390x844` KM) | `0px` / `1` (`target-size`) | **`0px` / `0`** | **Improved:** PR `#42` fixed touch target sizing |
| 11 | `11-renderer-cover-khmer-golden-wedding-km-390.png` | `/i/guest-cover-khmer-golden-wedding` (`390x844` KM) | `0px` / `1` (`target-size`) | **`0px` / `0`** | **Improved:** PR `#42` fixed touch target sizing |
| 12 | `12-renderer-template-boilerplate-km-390.png` | `/i/guest-template-boilerplate` (`390x844` KM) | `0px` / `0` | `0px` / `0` | Clean starter layout |
| 13 | `13-renderer-event-essential-km-390.png` | `/i/guest-event-essential` (`390x844` KM) | `0px` / `0` | `0px` / `0` | Coverless event card verified |
| 14 | `14-renderer-koupreng-demo-wedding-km-390.png` | `/i/guest-koupreng-demo-wedding` (`390x844` KM) | `0px` / `1` (`aria-prohibited-attr`) | **`0px` / `0`** | **Fixed:** `TemplateDressCode.jsx` `role="list"` added |
| 15 | `15-khmer-floral-gold-desktop-en-1440.png` | `/i/guest-khmer-floral-gold` (`1440x900` EN) | `0px` / `1` *(mid-fade)* | `0px` / `1` *(mid-fade)* | Inspected desktop balanced proportions |
| 16 | `16-royal-garden-tablet-en-768.png` | `/i/guest-royal-garden-cinematic` (`768x1024` EN) | `0px` / `0` | `0px` / `0` | Tablet reflow verified |
| 17 | `17-bliss-editorial-narrow-320.png` | `/i/guest-bliss-editorial-wedding` (`320x568` KM) | `0px` / `0` | `0px` / `0` | Inspected: zero clipping at `320px` |
| 18 | `18-withjoy-reduced-motion-390.png` | `/i/guest-withjoy-modern-portal` (`390x844`, `reduce`) | `0px` / `0` | `0px` / `0` | Reduced-motion bypasses cover immediately |
| 19 | `19-silk-heritage-dashboard-dark-isolated-390.png` | `/i/guest-silk-heritage` (`390x844`, dark mode set) | `0px` / `0` | `0px` / `0` | Inspected: public template isolated from dark canvas |
| 20 | `20-landscape-phone-khmer-celestial-844x390.png` | `/i/guest-khmer-celestial` (`844x390` KM) | `0px` / `0` | `0px` / `1` *(mid-fade `.kc-opening__skip`)* | Landscape phone width clean (`0px` overflow) |
| 21 | `21-state-password-gate-rate-limit-390.png` | `/i/protected-gate` (`390x844` KM `403`->`429`) | `0px` / `0` | **`0px` / `0`** | Inspected: 429 rate-limit alert & clean focus ring |
| 22 | `22-state-private-not-found-390.png` | `/i/private-unpublished` (`390x844` KM `404`) | `0px` / `0` | `0px` / `0` | Non-enumerating unavailable card |
| 23 | `23-state-network-error-390.png` | `/i/network-error-sample` (`390x844` EN abort) | `0px` / `0` | `0px` / `0` | Clean retry recovery card |
| 24 | `24-state-rsvp-and-ticket-success-390.png` | `/i/guest-personalized?token=gtok_demo_88` (`390x844` EN) | `0px` / `1` *(mid-fade)* | `0px` / `1` *(mid-fade)* | Personalized token RSVP flow |
| 25 | `25-state-telegram-inapp-ua-390.png` | `/i/guest-the-digital-yes-wedding` (`390x844`, Telegram UA) | `0px` / `0` | `0px` / `0` | Clean Telegram UA emulation (`0` errors) |
