import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const AUTH_KEY = "koupreng.auth";

async function installBoundaryFixtures(page, { templateStatus = "INACTIVE", checkoutConflict = false } = {}) {
  const token = ["eyJhbGciOiJub25lIn0", "eyJleHAiOjQxMDIyNjg4MDB9", ""].join("."); // gitleaks:allow
  await page.addInitScript(({ authKey, authToken }) => {
    window.localStorage.setItem("koupreng.lang", "en");
    window.localStorage.setItem("koupreng.colorMode", "light");
    const env = JSON.stringify({
      accessToken: authToken,
      tokenType: "Bearer",
      expiresAt: "2100-01-01T00:00:00Z",
      user: { id: 7, fullName: "Customer User", email: "customer@example.test", role: "SUPER_ADMIN", adminNote: "INTERNAL_SECRET" },
    });
    window.sessionStorage.setItem(authKey, env);
    window.localStorage.setItem(authKey, env);
  }, { authKey: AUTH_KEY, authToken: token });

  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const pathname = new URL(req.url()).pathname;
    const method = req.method();
    const json = (data, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ data }) });

    if (pathname.endsWith("/i18n/messages")) return json({ messages: {} });
    if (pathname.endsWith("/users/me")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 7, fullName: "Customer User", email: "customer@example.test", phone: "012345678", role: "SUPER_ADMIN", adminNote: "INTERNAL_SECRET" }),
      });
    }
    if (pathname === "/api/v1/templates" || pathname === "/api/v1/templates/public") {
      return json([
        {
          id: 5,
          code: "silk-heritage",
          slug: "silk-heritage",
          name: "Silk Heritage",
          category: "TRADITIONAL",
          status: templateStatus,
          price: 37.5,
          currency: "USD",
          premium: true,
          checkoutEligible: templateStatus === "ACTIVE" && !checkoutConflict,
          checkoutAmount: "37.50",
          checkoutCurrency: "USD",
        },
      ]);
    }
    if (pathname === "/api/v1/templates/slug/khmer-celestial" || pathname === "/api/v1/templates/khmer-celestial") {
      return json({ id: 4, code: "khmer-celestial", slug: "khmer-celestial", name: "Khmer Celestial", status: "INACTIVE" });
    }
    if (pathname === "/api/v1/payment-orders/static" && method === "POST" && checkoutConflict) {
      return route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ message: "Offer updated or template unavailable. Please refresh." }),
      });
    }
    if (pathname.endsWith("/subscriptions/entitlements")) {
      return json({ packagePlan: { id: 1, code: "FREE", packageName: "Free" }, features: [], quotas: {} });
    }
    return json({});
  });
}

test.describe("Phase 24 — Admin Compatibility Boundary (Frontend User Only)", () => {
  test("blocks disabled INACTIVE templates, isolates /admin routes, and omits internal admin metadata", async ({ page }) => {
    await installBoundaryFixtures(page, { templateStatus: "INACTIVE" });

    await page.goto("/templates/khmer-celestial", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Template unavailable/i })).toBeVisible({ timeout: 15000 });

    await page.goto("/templates/silk-heritage/checkout", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Current offer unavailable/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /Create payment order/i })).toBeDisabled();

    await page.goto("/admin/users", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).not.toContainText("INTERNAL_SECRET");
    await expect(page.locator("body")).not.toContainText("SUPER_ADMIN");

    await page.goto("/app/profile", { waitUntil: "domcontentloaded" });
    await expect(page.locator("input[autocomplete='name']")).toHaveValue("Customer User", { timeout: 15000 });
    await expect(page.locator("body")).not.toContainText("INTERNAL_SECRET");
    await expect(page.locator("body")).not.toContainText("SUPER_ADMIN");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBe(0);
    const axe = await new AxeBuilder({ page })
      .exclude("header.host-nav-bar, .host-nav-shell")
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(axe.violations).toEqual([]);
  });
});
