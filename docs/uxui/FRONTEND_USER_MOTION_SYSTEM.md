# Koupreng Frontend User Motion System

**Tokens & Primitives:**
- CSS timing variables: [`apps/frontend-user/src/shared/styles/semantic-tokens.css`](../../apps/frontend-user/src/shared/styles/semantic-tokens.css) (`L39–L51`, `L215–L226`)
- Framer Motion exports: [`apps/frontend-user/src/shared/motion/variants.js`](../../apps/frontend-user/src/shared/motion/variants.js)
- Application provider: `<MotionConfig reducedMotion="user">` in `ThemeProvider`

---

## 1. Two-Speed Architecture: Restrained Atelier vs. Ceremonial Invitation

| Surface Layer | Tokens / Exports | Duration & Easing | Intent |
|---|---|---|---|
| **Tactile Press Feedback** | `tactilePress`, `--ui-duration-press: 120ms` | `120ms`, `[0.2, 0.7, 0.3, 1]` | Subtle `scale(0.985)` press response on primary buttons |
| **State / Toggle Feedback** | `--ui-duration-feedback: 160ms` | `160ms` | Filter pills, segmented controls, chevron rotation |
| **Navigation & Overlays** | `pageTransition`, `panelReveal`, `overlayPanel`, `--ui-duration-overlay: 200ms` | `150–220ms` | Drawers, modals, confirmation dialogs without layout shift |
| **Section Reveal** | `fadeUp`, `staggerContainer`, `--ui-duration-reveal: 240ms` | `240ms`, stagger `45ms` | Landing & catalog section entrances |
| **Ceremonial Opening Gates** | `ceremonyReveal`, `--ui-duration-ceremony: 700ms`, `CelestialOpening`, `WithJoyPortalOpening`, `BlissEditorialOpening`, `Card3DFlip` | `700ms+` | Dedicated wedding envelope/gate choreography |

---

## 2. Reduced Motion & Compositor Safety (`prefers-reduced-motion: reduce`)

- `@media (prefers-reduced-motion: reduce)` inside `semantic-tokens.css` collapses all CSS duration tokens (`--ui-duration-*`) to `0ms`, `--ui-motion-distance` to `0px`, and `--ui-motion-scale` to `1`.
- Ceremonal openings use real simplified paths under `reducedMotion`:
  - `CinematicOpeningProvider` skips auto-playing video and keeps static poster + instant open.
  - `WithJoyPortalOpening` & `BlissEditorialOpening` bypass multi-layer split-panel covers (`showOpening` bypass) for instant content visibility.
  - `Card3DFlip` collapses 3D perspective transforms into instant opacity reveal.
- Animations restrict property mutation to compositor properties (`transform`, `opacity`) avoiding layout thrashing on data tables (`Guests`, `Expenses`, `Reports`).
