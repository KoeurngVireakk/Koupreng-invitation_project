# Phase 21 — Payment Trust & Privacy Threat Review

**Aligned Skill Rules:** [`koupreng-payment-security`](file:///D:/Koupreng-Phase21-worktree/.agents/skills/koupreng-payment-security/SKILL.md)

| Threat / Negative Scenario | Mitigation Verified in Frontend User Source | Verification Evidence |
|---|---|---|
| Browser-only paid state or premature unlock on PayWay return | `PaymentSuccessPage` keeps `PENDING`, `QR_CREATED`, `PAID_PENDING_REVIEW`, and `CONFIRMED` in non-unlocked verification messaging; `Go to paid templates` only appears at `status === "PAID"` | `PaymentSuccessPage.jsx`, `PaymentSuccessPage.test.jsx` |
| Tampered template ID / price constant / forged order response | `checkoutOffer` rejects unapproved catalog offers; `TemplateCheckoutPage` validates confirmed `orderCode` & `templateId`; `PaymentStatusPage` rejects `null`/`[]`/mismatched `orderCode` | `TemplateCheckoutPage.test.jsx`, `PaymentStatusPage.test.jsx` |
| Unauthorized or unverified receipt spoofing | `PaymentReceiptPage` throws on missing/mismatched `orderCode` or non-`PAID` status (`status !== "PAID"`) and displays server `paidAmount` (`$0.00` preserved accurately) | `PaymentReceiptPage.test.jsx` |
| Client screenshot / claim misconstrued as payment confirmation | UI & copy explicitly state: requesting review / submitting ABA name + last 3 digits (`^\d{3}$`) only logs claim evidence; settlement requires Telegram merchant alert / admin verification | `PaymentQrCard.jsx`, `SubscriptionPackagesPage.jsx` |
| Accidental USD/KHR currency mixing | `GiftStatsCards` aggregates per currency via `budgetMoney(value, currency)` separated by `" · "`; `PaymentHistoryPage` & Checkout preserve exact server order currency (`USD` vs `KHR`) | `GiftStatsCards.jsx`, `gifts.test.jsx`, `PaymentHistoryPage.jsx` |
| Guest-facing gift PII leak | `TemplateGift.jsx` renders sanitized owner gift display cards only (`account`, masked/configured display number); private donor ledger remains restricted behind authenticated host routes | `TemplateGift.jsx`, `useGifts.js` |
| Live settlement gateway (`C08-013`) | Remains **explicitly `BLOCKED_EXTERNAL`** (`DEFERRED_P26`) — no live ABA transactions or fake paid mocks run in production | `phase21-acceptance-ledger.json` |
