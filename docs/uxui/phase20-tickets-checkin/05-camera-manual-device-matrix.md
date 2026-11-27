# Phase 20 — Camera & Manual Lookup Compatibility Matrix

| Environment / Constraint | Detection Path | Observed UX Behavior (Verified in Code / Tests) | Hardware Certification |
|---|---|---|---|
| Desktop Chrome / Edge (HTTPS / localhost) | `BarcodeDetector` (with `jsQR` fallback) | Starts stream, 120ms throttled scan + 2.5s same-token dedup, awaits server response | Emulated (`playwright-chromium`) |
| Firefox / WebKit / Safari desktop | `jsQR` canvas fallback (`maxDim: 380px`) | Transparent fallback when `BarcodeDetector` unavailable | Playwright v2 cross-browser (`27/27` active tests); physical hardware `DEFERRED_P26` (`P16-G12`) |
| Non-HTTPS LAN HTTP context | `!window.isSecureContext` (excluding `localhost`/`127.0.0.1`) | Clear bilingual alert directing door staff to manual token / guest roster search | Unit/code verified |
| Permission denied (`NotAllowedError`) | `catch (err)` in `startCamera` | Clear bilingual prompt + manual token fallback remains enabled | Unit/code verified |
| Telegram / Messenger / Line WebView | `isInAppBrowser()` | Proactive camera-restriction advisory banner + manual lookup + in-app image long-press save on ticket download | Unit test (`TicketActions.test.jsx`); physical WebView `DEFERRED_P26` (`P16-G13`) |
| USB / Bluetooth HID QR gun scanner | Keyboard wedge into `#token` `<textarea>` | Instant submit via manual token form, clear button, optional gift & note capture | Unit/component tested (`checkIn.test.jsx`, `checkIn.persistence.test.jsx`) |
| Low-privilege Check-in Staff (`MANAGE_CHECKIN`) | `EventContext.can('MANAGE_GUESTS') === false` | Paginated server search (`checkInRoster` debounced 250ms), manual desk check-in active, PII/gifts/walk-in hidden | Unit tested (`checkIn.persistence.test.jsx`) |
