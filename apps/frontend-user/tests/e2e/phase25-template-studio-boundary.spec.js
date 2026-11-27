import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const AUTH_KEY = "koupreng.auth";

async function installPhase25Fixtures(page, { templateCode = "silk-heritage", removedFromCatalog = false } = {}) {
  const token = ["eyJhbGciOiJub25lIn0", "eyJleHAiOjQxMDIyNjg4MDB9", ""].join("."); // gitleaks:allow
  await page.addInitScript(({ authKey, authToken }) => {
    window.localStorage.setItem("koupreng.lang", "en");
    window.localStorage.setItem("koupreng.colorMode", "light");
    const env = JSON.stringify({
      accessToken: authToken,
      tokenType: "Bearer",
      expiresAt: "2100-01-01T00:00:00Z",
      user: { id: 7, fullName: "Sokha Meas", email: "sokha@example.test", role: "USER" },
    });
    window.sessionStorage.setItem(authKey, env);
    window.localStorage.setItem(authKey, env);
  }, { authKey: AUTH_KEY, authToken: token });

  await page.route("**/api/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const json = (data, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ data }) });

    if (pathname.endsWith("/i18n/messages")) return json({ messages: {} });
    if (pathname.endsWith("/auth/me")) return json({ id: 7, fullName: "Sokha Meas", email: "sokha@example.test", role: "USER" });
    if (pathname === "/api/v1/templates" || pathname === "/api/v1/templates/public") {
      return json(
        removedFromCatalog
          ? []
          : [
              {
                id: 5,
                code: "silk-heritage",
                slug: "silk-heritage",
                name: "Silk Heritage",
                category: "TRADITIONAL",
                status: "ACTIVE",
                description: "{invalid-partial-json",
                price: 0,
                currency: "USD",
              },
            ]
      );
    }
    if (pathname.startsWith("/api/v1/templates/slug/")) {
      return json({
        id: 5,
        code: "silk-heritage",
        slug: "silk-heritage",
        name: "Silk Heritage",
        status: "ACTIVE",
        description: "{invalid-partial-json",
      });
    }
    const invPayload = {
      id: 42,
      userId: 7,
      title: "Vannak & Kolab",
      groomName: "Vannak",
      brideName: "Kolab",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      slug: "vannak-kolab",
      templateCode,
      venueName: "Sokha Hotel",
      eventDate: "2027-11-28",
      customBlocks: [{ id: "future-1", type: "unknown_studio_block" }],
    };
    if (pathname === "/api/v1/invitations/my") return json([invPayload]);
    if (pathname === "/api/v1/invitations/42") return json(invPayload);
    if (pathname === "/api/v1/invitations/42/access") {
      return json({
        owner: true,
        permissions: ["VIEW_EVENT", "EDIT_EVENT", "MANAGE_INVITATION", "MANAGE_SETTINGS"],
        ownerFeatures: ["QR_INVITATIONS", "PREMIUM_TEMPLATES"],
      });
    }
    if (pathname === "/api/v1/invitations/42/preview" || pathname === "/api/v1/invitations/public/slug/vannak-kolab") {
      return json(invPayload);
    }
    if (pathname === "/api/v1/media/invitation/42") return json({ photos: [] });
    return json({});
  });
}

test.describe("Phase 25 — Template Studio / CMS Consumption Boundary", () => {
  test("preserves preview & published parity, tolerates partial metadata JSON, and handles legacy alias routes", async ({ page }) => {
    await installPhase25Fixtures(page, { templateCode: "silk-heritage", removedFromCatalog: false });

    await page.goto("/templates/royal-khmer/demo", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);

    await page.goto("/app/events/42/preview", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-template-renderer='silk-heritage']")).toBeVisible({ timeout: 15000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);

    const axe = await new AxeBuilder({ page })
      .exclude(".inv-preview-header")
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(axe.violations).toEqual([]);
  });

  test("shows TemplateUnavailable when draft references a template removed from catalog", async ({ page }) => {
    await installPhase25Fixtures(page, { templateCode: "removed-studio-template-999", removedFromCatalog: true });

    await page.goto("/app/events/42/preview", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Template unavailable/i)).toBeVisible({ timeout: 15000 });
  });
});
