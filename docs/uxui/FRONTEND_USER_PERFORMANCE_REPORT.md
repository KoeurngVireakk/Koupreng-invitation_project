# Koupreng Frontend User Performance Report

> [!IMPORTANT]
> **Measurement Disclaimer:** All timings and byte metrics below are **local Vite preview Chromium headless lab measurements** (`127.0.0.1`, `1440x900`, reduced motion, 1 warmup + median of 3 runs, mocked `/api/**` JSON fixtures). They represent reproducible client-side bundle & render characteristics, **not** production field telemetry (CrUX / Cambodia mobile carrier RTT).

---

## 1. Production Bundle Characteristics (`apps/frontend-user/dist/assets`)

- **Entry HTML:** `dist/index.html` (`8.13 kB` / `2.39 kB` gzip)
- **Main JS Entry (`index-*.js`):** `479.46 kB` (`142.84 kB` gzip)
- **Architecture:** Route-level `React.lazy` splitting keeps specialized host modules (`InvitationEditFeature`: `251.15 kB` raw / `65.57 kB` gzip, `InvitationCheckInPage`: `186.23 kB` raw / `63.04 kB` gzip) and individual ceremonial wedding layouts (`KhmerFloralGoldLayout`, `RoyalGardenCinematicLayout`, `KhmerCelestialLayout`, `DigitalYesLayout`, etc.) loaded on demand rather than bundled into landing or catalog visitors.
- **Asset Strategy:** Preloaded local WOFF2 fonts (`Kantumruy Pro`, `DM Sans`) avoid external Google Fonts FOIT on critical paths; non-hero images use `loading="lazy"` + `decoding="async"`.

---

## 2. Chromium Lab Telemetry (`scripts/qa/capture-phase26-validation.mjs`)

| Route | DCL (ms) | Load (ms) | FCP (ms) | LCP (ms) | CLS | JS Transfer (kB) | CSS Transfer (kB) | Task (ms) | JS Heap (MB) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | `59` | `897` | `148` | `148` | `0.0019` | `224.1` | `49.1` | `164` | `4.72` |
| `/templates` | `81` | `847` | `132` | `456` | `0.0011` | `224.4` | `49.1` | `144` | `5.03` |
| `/app/events` | `73` | `825` | `112` | `480` | `0` | `293.0` | `72.5` | `183` | `5.50` |
| `/i/audit-event` | `66` | `885` | `96` | `856` | `0.0013` | `411.5` | `109.0` | `342` | `6.35` |

- **Lab Compliance:** `CLS <= 0.0019` (target `<= 0.10`), `LCP <= 856ms` (local preview lab), bounded transferred JS (`224.1–411.5 kB` per route).
- **Pending Production Verification (`BLOCKED_EXTERNAL`):** Live staging network waterfall, CDN cache headers, and physical mid-tier Android 3G/4G performance profiling.
