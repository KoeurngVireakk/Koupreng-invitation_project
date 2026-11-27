# Phase 21 — Financial UX State Glossary

| State Token / Context | Surface Scope | Authoritative Owner | User-Visible Meaning & Actionability |
|---|---|---|---|
| `CREATED` / `PENDING` | Template / Subscription Order | Backend DB | Order created with server-catalog price/currency (`USD`/`KHR`); no entitlement unlocked |
| `QR_CREATED` / `CHECKOUT_CREATED` | Template Payment QR Card | Backend + ABA PayWay Link | Static PayWay link/QR issued; awaiting ABA transfer & server verification |
| `PAID_PENDING_REVIEW` / `PENDING_REVIEW` | Order Status / History | Backend Reconciliation / Admin | Payment claim or partial match recorded; awaits admin or Telegram merchant bot verification |
| `CONFIRMED` | Payment Return (`PaymentSuccessPage`) | Provider webhook | Provider signal received; **final server entitlement verification still in progress** (NOT unlocked) |
| `PAID` / `ACTIVE` | Receipts (`PaymentReceiptPage`), Paid Templates | Backend Verified Settlement | Server-verified settlement + active entitlement/receipt unlocked |
| `FAILED` / `CANCELLED` / `REJECTED` | Order Status / History / Cancel | Backend | Terminal unpaid closure; no access unlocked; offer safe creation of a fresh order |
| `EXPIRED` | Order Status / Subscription Checkout | Backend Expiry Deadline | Session timer elapsed; blurred QR with explicit "Contact support for late transfers / Create new order" |
| `DEMO_ADMIN_GRANT` (`NOT_REQUIRED`) | Subscription History / Current Plan | Admin Grant | Explicit non-revenue demonstration access badge; never impersonates a paid receipt |
| `Owner-Recorded Gift` | Event Gifts (`GiftsFeature`) | Host / Check-In Desk | Private event contribution ledger (`USD` & `KHR` summed separately); strictly distinct from PayWay orders |
