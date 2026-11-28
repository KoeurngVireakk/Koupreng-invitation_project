# SSS+ V2 implementation and evidence follow-up

This report supplements the [master audit](UXUI_SSS_PLUS_MASTER_AUDIT.md). It records implemented changes and the limits of their evidence. It is not a 95/100 platform acceptance or permission to merge or deploy.

## Implemented review corrections

| Finding | Implementation | Verification boundary |
| --- | --- | --- |
| Custom-font overlay was inaccessible | Reused the existing native AdminDialog, with a localized name, labeled close control, field labels, pressed states, focus entry/wrap/Escape/return and short-screen scrolling | Chromium, Firefox and WebKit keyboard/Axe checks; no native screen-reader certification |
| Admin inspector mixed interface languages and cramped controls | Localized layout, cover, media, music, couple, venue, gift-bank and catalog instructions; preserved cultural examples and Khmer copy; wrapped theme tabs with 44px controls | Independent 375/768/1440 views and component/browser tests; specialized Khmer font-picker copy retains a separate review boundary |
| Owner language editor used English UI in Khmer mode | Interface follows UI language while authored locale, publication permissions and unsaved translated JSON remain independent | Two localization component tests, including unknown-field retention and permission gating |
| Owner table actions were clipped or unreachable by keyboard | Sticky check-in action; named, focusable payment-history and Admin-user invitation scroll regions | Three-engine keyboard checks and 320/390/768/1440 action geometry |
| Notifications lacked page gutters | Reused the shared maximum width and at least 16px lateral spacing | Before/after KM390 and EN1440 evidence; wider responsive captures |
| WithJoy hero scrim was behind its media | Isolated the hero stack and placed a stronger scrim between media and reading content | Real photo and fallback captures; no recoloring of other renderer identities |
| Theme-dependent contrast defects | Corrected preview status pairs, public loading, Event Essential palette isolation, dark style-choice surfaces, media active tabs, paid-template cards, legacy Studio controls and payment-return text | Serious/critical Axe enforcement plus manual computed-color inspection; Axe did not detect the payment footer defect, which the independent reviewer found |
| Admin metadata was too faint | Strengthened template/package/log/monitor metadata and notification helper text; English monitor heading uses management typography | Route-family Axe captures and independent screenshot review |
| Capture tools could exit successfully with accessibility defects | The strict `capture-platform-contracts.mjs` runner fails for document overflow, serious/critical Axe, runtime/contract failures, unknown API reads and attempted mutations | Legacy User/Admin capture helpers remain diagnostic and have permissive read fixtures; their evidence is not credited with the strict runner's request guards. Intentional scrolling is not document overflow |
| Renderer evidence used unsuitable media and unproven success labels | Appropriate repository photo slots, non-payable test QR, settled screenshots, exact bounded RSVP POST and visible confirmation/QR checks | Separate still, motion and RSVP reports; no live payment or ticket-image-export certification |
| Event Essential footer logo was cropped | Removed the broad card-image rule that overrode the nested official logo | Independent 390/1440 measurements confirm natural artwork ratio and `object-fit: contain` |
| Bokeh actions broke words at 375px and English actions produced Khmer feedback | Wrapped the inspector header/action groups, preserved whole compact labels and localized both success toasts | Six independent Chromium cases verify EN/KM at 375/1440 and public-logo geometry; no save or provider call |
| Mobile guest labels had poor dark-mode contrast | Replaced two hard-coded pseudo-element colors with `--guest-muted` | Eight computed labels improved from a minimum 2.72:1 to 7.30:1 on the same KM dark fixture at 390px; manual full-page inspection confirms readability. This is a scoped contrast result, not full WCAG certification |

## Design system and composition audit

The management system retains DM Sans, Kantumruy Pro, semantic foreground/surface pairs, restrained gold emphasis, named navigation groups and native controls. Invitation art keeps its individual palette and display typography. The Event Essential renderer now pins its own reading palette when the surrounding management preference is dark. Preview controls remain outside authored invitation content.

The [master audit concept table](UXUI_SSS_PLUS_MASTER_AUDIT.md#design-concepts-and-implementation) records competing compositions and the chosen Admin shell, Studio, owner-filter and ceremonial directions. No vendor component or upstream skill source was copied into the application. The [reference register](UXUI_REFERENCE_AND_LICENSE_REGISTER.md) evaluates the ten requested UI catalogs, research provenance and costs.

## Accessibility audit

Checks cover automated WCAG 2.2 AA rules, keyboard focus behavior, scrolling, readable labels and contrast in declared fixture states. Automated passes do not establish complete WCAG conformance. Before correction, the expanded family run had eight failing views: seven contrast findings and one ambiguous contact-label test. Those failures remain in local evidence; subsequent retests establish only the corrected states.

Important manual findings included white text on the dark-mode gold media tab, pale footer links on a cream payment-return page, and an English heading rendered with a Khmer display face. They were corrected at their actual source selectors. A positive Axe result alone was not accepted as proof of photographic contrast or physical-device accessibility.

## Responsive audit

The owner follow-up rendered 52 cases across the thirteen specified widths on the two changed owner routes. Eighteen checks exercised intentional scroll regions in three engines. The check-in and payment keyboard tests cover EN/KM at narrow widths; Admin authoring checks include 375/768/1440 and a short viewport. Full-page captures reset scroll before comparison.

The original off-viewport flags were diagnosed as children of intentional scrollers in the seven inspected families. Document width remained equal to viewport width. This resolves those specific flags, not every role/state/zoom combination. Browser viewport emulation does not certify safe areas, native keyboards or embedded messaging browsers.

## Motion and interaction audit

Eight named recordings cover Celestial and Floral normal/reduced motion with complete and interrupted openings. The declared lab uses headless Chromium with video enabled and no CPU/network throttling. RAF interval measurements diagnose main-thread scheduling; they are not compositor dropped-frame measurements or proof of 60fps on physical devices. The [motion matrix](UXUI_MOTION_CHOREOGRAPHY_MATRIX.csv) describes intended choreography and fallbacks.

Essential cover identity stays readable while local ornament/depth moves. Audio remains independently opt-in. The motion evidence reports content-entrance opacity separately from cover/welcome readability. Neither long decorative timelines nor scroll timelines are treated as entrances that can be completed by sleeping.

## Performance audit

Both Vite production builds pass. The User build retains the local missing `VITE_PUBLIC_APP_URL` warnings. Removing the obsolete Celestial clasp preload avoids an initial request for a 1,200,030-byte asset. Earlier bundle comparisons are recorded in the master audit; no new runtime UI dependency was added.

The [controlled performance audit](UXUI_PERFORMANCE_AUDIT.md) reconciles 42 valid before/after observations across seven surfaces. It preserves nine invalid original attempts and records preview readiness, LCP, CLS, long tasks and observed transfer. The earlier unthrottled route probes and eight-case motion run remain separate diagnostics. Field INP/CWV, representative low-end devices and full critical-route and interaction coverage remain open.

## Khmer/English audit

The owner editor now separates interface language from authored language and retains drafts when the interface changes. Admin inspector copy and custom-font controls have English counterparts while preserving Khmer. Native Khmer linguistic, IME and screen-reader review remains external. Proper names, font family names and cultural preview samples are content, not evidence of untranslated interface controls.

## Security and data boundaries

The presentation changes do not modify backend, Telegram, infrastructure, dependency manifests, Flyway migrations or provider contracts. Existing serializers, unknown JSON retention, immutable template identity, server-owned prices/entitlements, USD/KHR separation and preview origin/session checks remain in place. The strict platform-contract fixtures reject unknown reads and mutations. Separate interaction tests explicitly define any bounded write contract; legacy capture helpers do not inherit these guarantees. Separate review and CI supply regression evidence; synthetic browser responses do not prove live persistence or settlement.

## Remaining acceptance backlog

| Priority | Gate | Next evidence required |
| --- | --- | --- |
| P1 internal acceptance | Complete route/role/state and all required responsive/zoom combinations | Extend declared contracts with source-shaped success, denied, failed, loading, empty and mutation-recovery journeys; retain each provenance separately |
| P1 internal acceptance | 95/100 overall and every critical family | Complete the anchored scorecard across all eight categories; a 4/5 visual judgment cannot be promoted to exceptional without new evidence |
| P1 internal acceptance | Comparative performance | Attribute the repeated Home LCP slowdown, profile the observed Invitation Studio load and extend controlled interaction and loading measurements to lower-power profiles and the remaining critical families |
| P1 external release | Physical devices and messaging WebViews | iPhone/Android and real Telegram/Facebook/Messenger/WhatsApp checks |
| P1 external release | Persistent staging/provider certification | Approved Spring Boot/MySQL/Cloudflare environment, permission/write/recovery checks and ABA/Telegram C08-013 evidence |
| P1 external release | Native language and assistive technology | Qualified Khmer review, native IME and screen-reader passes |
| P2 tool availability | Awwwards MCP corpus | Offline status still reports zero sites and HTTP 403; use recorded accessible references and do not retry through the block |

## Deliverable equivalence map

The master permits canonical equivalents. The report set uses these sections rather than parallel copies of the same findings:

| Requested artifact | Canonical location |
| --- | --- |
| Master audit, phase matrix, skill ledger, references, choreography | Existing files beside this report |
| Design-system audit and concept decisions | This report's design-system section and master concept table |
| Motion/interaction audit | This report's motion section, motion matrix and measured recording summary |
| Accessibility and responsive audits | This report's accessibility/responsive sections and declared capture manifest |
| Performance and Khmer/English audits | [Controlled performance audit](UXUI_PERFORMANCE_AUDIT.md) and this report's localization section |
| Remediation backlog and report | Implementation table and remaining acceptance backlog above |
| Final acceptance and external register | [Final acceptance report](UXUI_FINAL_ACCEPTANCE_REPORT.md) and [external certification register](UXUI_EXTERNAL_CERTIFICATION_REGISTER.md) |
| Baseline/final scorecard | [Scorecard](UXUI_BASELINE_FINAL_SCORECARD.csv); blank ratings/totals mean unverified, never zero or pass |

The final acceptance report records the frozen revision, commands/results, independent review and GitHub status. Production deployment and merge remain outside this authorization until explicit owner merge approval.
