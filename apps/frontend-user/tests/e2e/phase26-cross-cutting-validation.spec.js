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
    if (p === "/api/v1/invitations/101/access") return json({ owner: true, permissions: ["VIEW_EVENT", "EDIT_EVENT", "MANAGE_GUESTS"], ownerFeatures: ["QR_INVITATIONS"] });
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
  test("passes WCAG 2.2 AA with 0 violations on landing, catalog, and host shell across Light and Obsidian Dark", async ({ page }) => {
    for (const scenario of [
      { route: "/", theme: "light", lang: "en", auth: false },
      { route: "/templates", theme: "dark", lang: "en", auth: false },
      { route: "/app/events", theme: "dark", lang: "km", auth: true },
    ]) {
      await installPhase26Fixtures(page, { authenticated: scenario.auth, lang: scenario.lang, theme: scenario.theme });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(scenario.route, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(450);

      expect(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth))).toBe(0);
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(axe.violations, `Axe violations on ${scenario.route} (${scenario.theme}/${scenario.lang})`).toEqual([]);
    }
  });

  test("preserves 0px overflow from 320px to 1440px, short landscape height, and 200% font scale", async ({ page }) => {
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
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
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
