import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const AUTH_KEY = "koupreng.auth";

const MOCK_EVENT = {
  id: 42,
  eventId: 42,
  userId: 7,
  organizationId: 10,
  title: "Vannak & Kolab Royal Wedding",
  eventType: "WEDDING",
  status: "PUBLISHED",
  visibility: "PUBLIC",
  slug: "vannak-kolab-2027",
  eventDate: "2027-11-28",
  venueName: "Sokha Phnom Penh Hotel",
  updatedAt: "2026-11-26T08:00:00Z",
};

const MOCK_ORGS = [
  {
    id: 10,
    ownerUserId: 7,
    name: "Royal Khmer Planners",
    slug: "royal-khmer-planners",
    status: "ACTIVE",
    createdAt: "2026-09-01T08:00:00Z",
    members: [
      { id: 1, userId: 7, email: "sokha@example.test", role: "OWNER", status: "ACTIVE", joinedAt: "2026-09-01T08:00:00Z" },
      { id: 2, userId: 11, email: "planner@example.test", role: "MANAGER", status: "ACTIVE", inviteAcceptedAt: "2026-09-02T09:00:00Z", joinedAt: "2026-09-02T09:00:00Z" },
      { id: 3, userId: null, email: "staff@example.test", role: "CHECK_IN_STAFF", status: "INVITED", invitedAt: "2026-11-20T09:00:00Z", inviteExpiresAt: "2099-01-01T00:00:00Z" },
    ],
  },
];

async function installPhase23Fixtures(page, { lang = "en", colorMode = "light", aiStatus = 503 } = {}) {
  const token = ["eyJhbGciOiJub25lIn0", "eyJleHAiOjQxMDIyNjg4MDB9", ""].join("."); // gitleaks:allow
  await page.addInitScript(({ authKey, authToken, langVal, modeVal }) => {
    window.localStorage.setItem("koupreng.lang", langVal);
    window.localStorage.setItem("koupreng.colorMode", modeVal);
    window.localStorage.setItem("theme", modeVal);
    const env = JSON.stringify({
      accessToken: authToken,
      tokenType: "Bearer",
      expiresAt: "2100-01-01T00:00:00Z",
      user: { id: 7, fullName: "Sokha Meas", email: "sokha@example.test", phone: "012345678", role: "USER" },
    });
    window.sessionStorage.setItem(authKey, env);
    window.localStorage.setItem(authKey, env);
  }, { authKey: AUTH_KEY, authToken: token, langVal: lang, modeVal: colorMode });

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
        body: JSON.stringify({ id: 7, fullName: "Sokha Meas", email: "sokha@example.test", phone: "012345678", role: "USER" }),
      });
    }
    if (pathname.endsWith("/auth/me") || pathname.endsWith("/users/profile")) {
      return json({ id: 7, fullName: "Sokha Meas", email: "sokha@example.test", phone: "012345678", role: "USER" });
    }
    if (pathname.endsWith("/entitlements/me") || pathname.endsWith("/subscriptions/current") || pathname.endsWith("/subscriptions/entitlements")) {
      return json({ packagePlan: { id: 2, code: "PRO", packageName: "Pro" }, features: ["TEAM_MEMBERS"], quotas: {} });
    }
    if (pathname === "/api/v1/organizations") return json(MOCK_ORGS);
    if (pathname === "/api/v1/organizations/10") return json(MOCK_ORGS[0]);
    if (pathname === "/api/v1/invitations/my") return json([MOCK_EVENT]);
    if (pathname === "/api/v1/invitations/42") return json(MOCK_EVENT);
    if (pathname === "/api/v1/invitations/42/access") {
      return json({
        owner: true,
        permissions: ["VIEW_EVENT", "EDIT_EVENT", "MANAGE_SETTINGS", "MANAGE_INVITATION", "MANAGE_TEAM"],
        ownerFeatures: ["TEAM_MEMBERS"],
      });
    }
    if (pathname === "/api/v1/notifications") {
      return json([
        {
          id: 1,
          title: "Guest RSVP Confirmed",
          message: "Sok Dara accepted the invitation.",
          type: "RSVP",
          channel: "TELEGRAM",
          status: "DELIVERED",
          actionUrl: "/app/events/42/rsvp",
          readAt: null,
          createdAt: "2026-11-26T10:00:00Z",
        },
        {
          id: 2,
          title: "Email Delivery Failed",
          message: "Guest inbox rejected message.",
          type: "INVITATION_SENT",
          channel: "EMAIL",
          status: "FAILED",
          errorMessage: "SMTP 550 mailbox unavailable",
          readAt: "2026-11-25T10:00:00Z",
          createdAt: "2026-11-25T09:00:00Z",
        },
      ]);
    }
    if (pathname === "/api/v1/notifications/summary") {
      return json({ unread: 1, sent: 12, delivered: 10, failed: 1 });
    }
    if (pathname === "/api/v1/telegram/user/settings") {
      return json({ available: true, connected: true });
    }
    if (pathname === "/api/v1/telegram/user/link" && method === "DELETE") {
      return json({ disconnected: true });
    }
    if (pathname.startsWith("/api/v1/ai/")) {
      if (aiStatus >= 400) {
        return route.fulfill({
          status: aiStatus,
          contentType: "application/json",
          body: JSON.stringify({ message: aiStatus === 403 ? "Forbidden" : "AI service unavailable" }),
        });
      }
      return json({ generatedText: "Verified AI copy", provider: "gemini", enabled: true });
    }
    return json({});
  });
}

test.describe("Phase 23 — Team, Notifications, Profile Preferences & AI Decision", () => {
  test("Organizations, detail, notifications, profile and AI pass Obsidian Dark WCAG AA and functional contracts", async ({ page }) => {
    await installPhase23Fixtures(page, { lang: "en", colorMode: "dark", aiStatus: 503 });

    for (const routePath of ["/app/organizations", "/app/organizations/10", "/app/notifications", "/app/events/42/assistant"]) {
      await page.goto(routePath, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBe(0);
      const axe = await new AxeBuilder({ page })
        .exclude("header.host-nav-bar, .host-nav-shell")
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(axe.violations, `${routePath} violations: ${JSON.stringify(axe.violations)}`).toEqual([]);
    }

    // Verify organization role breakdown and absence of crown emoji
    await page.goto("/app/organizations/10", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".k-org-roles-guide")).toBeVisible();
    expect(await page.textContent("body")).not.toContain("👑");

    // Verify notifications filter + Telegram disconnect confirmation dialog
    await page.goto("/app/notifications", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Failed delivery/i }).click();
    await expect(page.getByText("Email Delivery Failed")).toBeVisible();
    await expect(page.getByText("Guest RSVP Confirmed")).toHaveCount(0);

    await page.getByRole("button", { name: /Disconnect Telegram/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /Keep connected/i }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Verify AI local template fallback + pre-submit privacy disclosure
    await page.goto("/app/events/42/assistant", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("note")).toContainText(/Do not enter private guest phone numbers/i);
    await page.getByRole("button", { name: /Generate content/i }).click();
    await expect(page.getByText(/Local template draft/i)).toBeVisible();
  });

  test("Profile preserves edited inputs across EN/KM toggle and AI 403 fails closed", async ({ page }) => {
    await installPhase23Fixtures(page, { lang: "en", colorMode: "light", aiStatus: 403 });

    await page.goto("/app/profile", { waitUntil: "domcontentloaded" });
    const fullNameInput = page.locator("input[autocomplete='name']");
    await expect(fullNameInput).toHaveValue("Sokha Meas");
    await fullNameInput.fill("Sokha Unsaved Draft");

    await page.locator(".profile-preferences-section [role='switch']").click();
    await expect(fullNameInput).toHaveValue("Sokha Unsaved Draft");

    await page.goto("/app/events/42/assistant", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Generate content/i }).click();
    await expect(page.getByRole("alert")).toContainText(/Forbidden/i);
    await expect(page.getByText(/Local template draft/i)).toHaveCount(0);
  });
});
