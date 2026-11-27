# Phase 18 — Public RSVP & Owner Dashboard Permission Matrix

## 1. Guest & Team RBAC Matrix

| Actor / Scope | View Public Form & QR Pass | Submit / Edit Own RSVP | View Owner RSVP Board & KPIs | Export RSVP CSV | Edit / Delete Any RSVP (`RsvpOwnerActions`) | Moderate / Delete Wishes (`WishesPage`) |
|---|---|---|---|---|---|---|
| Anonymous Public Guest (Open link) | General form + deadline/cap notice | Yes (before deadline; subject to backend rate limits & password gate) | No (`401`/`403`) | No | No | No |
| Invited Guest (`?token=...`) | Personalized guest view + QR Pass (even post-deadline if already confirmed) | Yes (while open; preserves token identity) | No (`401`/`403`) | No | No | No |
| Read-Only Event Staff (`VIEW_GUESTS`) | Owner workspace preview | Read-only in dashboard | Yes (server-authoritative counts) | Yes (`exportRsvpsToCsv`) | **Hidden & blocked in UI** (`canManage = false`) | **Delete hidden** (`canManageWishes = false`) |
| Event Staff (`MANAGE_GUESTS`) / Owner | Full event access | Can edit/remove via modal | Full board + Wishes Wall | Yes (`exportRsvpsToCsv`) | Yes (`PATCH` / `DELETE` modal with retry recovery) | Yes (confirmation modal + server delete) |

## 2. Public PII Protection Rules

- `PublicRsvpForm` never fetches or caches the host guest directory (`/guests`), never infers a guest identity from freeform text or pathname, and clears/isolates stale cached keys across differing slugs/tokens (`key={JSON.stringify([slug, inviteToken, accessToken])}`).
- `WishesPage` displays explicit owner-only moderation notice (`Lock` indicator) and requires explicit modal confirmation before removing a wish (`wishesApi.deleteWish`).
