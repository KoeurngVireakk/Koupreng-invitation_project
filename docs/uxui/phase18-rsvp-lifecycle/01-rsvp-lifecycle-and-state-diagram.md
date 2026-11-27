# Phase 18 — RSVP Lifecycle & Interaction State Architecture

**Phase:** 18 — RSVP lifecycle, guest interaction, wishes and privacy  
**Worktree:** `D:\Koupreng-Phase18-worktree` (`feat/phase18-rsvp-lifecycle`)  
**Base Verified SHA:** `84a9fb990ac2e2f3fdcb123286244d645cd50716` (`PR #44`)

## 1. End-to-End RSVP Lifecycle Flow

```mermaid
stateDiagram-v2
    [*] --> InvitationLoaded
    InvitationLoaded --> PersonalTokenVerified: ?token=... resolves publicGuestView()
    InvitationLoaded --> GeneralPublicForm: No inviteToken (open RSVP flow)
    PersonalTokenVerified --> QrPassConfirmed: rsvpStatus != PENDING
    PersonalTokenVerified --> PersonalRsvpForm: rsvpStatus == PENDING
    PersonalRsvpForm --> DeadlineClosed: Date.now() > rsvpDeadline
    GeneralPublicForm --> DeadlineClosed: Date.now() > rsvpDeadline
    PersonalRsvpForm --> ValidatingSubmission: Submit RSVP (no concurrent double-tap)
    GeneralPublicForm --> ValidatingSubmission: Submit RSVP (maxGuests & offline check)
    ValidatingSubmission --> RecoveryError: Offline / 409 / 410 / 429 / 422
    RecoveryError --> ValidatingSubmission: Retry after host/network resolution
    ValidatingSubmission --> QrPassConfirmed: Server 200 (ATTENDING / NOT_ATTENDING / MAYBE)
    QrPassConfirmed --> EditingResponse: Click Edit response
    EditingResponse --> ValidatingSubmission: Submit update
```

## 2. Core Flows Preserved & Enhanced

- **Verified Personalized RSVP (`inviteToken`):** Resolves `invitationService.publicGuestView`, pre-populates guest identity/seats, offers Telegram RSVP reminder handoff (`t.me`), shows immediate QR pass confirmation when already answered, and suppresses misleading `localStorage` fallback authority on token verification failure.
- **General Public RSVP (`!inviteToken`):** Clearly labels open form scope, displays `rsvpDeadline` and `maxGuests` hints when configured, validates count ceilings before network request, sets `attendeeCount: 0` automatically on `NOT_ATTENDING`, and saves server confirmation receipt + QR pass URL.
- **Public Wishes Policy Preserved:** Calls `rsvpService.publicWishes`; renders nothing (`null`) when backend returns `[]` by privacy policy. Zero fabricated or local-only public wishes are generated.
