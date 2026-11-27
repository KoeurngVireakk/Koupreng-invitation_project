# Phase 26 — Frontend User Lab Performance Report

> [!IMPORTANT]
> All runtime timings below are **local Chromium Playwright Lab Measurements** against `vite preview` (`127.0.0.1`, `1440x900`, `reduced-motion`, 1 warmup + median of 3 runs, API fixtures mocked). They are **not** production CrUX/field telemetry.

## 1. Production Bundle Footprint (`apps/frontend-user/dist/assets`)

- **Entry HTML:** `dist/index.html` (`8.13 kB` / `2.39 kB` gzip)
- **Main JS Entry (`index-*.js`):** `479.46 kB` (`142.81 kB` gzip) — route-level lazy chunking (`React.lazy` in router) keeps heavy host routes (`InvitationEditFeature`: `251.15 kB` raw / `65.58 kB` gzip, `InvitationCheckInPage`: `186.23 kB` raw / `63.04 kB` gzip) and individual wedding renderers isolated from landing/catalog visitors.

## 2. Chromium Lab Metrics (`capture-phase26-validation.mjs --stage=after`)

| Route | DCL (ms) | Load (ms) | FCP (ms) | LCP (ms) | CLS | JS Transfer (kB) | CSS Transfer (kB) | Task (ms) | JS Heap (MB) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | `59` | `897` | `148` | `148` | `0.0019` | `224.1` | `49.1` | `164` | `4.72` |
| `/templates` | `81` | `847` | `132` | `456` | `0.0011` | `224.4` | `49.1` | `144` | `5.03` |
| `/app/events` | `73` | `825` | `112` | `480` | `0` | `293.0` | `72.5` | `183` | `5.50` |
| `/i/audit-event` | `66` | `885` | `96` | `856` | `0.0013` | `411.5` | `109.0` | `342` | `6.35` |

- Zero CLS violations (`<= 0.003` across all measured routes; threshold `<= 0.10`).
- Lab LCP under `850ms` across landing, catalog, host hub, and public guest invite.
- Live CDN/origin latency, real 3G/4G Cambodia mobile carrier telemetry, and external asset hosts require staging/production instrumentation (**`BLOCKED_EXTERNAL`** in local CI/preview).
