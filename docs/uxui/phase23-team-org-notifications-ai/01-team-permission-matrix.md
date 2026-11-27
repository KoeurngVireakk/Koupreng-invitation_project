# Phase 23 — Team Collaboration & Permission Matrix

- **Phase:** 23 — Team, Organization, Notifications, Preferences, Support & AI Decision
- **Scope Boundary:** `apps/frontend-user` ONLY (RBAC enforcement remains server-owned in `apps/backend`)
- **Routes Audited:**
  - `/app/organizations` (`/dashboard/organizations`)
  - `/app/organizations/:organizationId` (`/dashboard/organizations/:organizationId`)
  - `/app/events/:eventId/team`

## 1. Roles & Permission Boundaries

| Role | Scope & Permitted Actions | Restricted / Owner-Only Boundaries | UI Safeguards |
| --- | --- | --- | --- |
| **Owner (`OWNER`)** | Full workspace ownership: create team, invite members, change roles, remove members, link/unlink team on owned events, publish/unpublish invitations, manage finances/payments | Protected from removal or self-demotion in member table (`Owner protected` badge) | `canManageOrganization` fail-closed on missing IDs; confirmation dialog on remove & event-team unlink |
| **Manager (`MANAGER`)** | Access linked events: invitation builder, guests, RSVP, seating, and check-in | Cannot publish/unpublish, edit finances/payments, invite/remove team members, or switch event team | `EventTeamPanel` renders owner-only restriction banner; RBAC role boundaries shown on `OrganizationDetailPage` |
| **Designer (`DESIGNER`)** | Access invitation template and design studio on linked events | Cannot manage guests/budget/check-in, team settings, or billing | Backend `403` surfaced cleanly via `feedback.explain(...)` without silent data leakage |
| **Check-in Staff (`CHECK_IN_STAFF`)** | Access guest check-in & QR scanner workflows | Cannot modify invitation copy, pricing, team roster, or finances | Role badge (`CHECK IN STAFF`) + boundary description visible on team detail |
| **Viewer / Member (`VIEWER`, `MEMBER`)** | Read-only event viewing on linked events | No write mutations, no finance visibility, no team mutations | Read-only posture; invite actions hidden when `!isOwner` |

## 2. Invitation Token & Multi-Org Safety

1. **Private One-Time Invitation Codes (`InviteMemberModal`, `AcceptTeamInvitation`):**
   - Creating an invitation renders the 64-hex token strictly once for private sharing and explicitly notes no automatic email was sent.
   - Accepting requires matching the invited email account, validates 64-hex syntax, handles expired/revoked/duplicate acceptance errors visibly via `role="alert"`, and clears the input on confirmation.
   - `MemberTable` explicitly explains `INVITED` (pending acceptance), expired `INVITED` (derived from `inviteExpiresAt`), `REVOKED`, and legacy pre-V48 `ACTIVE` rows missing `inviteAcceptedAt` (even when `joinedAt` is populated).
2. **Multi-Event Team Selection (`EventTeamPanel`):**
   - `selection` resyncs deterministically whenever `eventId` or `event.organizationId` changes.
   - Displays current event title + owner-only team filter (`teams.filter(team => team.ownerUserId === event.userId)`), plus a confirmation modal summarizing access grant or revocation before calling `linkTeam`.
