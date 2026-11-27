# Phase 20 — Ticket Design Specification

**Route:** `/app/events/:eventId/tickets/design`  
**Core Components:** [`TicketDesigner.jsx`](file:///D:/Koupreng-Phase20-worktree/apps/frontend-user/src/features/tickets/TicketDesigner.jsx), [`TicketPreview.jsx`](file:///D:/Koupreng-Phase20-worktree/apps/frontend-user/src/features/tickets/TicketPreview.jsx), [`TicketActions.jsx`](file:///D:/Koupreng-Phase20-worktree/apps/frontend-user/src/features/tickets/TicketActions.jsx), [`TicketModal.jsx`](file:///D:/Koupreng-Phase20-worktree/apps/frontend-user/src/features/tickets/TicketModal.jsx), [`ticketRenderer.js`](file:///D:/Koupreng-Phase20-worktree/apps/frontend-user/src/features/tickets/ticketRenderer.js), [`tickets.css`](file:///D:/Koupreng-Phase20-worktree/apps/frontend-user/src/features/tickets/tickets.css)

## 1. Separation of Visual Design & Identity Authority
- Visual appearance (`layout`, `accent`, `frame`, `font`, `header`, `footer`, `coverMediaId`, `backgroundMediaId`, `coverFit`, `coverFocusX/Y`, `backgroundOpacity`, `showTable`, `showSeatCount`, `showGroup`) is persisted via `PUT /v1/invitations/:id/ticket-design`.
- Server-issued ticket identity (`qrCodeDataUri`, `invitationUrl`, `kind`, `guestName`, `tableName`, `seatNumber`, `seatCount`) is read from `GET /v1/invitations/:id/ticket` or `GET /v1/invitations/:id/guests/:guestId/ticket`. Visual edits never alter QR payloads or tokens.

## 2. Layout, Typography & Theme Controls
- **Layouts:** `GOLD` (Royal Gold), `MINIMAL` (Modern Minimal), `FLORAL` (Botanical Floral), `IVORY` (Ivory Seal).
- **Frames:** `DOUBLE`, `SINGLE`, `NONE`.
- **Fonts:** `MOUL` (`Moul`), `KANTUMRUY` (`Kantumruy Pro`), `CORMORANT` (`Cormorant Garamond`) loaded explicitly via `FontFace` prior to canvas draw (`15s` timeout + error recovery).
- **Khmer Grapheme Wrapping:** `wrapTicketText` segments text using `new Intl.Segmenter("km", { granularity: "grapheme" })` so Khmer clusters never clip mid-glyph or wrap awkwardly.
- **Responsive Studio & Dark Mode:** Two-column sticky preview on desktop (`>=900px`), compact segmented tab switch (`Edit` / `Preview & export`) on mobile (`390px`), full Obsidian Black (`#090909`) × Champagne Gold (`#D6B26E`) token parity, and `prefers-reduced-motion: reduce`.

## 3. Print, Export & Unsaved Guard Contract
- **Canvas Dimensions:** Fixed base `600×900` logical coordinate space exported at **`2×` (`1200×1800px`)** and **`3×` (`1800×2700px`)** PNG, plus direct **`Print / PDF`** (`window.print()`) with dedicated `@media print` rules isolating `.ticket-preview` without application chrome.
- **QR Quiet Zone:** Canvas draws a solid `#ffffff` backing square (`204×204`) around the crisp (`imageSmoothingEnabled = false`) `180×180` QR matrix regardless of background artwork or accent color.
- **In-App WebView Fallback:** `isInAppBrowser()` keeps downloaded PNG object URLs available inline for long-press save when native downloads are intercepted.
- **Unsaved Guards:** `dirty` state blocks download/share until saved (`Save design`) and prompts via `beforeunload` / router history guard on leave and `feedback.confirm(...)` on Reset.
