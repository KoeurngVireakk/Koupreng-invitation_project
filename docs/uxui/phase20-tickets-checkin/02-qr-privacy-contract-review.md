# Phase 20 — QR & Privacy Contract Review

**Reviewed Modules:** [`ticketApi.js`](file:///D:/Koupreng-Phase20-worktree/apps/frontend-user/src/features/tickets/ticketApi.js), [`ticketRenderer.js`](file:///D:/Koupreng-Phase20-worktree/apps/frontend-user/src/features/tickets/ticketRenderer.js), [`TicketActions.jsx`](file:///D:/Koupreng-Phase20-worktree/apps/frontend-user/src/features/tickets/TicketActions.jsx), [`PublicTicketAccess.jsx`](file:///D:/Koupreng-Phase20-worktree/apps/frontend-user/src/features/tickets/PublicTicketAccess.jsx), [`qrApi.js`](file:///D:/Koupreng-Phase20-worktree/apps/frontend-user/src/features/qr/api/qrApi.js), [`useQrCode.js`](file:///D:/Koupreng-Phase20-worktree/apps/frontend-user/src/features/qr/hooks/useQrCode.js), [`GuestQrModal.jsx`](file:///D:/Koupreng-Phase20-worktree/apps/frontend-user/src/features/guests/components/GuestQrModal.jsx)

| Control | Verified Behavior | Source Evidence |
|---|---|---|
| Opaque server QR token | QR image data URI and destination URL originate exclusively from backend APIs; UI edits never construct check-in tokens | `ticketApi.js`, `qrApi.js` |
| No raw guest PII in QR payload | QR encodes invitation link / opaque token; private host notes are never drawn into ticket canvas or QR matrix | `ticketRenderer.js`, `qr.test.jsx` |
| Purpose & credential boundary checks | `useQrCode` rejects guest bearer responses (`tokenType === 'GUEST'`) on general QR fetch and validates QR payload destination match | `useQrCode.js`, `qr.test.jsx` |
| Safe PNG download validation | `downloadPngDataUri` verifies strict `data:image/png;base64,...` header AND decoded `\x89PNG\r\n\x1a\n` magic bytes | `qrApi.js`, `qrContract.test.jsx` |
| Personal ticket share restriction | Public one-click Telegram share link is hidden (`ticket.kind !== "GUEST"`) so personal token URLs are not blasted publicly | `TicketActions.jsx`, `TicketActions.test.jsx` |
| Limited check-in roster privacy | Non-owner check-in staff (`MANAGE_CHECKIN` without `MANAGE_GUESTS`) query paginated limited roster (`/check-in/roster`), hiding phones/emails, walk-in creation, and gift amounts | `useCheckInDesk.js`, `InvitationCheckInPage.jsx`, `checkIn.persistence.test.jsx` |
| Public ticket referrer/indexing hygiene | `PublicTicketAccess` sets `<meta name="referrer" content="no-referrer" />` and `<meta name="robots" content="noindex,nofollow" />` | `PublicTicketAccess.jsx` |
