# Phase 18 — Localized Bilingual Field, Recovery & Moderation Copy Inventory

**Modules:** `PublicRsvpForm.jsx`, `RsvpDashboardPage.jsx`, `WishesPage.jsx`, `WishCard.jsx`, `OPERATIONS_MESSAGES.rsvp`

| Surface / Condition | English Copy (`EN`) | Khmer Copy (`KM`) | Contrast / A11y Verification |
|---|---|---|---|
| Verified invitation scope | `Verified personal invitation` | `ការអញ្ជើញផ្ទាល់ខ្លួនដែលបានផ្ទៀងផ្ទាត់` | `#57534e` on warm card (`>= 7.1:1`) |
| General invitation scope | `Guest RSVP form` | `ទម្រង់ឆ្លើយតប RSVP សម្រាប់ភ្ញៀវ` | High-contrast context caption |
| Deadline closed state | `RSVP deadline has passed` | `ការទទួល RSVP ត្រូវបានបិទ` | `role="status"` live announcement |
| Max guests violation | `Please enter at most {max} guests per invitation.` | `សូមបញ្ចូលចំនួនភ្ញៀវមិនឱ្យលើសពី {max} នាក់។` | `role="alert" aria-live="assertive"` |
| Declining seat helper | `0 seats reserved when unable to attend.` | `រក្សាកៅអី 0 នៅពេលមិនអាចចូលរួម។` | Attendee input disabled & set to `0` |
| `409 Conflict` recovery | `This RSVP already has a conflicting update. Reload the page to inspect your current confirmation.` | `ការឆ្លើយតប RSVP នេះមានរួចហើយ ឬមានការកែប្រែព្រមគ្នា។ សូមផ្ទុកទំព័រឡើងវិញដើម្បីពិនិត្យប័ណ្ណ QR។` | Preserves user inputs on failure |
| `403/404/410` expired/revoked | `This invitation link is invalid, expired, or closed. Please ask the host for an updated link.` | `តំណអញ្ជើញនេះមិនត្រឹមត្រូវ ឬផុតកំណត់ហើយ។ សូមស្នើសុំតំណថ្មីពីម្ចាស់កម្មវិធី។` | No silent failure |
| Wishes count pill & delete action | `Delete wish` button, `#6e4f1d` badge ink | `លុបពាក្យជូនពរ` button (visible === accessible name) | Eliminated `color-contrast` & `label-content-name-mismatch` |
| Wishes privacy notice | `Private to event organizers by default; deleted wishes cannot be recovered.` | `សារទាំងនេះត្រូវបានរក្សាជាឯកជនសម្រាប់អ្នករៀបចំកម្មវិធី ហើយសារដែលបានលុបមិនអាចយកមកវិញបានទេ។` | Paired with `<Lock />` icon |
