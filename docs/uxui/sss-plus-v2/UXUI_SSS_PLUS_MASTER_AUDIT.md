# Koupreng SSS+ V2 audit and remediation

**Verdict — `PARTIAL_AUDIT_BLOCKED`.** This candidate contains working UX changes and fixture-backed browser evidence. The complete Phase 01–27 acceptance matrix, independent visual sign-off, and external certification gates remain open. The SSS+ threshold requires 95/100 overall and per critical family, all individual categories rated at least 4/5, and all hard gates. The current evidence cannot support a platform score.

## Recovery and scope

The base is authorized `origin/main` at `11c8ea41c4c3425561c21d65ed795d7628fc4e1a`, a descendant of the requested Phase 27 checkpoint `e65f279f6249070c1bbce2a8b5c28593e5aada97`. [PR #54](https://github.com/KoeurngVireakk/Koupreng-invitation_project/pull/54) confirms the checkpoint. The newer baseline has successful [CI](https://github.com/KoeurngVireakk/Koupreng-invitation_project/actions/runs/46033093595) and [CodeQL](https://github.com/KoeurngVireakk/Koupreng-invitation_project/actions/runs/46033093495).

Work used a dedicated worktree and branch. The original checkout was clean at recovery and its worktree, stashes and other branches were preserved. The installation report was located in the installation reports directory. Its V6.2 and later notes supersede the older CLI-version and discovery limitations in the master text. Local runtime discovery returned Codex 0.172.0 and Antigravity 1.5.18. The repository skill verification reported 58 valid skills and 10 pinned vendor directories. The installation manifest records historical vendor hash verification. Upstream skills were left untouched.

The [phase matrix](UXUI_PHASE_01_27_AUDIT_MATRIX.csv) records official phase names, Git provenance and remaining scope. Historical Phases 24–25 establish the customer compatibility boundary. The Admin work below is new. The [route census](UXUI_ROUTE_STATE_CENSUS.csv) records current fixture renders. The user router contains 110 leaf patterns after expansion, including aliases, an event index, and a catch-all. The Admin router contains 24 leaves with its index, nine aliases, and catch-all. Responsive snapshots exercise only the fixture state declared for each row.

## Design concepts and implementation

| Surface | Level | Chosen direction | Considered alternative and reason |
| --- | --- | --- | --- |
| Admin shell and overview | B | Labeled desktop rail and matching mobile groups. A unified metric panel leads to receipts and operations. | An expanded icon dock would still ask users to recall icons and separate related tasks. A single horizontal bar would crowd Khmer labels. |
| Admin Template Studio | B | Editor tools on the left or Edit tab, simulation controls in the Preview panel, and a concise toolbar for template identity and actions. | A full-width global device toolbar uses scarce short-screen height on the Edit task. A 3D device shell outside the iframe also obscures the true viewport. |
| My Events | B | Search and period remain visible. A named disclosure holds status, event type and sort, and the clear action remains visible when filters are applied. | Permanently visible selects put four input rows above the first event on mobile. A modal introduces an extra focus boundary for a small set of controls. |
| Khmer Celestial | B on the opening | A raised, text-based clasp and immediately readable cover over the existing botanical composition. Music starts from its own control. | The image-only button with perpetual motion could hide localized text or focus. A full WebGL envelope adds loading and fallback cost to the principal action. |
| Khmer Floral Gold | A | Preserve stationery and scenes. Animate the ornament in depth and keep guest names and the welcome frame readable throughout the handoff. | Fading entire scenes left a period with decoration and no readable message. The chosen motion keeps the sequence and artwork. |

The candidate changes presentation, UI interaction, and browser verification. It preserves backend APIs, template registry identities, preview origins and sessions, authorization, pricing, checkout and Flyway migrations. Admin Studio still serializes through its existing helper and reports save success after the server response. The active/inactive control drives the save label. The production navigation omits the development-only monitor shortcut. The existing protected route and server checks retain their behavior.

## Remediation ledger and UX decisions

| ID | Priority | Finding and change | Observable proof and remaining gate |
| --- | --- | --- | --- |
| ADMIN-01 | P1 | Equal-spaced icon-only navigation concealed task labels. Grouped destinations, visible labels and current-page treatment implement recognition and Gestalt proximity. | Desktop and mobile rail/drawer captures. Existing role and query behavior covered by unit tests. |
| ADMIN-02 | P1 | A 503 dashboard message and Studio presets lacked contrast. Shared error text now uses the destructive semantic pair and Studio copy uses a brighter foreground. | Axe targets in the before/after Admin captures. Full WCAG manual matrix remains open. |
| STUDIO-01 | P1 | Preview-only controls consumed Edit height. Device and scene controls follow the preview, with a fixed short-viewport basis and preserved iframe. | Mobile viewport, desktop device presets, authoring sections and resize regression checks. Full authoring mutation roundtrip requires an approved staging fixture. |
| STUDIO-02 | P1 | A single publish message described inactive saves as publication. Copy now distinguishes the selected status, shows unsaved changes, and confirms after the API response. | Existing template edit suite and labeled catalog fields. Verify activation policies with staging accounts. |
| OWNER-01 | P2 | Search and events were pushed below persistent selects. Native disclosure applies progressive disclosure and keeps the URL as filter state. The clear-search target is 44px. | Before/after event list, keyboard and query-state coverage. Measured user task timing remains open. |
| GUEST-01 | P1 | Celestial skip entered at low contrast. The cover exposes readable identity and actions immediately. Keyboard focus and the main-content handoff remain available. | Browser and unit tests for opening, bypass and guest-name layout. |
| GUEST-02 | P1 | Floral faded the guest name and welcome scene before the next stage mounted. The existing ornament moves while essential cover content stays readable. | Normal and reduced-motion fixtures, contrast and visual comparison. |
| GUEST-03 | P1 | Opening could start audible music on the two changed renderers. The player requires its own action and retains an accessible retry path. | Test assertions for silent opening, explicit play, pause, locale changes, and cleanup. Full live-device audio matrix remains open. |
| QA-01 | P1 | Admin shell and renderer samples lacked a current equivalent-state matrix. Extended capture tools record synthetic response codes, renderer markers and diagnostics. | See the route census and reproduction commands. Each fixture tests only its declared contract. |
| QA-02 | Open | Off-viewport element flags were reported on some owner routes even with zero document overflow. Some flags may be intentional clipping or scrolling. | Needs per-element interaction diagnosis on guests, template browse, check-in, reports, packages, payment history and event creation. |

The design applies Jakob's Law through familiar sidebar, button and filter semantics. Fitts's Law informs 44px touch controls. Hick–Hyman and grouping inform the shorter default event toolbar. Nielsen's visibility and recovery principles inform save truth, retry copy and focus restoration. Stable timing keeps the next action available while decor moves, applying the Doherty Threshold as an engineering check. The cover preserves ceremony pacing and readable arrival, applying Peak–End judgment. These are design evaluations rather than timed representative user studies. Miller, Tesler, Aesthetic–Usability, Von Restorff, and Goal-Gradient have no separately measured acceptance result in this candidate.

## Design system, localization and motion

The existing canonical semantic tokens, logo, DM Sans and Kantumruy Pro remain the management foundation. New rail, dashboard and Studio affordances use shared control sizes, surface/ink tokens, gold emphasis and explicit focus outlines. Admin Studio uses its independent obsidian workbench and the iframe retains renderer art. Khmer labels remain untracked and use Khmer fonts and line-height. New operational labels are localized, with native linguistic verification pending.

The [motion matrix](UXUI_MOTION_CHOREOGRAPHY_MATRIX.csv) records the tested changes and fallback behavior. The Celestial botanical film and garden still carry depth. The clasp and Floral ornament only animate a local transform. Essential actions and stable identity stay visible. The [skill ledger](UXUI_SKILL_APPLICATION_LEDGER.csv) records the design decisions and external limitations. The [reference register](UXUI_REFERENCE_AND_LICENSE_REGISTER.md) covers all ten React UI catalogs, 60fps.design, public research and licensing.

## Rendered evidence and scorecard

The Frontend User browser sweep rendered 110 route samples twice per stage, at 390px/KM and 1440px/EN with reduced motion and synthetic API fixtures. The sweep observed no page JavaScript errors or document-level horizontal overflow in those 220 samples on either stage. Off-viewport child geometry is retained separately in the [route census](UXUI_ROUTE_STATE_CENSUS.csv). Invitation Studio had historical helper-selector and fixture timeouts on some mobile and Khmer cases. Route snapshots do not verify all of its interactions.

The Admin capture covers all required dashboard widths, desktop phone and tablet emulation by viewport, and a short landscape scenario. The render matrix includes dark and light, EN and KM, mobile drawer, admin login, auth redirect, error/empty states and template authoring controls. Existing independent fixture suites and current GitHub CI remain separate evidence sources.

The original 25-case public renderer rerun reported zero JavaScript errors, document overflow and Axe violations after the work. It includes the 14 renderer and alias entries, mobile/desktop examples, access errors, reduced motion and a simulated Telegram user agent. Three baseline script errors were transient in that run. They were not attributed to a source defect without a reproducible stack. A browser user-agent simulation is limited to browser behavior with that string. Explicit RSVP, access and payment assertions live in separate tests.

The master rubric is 15 visual, 20 task efficiency, 15 motion, 10 system, 10 responsive, 15 accessibility, 10 performance and 5 localization. Final categories require complete evidence at quality anchors 0–5. Before/after evidence supports improvements in individual decisions. Platform and family scores remain unassigned because critical acceptance coverage is incomplete.

| Fixture | Original | Candidate |
| --- | --- | --- |
| Admin dashboard, English light, 1440×1000 | [Before](evidence/before/admin-dashboard.png) | [After](evidence/after/admin-dashboard.png) |
| Admin Template Studio, Khmer, 390×844 | [Before](evidence/before/admin-studio-km.png) | [After](evidence/after/admin-studio-km.png) |
| Owner event list, Khmer, 390px wide | [Before](evidence/before/owner-events-km.png) | [After](evidence/after/owner-events-km.png) |
| Floral welcome, Khmer, 390×844 | [Before](evidence/before/floral-welcome-km.png) | [After](evidence/after/floral-welcome-km.png) |

## Test, performance and review ledger

Commands ran from the audit worktree with Node 26.12.1 and npm 11.20.0. Unit output includes Happy DOM external resource warnings. Both installation commands returned zero reported npm vulnerabilities at install time.

| Command | Result |
| --- | --- |
| `git fetch origin main` and checkpoint ancestry check | Authorized main verified and historical checkpoint connected |
| `python scripts/validate-agent-routing.py` and `powershell -ExecutionPolicy Bypass -File .\scripts\setup-ai-skills.ps1 -VerifyOnly` | 58 skills valid, 10 pinned, both exit 0 |
| `npm --prefix apps/frontend-user ci` and corresponding Admin command | Exit 0, 39s User and 38s Admin |
| `npm --prefix apps/frontend-user run test -- --maxWorkers=5` | 257 files, 1,979 passed, exit 0, 64.96s. Earlier runs found stale behavior assertions and a lazy renderer timeout under concurrent browser load. |
| `npm --prefix apps/frontend-admin test -- --maxWorkers=4` | 38 files, 206 passed, exit 0, 8.81s |
| Both frontend `lint`, `analyze:knip`, `analyze:deps` and `build` scripts | Exit 0. User build reports missing local `VITE_PUBLIC_APP_URL`. |
| `node scripts/qa/audit-user-route-ui.mjs`, against baseline and candidate Vite previews | 220 fixture renders each, exit 0, no page JavaScript errors or document overflow in that matrix |
| `node scripts/qa/capture-phase16-evidence.mjs --stage=after --base-url=http://127.0.0.1:4188 --out-dir=output/playwright/sss-plus-v2/after/renderers` | The first 25-case run rendered all entries with zero Axe violations, document overflow and page errors. State assertions remain dependent on the scenario's fixture coverage. |
| `npm --prefix apps/frontend-user run test:e2e -- --workers=2 tests/e2e/khmer-floral-gold.spec.js tests/e2e/khmer-celestial-guest-banner.spec.js tests/e2e/phase12-codex-behavior.spec.js` | Initial run 43 passed, 17 failed, 2 skipped in 4.8 minutes. Two affected workflows had stale selectors or a hidden reset control. Subsequent code and test fixes are in this candidate. |
| `npm --prefix apps/frontend-user run test:e2e -- --config=playwright.batch12.config.js --workers=3 -g 'template save roundtrip\|template Back warns\|failed template load'` | 9 passed across Chromium, Firefox and WebKit in 35.5 seconds. An earlier run had three stale save-label assertions. The final run verified unknown JSON roundtrip, immutable catalog identity, guard and recovery, and save-button visibility during resize. |
| `npm --prefix apps/frontend-user run test:e2e -- --workers=2 tests/e2e/floral-v5-regal.spec.js -g 'MP3 survives\|selected wedding song'` | 4 passed in 25.0 seconds on desktop and Pixel emulation. Earlier 5-second assertions expired during the authored welcome scene. |
| `docker info --format '{{.ServerVersion}}'` | Exit 1. The Docker Desktop Linux engine pipe was unavailable. Disposable MySQL and live staging require separate evidence. |

Bundle comparisons use Vite gzip reports. User entry JS stayed near 57.8 kB, event list JS rose from 13.48 to 13.60 kB, and Admin Studio JS dropped from 56.39 to about 55.8 kB. Admin's main CSS decreased slightly. Removing the obsolete Celestial clasp preload saves an initial request for a 1,200,030-byte asset. Lab and field measurements still need the full route and device matrix.

Antigravity independently reviewed the Admin rail and event controls. The diagnostic link concern was reproduced against `application-prod.properties` and fixed. Its event style concern came from review input that omitted `OwnerExperience.css`, which contains the styles exercised by the event screenshots. A separate Codex CLI review identified the stale Studio assertions, narrow loading skeleton overflow, obsolete Celestial clasp preload, loss of the bilingual skip label, and two evidence fixture gaps. The follow-up corrects the assertions and loading layout, removes the preload, restores the bilingual skip, and adds explicit reporting-success and iframe-open assertions. Independent visual and release sign-off remain open.

### Reproduce the local visual evidence

Use production builds from the recorded base and candidate, serve each on separate loopback origins, then set `UX_AUDIT_BASE` and `UX_AUDIT_OUT` for the user sweep. Set `SSS_ADMIN_URL` and run `node scripts/qa/capture-sss-admin.mjs before` or `after` for the Admin sweep. Its embedded preview needs the real Frontend User app on the origin configured in the Admin build. Use `--extended --record-motion` with the phase 16 runner for desktop renderer variants and normal/reduced-motion recordings. Local JSON, logs, traces and motion files are written under `output/playwright/sss-plus-v2`. Review any externally shared evidence for fixture provenance.

## External certification register

| Gate | Status | Missing evidence |
| --- | --- | --- |
| Physical iPhone and Android | BLOCKED_EXTERNAL | Native Safari/Chrome, safe areas, IME/zoom and media |
| Telegram, Facebook, Messenger and WhatsApp | BLOCKED_EXTERNAL | Real app WebViews and provider handoffs |
| Persistent staging | BLOCKED_EXTERNAL | Permission matrix, server writes, DB/Flyway, Cloudflare/TLS and fixtures across both apps |
| ABA PayWay and Telegram settlement, C08-013 | BLOCKED_EXTERNAL | Approved live-provider evidence and reconciliation |
| Native Khmer and assistive technology | BLOCKED_EXTERNAL | Qualified Khmer copy review and physical screen reader/IME passes |
| Field Core Web Vitals | NOT_VERIFIED | Representative production telemetry and release approval |

The previous defect and acceptance ledgers remain in place, including [Phase 26](../PHASE_26_ACCEPTANCE.md) and [Phase 27](../PHASE_27_ACCEPTANCE.md). This candidate's browser fixtures do not establish live payment, privacy or persistence certification.
