# External certification register

Reviewed 28 November 2026. These release gates are separate from the remaining internal software/design acceptance work in the [final acceptance report](UXUI_FINAL_ACCEPTANCE_REPORT.md). Browser viewport or user-agent emulation does not close them.

| ID | Gate | Status | Required evidence and owner |
| --- | --- | --- | --- |
| EXT-01 | Physical iPhone and Android | BLOCKED_EXTERNAL | Device QA: Safari/Chrome, safe areas, orientation, native keyboard/IME, zoom, opening interruption, media and camera permissions |
| EXT-02 | Telegram, Facebook, Messenger and WhatsApp WebViews | BLOCKED_EXTERNAL | Device QA: real app versions, authentication return, invitation opening, external navigation and provider handoffs |
| EXT-03 | Persistent staging | BLOCKED_EXTERNAL | Environment owner: approved Spring Boot/MySQL/Cloudflare fixtures; accounts for roles/entitlements, writes, conflict/recovery and revoked access; TLS/origin behavior. Local synthetic responses and H2 tests do not establish this |
| EXT-04 | ABA PayWay / Telegram settlement, C08-013 | BLOCKED_EXTERNAL | Payment owner: approved provider/reconciliation evidence. No real payment, merchant change or live dispatch was authorized or performed in this audit |
| EXT-05 | Native Khmer language and assistive technology | BLOCKED_EXTERNAL | Qualified Khmer reviewer and accessibility tester: copy, glyphs, native IME, VoiceOver/TalkBack and desktop screen readers. Automated labels/Axe and evaluator review are supporting evidence only |
| EXT-06 | Field Core Web Vitals | NOT_VERIFIED | Operations owner after separately approved release: representative field LCP/INP/CLS. Local RAF, single route samples and build sizes are laboratory evidence |
| EXT-07 | Final merge authorization | AWAITING_OWNER_APPROVAL | Explicit owner approval of the exact reviewed PR head after assessing internal and external gaps. This audit branch cannot merge or deploy itself |

No external gate is marked passed by this report. Historical AUTH/C08/C09/C10 and phase acceptance ledgers remain independent records; this register neither renumbers nor closes them. In particular C10-001 guest privacy and C08-013 settlement retain their source-ledger meanings.
