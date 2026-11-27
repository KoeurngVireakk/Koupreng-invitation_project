# Phase 23 — Account, Preferences, Navigation & Support IA

- **Routes Audited:** `/app/profile`, `/app/notifications`, `/app/organizations`, `/contact`, `/app/packages`
- **Primary Components:** `ProfileFeature.jsx`, `ChangePasswordFeature.jsx`, `HostNav.jsx`, `DisplayPreferences.jsx`, `ContactFeature.jsx`

## 1. Account & Preference Boundary Architecture

1. **Workspace Preferences vs. Guest Art Direction (`ProfileFeature.jsx`):**
   - Added a dedicated **Language & display preferences** (`ចំណូលចិត្តភាសា និងផ្ទាំងបង្ហាញ`) section inside `/app/profile` hosting `DisplayPreferences` (`ខ្មែរ` / `EN` language switch and Light / Obsidian Dark toggle).
   - Included plain-language disclosure explaining that display settings affect the host management workspace only while guest wedding invitation templates retain their independent art direction.
   - Switching interface language updates chrome labels immediately without resetting or clobbering edited profile inputs (`fullName`, `phone`).
2. **Password & Linked Identity Controls:**
   - Inline password policy hints (`AccountPasswordGuidance`), accessible show/hide password toggles (`44x44px` hit target), validation feedback via `role="alert"`, and social/Telegram account link controls remain isolated in clean sections.
3. **Discoverable Navigation (`HostNav.jsx`):**
   - Exposed `/app/organizations` (**Teams & Workspaces** / **ក្រុមការងារ**), `/app/notifications` (**Notifications** / **ការជូនដំណឹង**), and `/contact` (**Help & Support** / **ជំនួយ និងការគាំទ្រ**) inside both the desktop profile dropdown menu (`role="menuitem"`) and mobile drawer navigation while keeping top-level primary navigation uncluttered (`My Events`, `Create Event`, `Packages`, `Browse Templates`).
4. **Support Intake (`ContactFeature.jsx`):**
   - Preserves draft inputs across locale changes via `useContactDraft`, validates form inputs clearly, and routes users to support channels without exposing private operational internals.
