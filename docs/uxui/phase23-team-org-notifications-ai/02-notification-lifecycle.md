# Phase 23 — Notification Lifecycle & Delivery Semantics

- **Routes Audited:** `/app/notifications` (`/dashboard/notifications`)
- **Primary Components:** `NotificationsPage.jsx`, `useNotifications.js`, `NotificationList.jsx`, `NotificationItem.jsx`, `NotificationStatsGrid.jsx`, `TelegramNotificationSettings.jsx`

## 1. Notification State & Channel Matrix

| Status / Channel | Meaning | Khmer Label | Visual Token & Contrast Treatment |
| --- | --- | --- | --- |
| `PENDING` | Queued for delivery | រង់ចាំ | `--ui-theme-gold-soft` + `--ui-theme-link` |
| `SENT` | Dispatched by delivery provider | បានផ្ញើ | `--ui-theme-success-soft` + `--ui-theme-success` |
| `DELIVERED` | Confirmed received on channel | បានបញ្ជូនដល់ | `--ui-theme-success-soft` + `--ui-theme-success` |
| `FAILED` | Delivery attempt rejected (`errorMessage` shown) | បរាជ័យ | `--ui-theme-danger-soft` + `--ui-theme-danger` |
| `READ` | User acknowledged notification | បានអាន | `--ui-theme-subtle` + `--ui-theme-muted` |
| `CANCELLED` | Superseded or cancelled before dispatch | បានបោះបង់ | `--ui-theme-subtle` + `--ui-theme-muted` |

## 2. Lifecycle Hardening

1. **Non-Destructive Error Isolation (`useNotifications.js`):**
   - Initial load failures populate `error` and render `<ErrorState onRetry={loadData} />`.
   - Mutation failures (`markRead`, `markAllRead`) populate `actionError` with an inline `role="alert"` banner so already loaded notifications remain visible and interactive.
2. **Delivery Filtering & Refresh:**
   - Added bilingual filter controls (`All notifications` / `Unread only` / `Failed delivery`) with `aria-pressed` state and a manual `Refresh` action (`min-height: 44px`).
3. **Safe Internal Deep Linking & Deleted Target Handling (`NotificationItem.jsx`):**
   - Validates `actionUrl`/`targetUrl` strictly against safe internal prefixes (`/app/`, `/templates/`, `/contact`) — external or javascript URLs are ignored.
   - When `targetDeleted` or `targetExpired` is flagged, displays a calm localized unavailability note instead of a broken link.
4. **Telegram Disconnection Safety (`TelegramNotificationSettings.jsx`):**
   - Disconnecting Telegram alerts requires explicit user confirmation via `ConfirmDialog` (`Keep connected` / `Disconnect Telegram`) instead of executing `DELETE /v1/telegram/user/link` on single click.
5. **Contrast & Touch Targets (`NotificationPages.css`):**
   - Replaced raw `#887762`, `#7d6d58`, `#fff`, and `#b42318` values that failed Axe `color-contrast` in Light and Obsidian Dark modes with semantic `--ui-theme-*` tokens and `44px` minimum action heights.
