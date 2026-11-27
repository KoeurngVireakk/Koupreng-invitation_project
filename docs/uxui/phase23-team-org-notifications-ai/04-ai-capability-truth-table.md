# Phase 23 — AI Capability Truth Table & Fallback Policy

- **Route Audited:** `/app/events/:eventId/assistant`
- **Decision Outcome:** Keep **Invitation Writing Helper** as an assistive draft helper with upfront local-template mode transparency, guest-PII warnings, and strict authorization fail-closed behavior. Do not introduce fabricated provider claims, recurring AI billing, or autonomous mutation actions.

## 1. Truth Table

| Scenario | Backend / Auth State | Frontend Behavior (`useAiAssistant.js` & UI) | User Copy / Disclosure |
| --- | --- | --- | --- |
| **Pre-Submit Composer** | Any authorized workspace session | Renders task selector (`copy`, `story`, `formalText`, `translate`, `timeline`), all 6 event types (`WEDDING`, `ENGAGEMENT`, `BIRTHDAY`, `ANNIVERSARY`, `CORPORATE`, `OTHER`), language & tone controls, plus `role="note"` privacy disclosure | *"Do not enter private guest phone numbers, addresses, or confidential notes. If no AI provider is connected, Koupreng creates an editable draft from a local template with no extra charge."* |
| **Verified Provider Response** | `200 OK` with verified `generatedText` and `provider !== "local-template"` | Displays **AI-generated result** (`លទ្ធផលអត្ថបទ AI`), copy button, editable review textarea, optional suggestions, and explicit **Apply to invitation** confirmation step | Never auto-overwrites invitation story without user click |
| **Unconfigured / Unavailable Provider** | `503` / network failure / `provider: "local-template"` | Falls back cleanly to deterministic contextual `buildLocalTemplateText(...)`, marks `source: "LOCAL_TEMPLATE"`, displays explicit non-AI notice banner & service warning list | *"This draft was created from Koupreng's built-in template. No external AI provider was used."* |
| **Unauthorized / Forbidden (`401`/`403`)** | Missing session or lacks `MANAGE_INVITATION` | **Fails closed:** `setResponse(null)`, clears draft output, calls `feedback.explain(err, { event, feature: 'AI_ASSISTANT', permission: 'MANAGE_INVITATION' })`, shows permission alert | Permission / plan restriction surfaced clearly; no draft fallback generated |
| **Canonical Route Navigation** | Apply to invitation or Back link | Navigates cleanly to `/app/events/:eventId/invitation` (`/app/events` fallback) instead of legacy `/dashboard/invitations/.../edit` paths | Preserves host workspace context |
