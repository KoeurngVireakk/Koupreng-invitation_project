import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const TOKEN = ["eyJhbGciOiJub25lIn0", "eyJleHAiOjQxMDIyNjg4MDB9", ""].join("."); // gitleaks:allow

async function installPhase26Fixtures(page, { authenticated = true, lang = "en", theme = "light", xssInject = false } = {}) {
  await page.addInitScript(({ token, authEnabled, langVal, themeVal }) => {
    window.localStorage.setItem("koupreng.lang", langVal);
    window.localStorage.setItem("koupreng.colorMode", themeVal);
    window.localStorage.setItem("theme", themeVal);
    if (authEnabled) {
      const auth = JSON.stringify({
        accessToken: token,
        tokenType: "Bearer",
        expiresAt: "2100-01-01T00:00:00Z",
        user: { id: 7, fullName: "Sokha Meas", email: "sokha@example.test", role: "USER" },
      });
      window.sessionStorage.setItem("koupreng.auth", auth);
      window.localStorage.setItem("koupreng.auth", auth);
    } else {
      window.sessionStorage.removeItem("koupreng.auth");
      window.localStorage.removeItem("koupreng.auth");
    }
  }, { token: TOKEN, authEnabled: authenticated, langVal: lang, themeVal: theme });

  await page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (data, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ data }) });

    if (p.endsWith("/i18n/messages")) return json({ messages: {} });
    if (p.endsWith("/users/me")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 7, fullName: "Sokha Meas", email: "sokha@example.test", role: "USER", preferredLanguage: lang, colorMode: theme }),
      });
    }
    if (p.endsWith("/auth/me")) return json({ id: 7, fullName: "Sokha Meas", email: "sokha@example.test", role: "USER" });
    if (p === "/api/v1/templates" || p === "/api/v1/templates/public") {
      return json([
        { id: 4, code: "khmer-celestial", slug: "khmer-celestial", name: "Khmer Celestial", category: "TRADITIONAL", status: "ACTIVE", price: 0, currency: "USD", premium: false, thumbnailUrl: "/templates/event-essential.svg", supportedEventTypes: ["WEDDING"], supportedLanguages: ["KM", "EN", "BOTH"] },
        { id: 5, code: "silk-heritage", slug: "silk-heritage", name: "Silk Heritage", category: "LUXURY", status: "ACTIVE", price: 29, currency: "USD", premium: true, thumbnailUrl: "/templates/event-essential.svg", supportedEventTypes: ["WEDDING"], supportedLanguages: ["KM", "EN", "BOTH"] },
      ]);
    }
    if (p.startsWith("/api/v1/templates/recommendations")) return json([]);
    if (p.endsWith("/me/entitlements") || p.endsWith("/subscriptions/entitlements")) {
      return json({ source: "PRO_PACKAGE", packagePlan: { id: 2, code: "PRO", packageName: "Pro" }, features: ["QR_INVITATIONS", "TEAM_MEMBERS"], quotas: { invitations: { used: 1, limit: 10 }, guests: { used: 1, limit: 500 }, teamMembers: { used: 1, limit: 5 } } });
    }
    const baseEvent = {
      id: 101,
      userId: 7,
      title: "សិរីមង្គលការ សុផល & ចាន់ណារី",
      eventType: "WEDDING",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      slug: "audit-event",
      groomName: "សុផល",
      brideName: "ចាន់ណារី",
      venueName: "Sokha Phnom Penh Hotel",
      eventDate: "2027-11-28",
      templateCode: "khmer-celestial",
      languageMode: "BOTH",
    };
    if (p.endsWith("/invitations/my")) return json([baseEvent]);
    if (p === "/api/v1/invitations/101" || p === "/api/v1/invitations/101/preview") return json(baseEvent);
    if (p === "/api/v1/invitations/101/access") return json({ owner: true, permissions: ["VIEW_EVENT", "EDIT_EVENT", "MANAGE_GUESTS", "MANAGE_BUDGET"], ownerFeatures: ["QR_INVITATIONS"] });
    const guestRows = [
      { id: 501, invitationId: 101, guestName: "Sokha Chan", phone: "012345678", seatCount: 2, guestGroup: "Bride Side", sideType: "Family", sendStatus: "SENT" },
      { id: 502, invitationId: 101, guestName: "ចាន់ ដារ៉ា", phone: "012999888", seatCount: 1, guestGroup: "Family", sideType: "Friend", sendStatus: "PENDING" },
    ];
    if (p === "/api/v1/invitations/101/guests") return json(guestRows);
    if (p === "/api/v1/invitations/101/guests/overview") {
      return json({
        guestRecords: 2, reservedSeats: 3, attendingRecords: 1, declinedRecords: 0, maybeRecords: 0,
        unansweredRecords: 1, respondedRecords: 1, toInviteRecords: 1, checkedInRecords: 0, confirmedAttendees: 2, markedSentRecords: 1,
      });
    }
    if (p === "/api/v1/invitations/101/guests/page") {
      return json({
        items: [
          { guest: guestRows[0], rsvpStatus: "ATTENDING", attendeeCount: 2, respondedAt: "2026-11-26T08:00:00Z", checkedIn: false, checkedInAt: null },
          { guest: guestRows[1], rsvpStatus: null, attendeeCount: null, respondedAt: null, checkedIn: false, checkedInAt: null },
        ],
        page: 0, size: 25, totalElements: 2, totalPages: 1,
      });
    }
    if (p === "/api/v1/invitations/101/budget-items") {
      return json([
        { id: 1, category: "Venue & Transport", itemName: "Grand Ballroom Rental", estimatedCost: 4500, actualCost: 4500, currency: "USD", status: "PAID", expenseDate: "2026-11-20", vendorName: "Sokha Hotel" },
        { id: 2, category: "Food & Catering", itemName: "Khmer Ceremony Feast", estimatedCost: 12000000, actualCost: 6000000, currency: "KHR", status: "PENDING", expenseDate: "2026-11-21", vendorName: "Mekong Catering" },
      ]);
    }
    if (p === "/api/v1/invitations/101/budget/summary") {
      return json({ plannedTotalUsd: 4500, spentTotalUsd: 4500, plannedTotalKhr: 12000000, spentTotalKhr: 6000000 });
    }
    if (p.startsWith("/api/v1/public/invitations/audit-event")) {
      if (p.endsWith("/wishes")) {
        const msg = xssInject ? '<img src=x onerror="window.__xssFired=true">Best wishes!' : "សូមជូនពរគូស្វាមីភរិយាថ្មី!";
        return json([{ id: 1, guestName: "Vireak", message: msg, createdAt: "2026-11-27T08:00:00Z" }]);
      }
      if (p.endsWith("/media")) return json({ coverImage: null, galleryImages: [] });
      return json({
        ...baseEvent,
        enabledSections: JSON.stringify({ story: true, schedule: true, venue: true, rsvp: true, wishes: true }),
        contentJson: JSON.stringify({
          cinematicIntro: { enabled: false },
          messageText: "សូមគោរពអញ្ជើញ",
          schedule: [{ time: "17:00", title: "Guest Welcome" }],
        }),
      });
    }
    return json({});
  });
}

test.describe("Phase 26 — Cross-Cutting Validation (WCAG 2.2 AA, Responsive, Multilingual, PWA, Security)", () => {
  test("passes WCAG 2.2 AA with 0 violations across landing, catalog, populated budget, opened drawer at 359px, and opened public invitation", async ({ page }) => {
    for (const scenario of [
      { route: "/", theme: "light", lang: "en", auth: false },
      { route: "/templates", theme: "dark", lang: "en", auth: false },
      { route: "/app/events", theme: "dark", lang: "km", auth: true },
      { route: "/app/events/101/guests", theme: "dark", lang: "en", auth: true, waitText: "Sokha Chan" },
      { route: "/app/events/101/budget", theme: "light", lang: "km", auth: true, waitText: "Grand Ballroom Rental" },
    ]) {
      await installPhase26Fixtures(page, { authenticated: scenario.auth, lang: scenario.lang, theme: scenario.theme });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(scenario.route, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts.ready);
      if (scenario.waitText) {
        await expect(page.locator("body")).toContainText(scenario.waitText, { timeout: 15000 });
      } else {
        await page.waitForTimeout(450);
      }

      expect(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth))).toBe(0);
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(axe.violations, `Axe violations on ${scenario.route} (${scenario.theme}/${scenario.lang})`).toEqual([]);
    }

    // Open mobile drawer below 359px and verify profile link keeps an explicit accessible name and 0 Axe violations
    await page.setViewportSize({ width: 359, height: 800 });
    await installPhase26Fixtures(page, { authenticated: true, lang: "km", theme: "dark" });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/app/events", { waitUntil: "domcontentloaded" });
    await page.locator(".host-hamburger-btn").click();
    const drawer = page.locator("#host-mobile-navigation");
    await expect(drawer).toHaveClass(/open/);
    await expect(drawer.getByRole("link", { name: "Sokha Meas" })).toBeVisible();
    const drawerAxe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(drawerAxe.violations, "Axe violations on opened mobile drawer at 359px").toEqual([]);

    // Verify opened public invitation experience after envelope activation (outside inert cover)
    await page.setViewportSize({ width: 390, height: 844 });
    await installPhase26Fixtures(page, { authenticated: false, lang: "km", theme: "light" });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/i/audit-event", { waitUntil: "domcontentloaded" });
    await page.locator(".kc-opening button").first().click();
    await expect(page.locator(".kc-main")).not.toHaveAttribute("aria-hidden", "true");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth))).toBe(0);
    const openedInviteAxe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(openedInviteAxe.violations, "Axe violations on opened public invitation").toEqual([]);
  });

  test("preserves 0px overflow from 320px to 1440px, short landscape height, and genuine 200% computed font resize", async ({ page }) => {
    await installPhase26Fixtures(page, { authenticated: true, lang: "km", theme: "dark" });
    await page.goto("/app/events", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("main").first()).toBeVisible();

    for (const size of [
      { width: 320, height: 900 },
      { width: 390, height: 844 },
      { width: 600, height: 900 },
      { width: 768, height: 1024 },
      { width: 844, height: 390 },
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(size);
      await page.waitForTimeout(80);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    const resizeCheck = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      const supporting = document.querySelector("main p");
      const beforeH1 = h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0;
      const beforeP = supporting ? parseFloat(getComputedStyle(supporting).fontSize) : 0;

      const snapshot = [...document.querySelectorAll("body *")].map((el) => [el, parseFloat(getComputedStyle(el).fontSize)]);
      for (const [el, px] of snapshot) {
        if (px > 0) el.style.setProperty("font-size", `${px * 2}px`, "important");
      }

      const afterH1 = h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0;
      const afterP = supporting ? parseFloat(getComputedStyle(supporting).fontSize) : 0;
      return {
        beforeH1,
        afterH1,
        beforeP,
        afterP,
        overflowX: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      };
    });
    expect(resizeCheck.beforeH1).toBeGreaterThan(0);
    expect(resizeCheck.afterH1).toBeGreaterThanOrEqual(resizeCheck.beforeH1 * 1.99);
    expect(resizeCheck.beforeP).toBeGreaterThan(0);
    expect(resizeCheck.afterP).toBeGreaterThanOrEqual(resizeCheck.beforeP * 1.99);
    expect(resizeCheck.overflowX).toBe(0);
  });

  test("verifies PWA zero-SW posture, valid manifest, unauth route guard, and XSS escaping on public invite", async ({ page }) => {
    await installPhase26Fixtures(page, { authenticated: false, lang: "en", theme: "light", xssInject: true });
    await page.goto("/app/events", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });

    const swCount = await page.evaluate(async () => (await navigator.serviceWorker?.getRegistrations())?.length ?? 0);
    expect(swCount).toBe(0);

    const manifestOk = await page.evaluate(async () => {
      const res = await fetch("/manifest.webmanifest");
      if (!res.ok) return false;
      const body = await res.json();
      return Boolean(body?.name && body?.start_url);
    });
    expect(manifestOk).toBe(true);

    await page.goto("/i/audit-event", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-template-renderer='khmer-celestial']")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("body")).toContainText("Best wishes!", { timeout: 15000 });
    expect(await page.evaluate(() => window.__xssFired)).toBeUndefined();
  });

  test("keeps EN/KM toggle interactive on host shell without route loss or keyboard traps", async ({ page }) => {
    await installPhase26Fixtures(page, { authenticated: true, lang: "en", theme: "light" });
    await page.goto("/app/events", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.locator(".app-language-toggle:visible").click();
    await expect(page.locator("html")).toHaveAttribute("lang", "km");
    expect(page.url()).toContain("/app/events");

    const trigger = page.getByRole("button", { name: "Sokha Meas" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
