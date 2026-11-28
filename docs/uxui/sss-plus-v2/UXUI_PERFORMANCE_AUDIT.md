# W11 controlled loading comparison

The comparison covers seven fixture-backed surfaces on baseline `11c8ea41c4c3425561c21d65ed795d7628fc4e1a` and implementation `e6756d9e358c9eccd29b19d620e58e611de2a8e8`. The reconciled sample contains 42 valid observations, three per stage for every surface. All seven resumed measurements passed their route and renderer readiness checks. The broader performance acceptance gate remains partial. [Measurements and snapshot hashes](evidence/w11-controlled-performance.json).

## Test conditions and reconciliation

- Chromium 156.0.8078.4, 1440×1000 at DPR 1, English light theme, normal motion, 4× CPU slowdown, 150 ms latency, 1.6 Mbit/s down and 750 kbit/s up. Each run used a fresh browser/context with cache disabled and service workers blocked. Baseline and candidate alternated across replicate pairs. Collection continued for three seconds after route readiness and font settling.
- Both stages served Vite production builds from exact archived inputs. The candidate tracked frontend, all four build trees and six fixture files matched across the initial, corrected and resumed snapshots. The archived baseline was verified against all 1,919 tracked frontend blobs. Local synthetic APIs exclude backend latency. The exact existing Telegram SDK URL returned a deterministic no-op to both stages. That exclusion leaves live Telegram startup and handoffs unmeasured.
- The original 42 attempts included 33 valid measurements and nine harness failures. Six Invitation Studio checks used an unsuitable five-second iframe deadline. Three baseline Admin Studio checks targeted the hidden file input. The correction used the same 30-second iframe deadline on both revisions and a visible baseline authoring control. It finished two attempts before the stop. Resumption kept those two and ran the seven missing attempts. All nine original failures are retained in the evidence and excluded from performance statistics. There were 51 attempts across the three runs.
- LCP and CLS refer to the top document. Preview readiness includes the expected renderer within the iframe where applicable. The byte column counts CDP completed loads observed in the collection window. A differing observation cutoff can change completed bytes. Long-task totals cover the observed top document and represent startup work, with separate frame observations recorded where available.

## Median results

Times are milliseconds. Each cell shows baseline → candidate. Ranges, median absolute deviations and paired deltas are available in the JSON.

| Surface | LCP | Route ready | CLS | Top-document long tasks | Observed bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home | 2,756 → 3,020 | 3,507 → 3,760 | .003 → .003 | 801 → 1,085 | 559,933 → 559,973 |
| Owner events | 3,992 → 3,960 | 4,265 → 4,150 | .036 → .036 | 319 → 289 | 530,643 → 530,982 |
| Populated guests | 3,000 → 3,040 | 4,387 → 4,538 | .057 → .057 | 778 → 673 | 559,582 → 559,757 |
| Invitation Studio | 6,856 → 6,916 | 23,779 → 23,145 | .056 → .056 | 1,969 → 2,704 | 4,310,129 → 4,309,472 |
| Public Event Essential | 4,624 → 4,752 | 4,936 → 5,038 | .000 → .000 | 206 → 262 | 690,984 → 690,219 |
| Admin dashboard | 2,152 → 2,048 | 3,205 → 2,718 | .000 → .002 | 220 → 189 | 280,263 → 280,704 |
| Admin Template Studio | 2,768 → 2,620 | 7,670 → 7,589 | .009 → .009 | 350 → 391 | 1,025,915 → 1,026,719 |

Invitation Studio preview still took 22.4–24.2 seconds on the candidate. Its median completed-byte count stayed near 4.31 MB. One initial baseline run ended with 3.90 MB observed, which did not recur in the other two. Top-document long-task median rose by 735 ms, with mixed paired deltas of −115 to +1,584 ms. The absolute load is a meaningful open issue and merits a resource waterfall and lower-power interaction trace. Admin dashboard timing also varied widely on baseline, with a single 8.66-second LCP. Treat changes in either direction as descriptive for this sample.

### Home timing confirmation

The primary sample showed Home LCP 108–324 ms later on all three candidate runs using the same Floral preview image as the largest element. Five additional interleaved pairs ran separately under the same profile and builds. Baseline median LCP was 2,828 ms (range 2,772–2,900 ms), and candidate median was 3,144 ms (2,776–3,404 ms). Four of five pairs were slower, with median paired delta +316 ms and range −124 to +632 ms. Completed bytes differed by 40 and the Home feature source did not change. This is a repeated lab slowdown signal with substantial variability and an unisolated cause. It stays open for startup-task and resource-timing attribution. The supplementary pairs remain separate from the seven-surface table.

## Acceptance limits

This is a throttled desktop loading sample. Interaction latency and field INP, physical-device frame pacing, weak GPU/memory behavior, and loading coverage across the remaining renderers and critical routes remain open. A route-ready assertion establishes the declared fixture state. It carries no performance pass threshold or UX score. The [final acceptance report](UXUI_FINAL_ACCEPTANCE_REPORT.md) and [external register](UXUI_EXTERNAL_CERTIFICATION_REGISTER.md) record the outstanding gates.

The local evidence directory `output/playwright/sss-plus-v2/w11-controlled-performance-20261128` retains the measurement scripts, build/snapshot hashes, screenshots, timings and original failures. From the repository root the continuation ran `node <evidence-dir>/measure-resume.mjs`, `node <evidence-dir>/measure-home-confirmation.mjs --groups=home` and `python <evidence-dir>/reconcile.py`. Fresh comparison requires the archived baseline previews on 4185/4186 and the matching candidate previews on 4173/4174.
