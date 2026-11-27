# Koupreng Frontend User Accessibility Report (WCAG 2.2 AA)

**Target Scope:** `apps/frontend-user`  
**Verification Standard:** WCAG 2.0/2.1/2.2 Levels A & AA (`@axe-core/playwright` tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, without filtering out header controls).

---

## 1. Remediation History Across Phases 16–26

1. **Public Renderers (Phases 16, 18, 26):** Fixed `TemplateDressCode.jsx` `aria-prohibited-attr` (`role="list"`/`"listitem"`), hard-coded contrast on RSVP & wish empty states (`PublicRsvpForm.jsx`), and `.kc-hero__scroll` WCAG 2.5.3 `label-content-name-mismatch` in `KhmerCelestialLayout.jsx`.
2. **Host Workspace Dark & Light Parity (Phases 17–23, 26):**
   - Resolved all Obsidian Dark Mode contrast deficits across Guests CRM, Seating Floor Plan (`#4b3516`/`#fef3c7` walkways, `7 -> 0`), Check-In Celebration Modal (`6 -> 0`), Gifts/Checkout/Payments/Subscription tables (`27 -> 0`), Budget Progress (`role="progressbar"`), Attendance Analytics (`noValidate` + `role="alert"`), Financial Reports (`ReportsPage.css:not(.is-print-preview)` isolating dark overrides from A4 print preview), Organizations, Notifications, AI Helper (`17 -> 0`), and Landing/Catalog cards (`PublicTemplateCard.jsx` `.kp-design-media-wrap` + `HostNav.jsx` decorative `data-initial` + visible mobile drawer name at `359px`, `10` baseline + `1` post-open `label-content-name-mismatch` violations -> **`0`**).
3. **Keyboard Navigation, Focus & Reflow:**
   - Focus trapping and Escape focus restoration verified across mobile nav drawers (`HostNav`, `EventWorkspace`), invitation preview dialogs, publish review modals, and seating/check-in dialogs (`phase7-keyboard-reflow.spec.js`, `phase26-cross-cutting-validation.spec.js`).
   - `96 / 96` responsive checks (`320, 360, 375, 390, 414, 430, 600, 768, 820, 1024, 1280, 1440px`) + `844x390` short landscape + genuine 200% computed font scaling (`h1` & `main p >= 1.99x` baseline across `EventsFeature.css`) pass with **`0px` horizontal overflow**.

---

## 2. Final Automated Verification Scope & Limitations

- `capture-phase26-validation.mjs --stage=after`: **`13 / 13`** states (`/` Light EN, `/` Dark KM, `/templates` Dark EN, `/login` Light KM, `/app/events` Dark KM, `/app/events/101/guests` populated Dark EN, `/app/events/101/budget` populated USD/KHR Light KM, `/app/events/101/reports` Dark EN, `/app/packages` Dark EN, `/app/notifications` Dark KM, `/i/audit-event` opening closed, `/i/audit-event` opened post-envelope, `/app/events` `359px` opened mobile drawer) report **`0` Axe violations** and **`0px` overflow**.
- **Explicit Limitation (`BLOCKED_EXTERNAL`):** Automated Axe & Chromium/Firefox/WebKit emulation (`PASS_LOCAL`) does not replace manual VoiceOver (iOS), TalkBack (Android), or physical device screen-reader testing, which remain pending external hardware certification.
