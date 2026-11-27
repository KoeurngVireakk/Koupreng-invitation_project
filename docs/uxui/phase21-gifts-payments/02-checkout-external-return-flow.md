# Phase 21 — Checkout & External-App Return Flow

**Modules:** [`TemplateCheckoutPage.jsx`](file:///D:/Koupreng-Phase21-worktree/apps/frontend-user/src/features/payments/TemplateCheckoutPage.jsx), [`PaymentStatusPage.jsx`](file:///D:/Koupreng-Phase21-worktree/apps/frontend-user/src/features/payments/PaymentStatusPage.jsx), [`PaymentQrCard.jsx`](file:///D:/Koupreng-Phase21-worktree/apps/frontend-user/src/features/payments/PaymentQrCard.jsx), [`PaymentSuccessPage.jsx`](file:///D:/Koupreng-Phase21-worktree/apps/frontend-user/src/features/payments/PaymentSuccessPage.jsx), [`PaymentCancelPage.jsx`](file:///D:/Koupreng-Phase21-worktree/apps/frontend-user/src/features/payments/PaymentCancelPage.jsx), [`SubscriptionPackagesPage.jsx`](file:///D:/Koupreng-Phase21-worktree/apps/frontend-user/src/features/subscriptions/SubscriptionPackagesPage.jsx)

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend Checkout / QR Card
    participant API as Spring Boot Backend
    participant ABA as ABA PayWay / Mobile App

    User->>UI: Review server catalog price & currency (Template or Plan)
    UI->>API: POST create static order / subscription purchase
    API-->>UI: { orderCode, amount, currency, paymentLink, status: QR_CREATED }
    Note over UI: Save/Copy orderCode before app switch; pending stays pending
    User->>ABA: Open PayWay link / scan static QR in ABA Mobile
    ABA-->>User: External transfer or cancel -> return to /payments/return?orderCode=...
    User->>UI: Land on PaymentSuccessPage or refresh PaymentStatusPage
    UI->>API: Poll GET /template-payments/:orderCode (every 4s-5s until terminal)
    alt Backend confirms PAID
        API-->>UI: { status: PAID }
        UI-->>User: Unlock template / receipt (/app/payments/:orderCode)
    else Provider CONFIRMED / PAID_PENDING_REVIEW / PENDING
        API-->>UI: { status: CONFIRMED / PENDING }
        UI-->>User: Show "Verifying access..." + Copy reference + History link (NO premature unlock)
    else CANCELLED / EXPIRED / FAILED
        API-->>UI: Terminal unpaid state
        UI-->>User: Prompt safe recovery or Create new order
    end
```
