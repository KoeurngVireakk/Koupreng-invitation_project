# Phase 18 — Negative Scenarios, Edge Cases & Privacy Verification Matrix

| Scenario (Master Prompt 12.4) | System Behavior Verified | Evidence / Test |
|---|---|---|
| RSVP deadline passed | Locks public form with bilingual `role="status"` closed notice while preserving QR viewing for already-responded token holders | `PublicRsvpForm.test.jsx` (`locks new submissions after rsvpDeadline passes`) |
| Guest token invalid / expired (`410` / `404` / lookup failure) | Displays actionable reload/host-contact alert; never falls back to unverified cached `localStorage` | `PublicRsvpForm.jsx` + `PublicRsvpForm.test.jsx` |
| Duplicate submit from double-tap / `409 Conflict` | `if (loading \|\| deadlineClosed) return;` blocks parallel submits; `409` displays conflict reload guidance | `PublicRsvpForm.jsx` + `PublicRsvpForm.test.jsx` |
| Guest count exceeds `maxGuests` | Blocks client submission with inline `role="alert"` bilingual validation before HTTP POST | `PublicRsvpForm.test.jsx` (`enforces maxGuests limit`) |
| Guest declines (`NOT_ATTENDING`) | Disables seat counter input, shows `0 seats reserved`, submits `attendeeCount: 0` | `PublicRsvpForm.test.jsx` |
| Offline submit attempt | Detects `navigator.onLine === false`, surfaces localized reconnect alert without clearing form state | `PublicRsvpForm.jsx` (`formatRsvpSubmitError` + online guard) |
| Wishes returned empty by backend policy | Keeps public wishes hidden; no synthetic wishes injected | `PublicInvitationFeature` + `PublicRsvpForm.jsx` |
| Owner CSV export contains formula injection (`=`, `+`, `-`, `@`) | Neutralizes formulas via `safeCsvCell` + UTF-8 BOM `\uFEFF` inside `exportRsvpsToCsv` | `guestCsvUtils.test.js` (`exports RSVP list with formula neutralization`) |
| Read-only staff (`VIEW_GUESTS`) opens RSVP board / Wishes | `canManage` / `canManageWishes` = `false`, hiding Edit/Delete RSVP & Delete Wish buttons | `rsvp.test.jsx` (`hides edit/delete actions for read-only staff`) |
| Wishes delete failure (`500` timeout) | Keeps confirmation modal open with error alert; wish remains un-deleted in list | `WishesPage.test.jsx` |
| Khmer WCAG 2.5.3 `Label in Name` & Counter Contrast | Fixed visible button label match (`លុបពាក្យជូនពរ`) & darkened `#6e4f1d` badge ink | `after/06-wishes-page-mobile-km-390.png` (`axe` verified) |
