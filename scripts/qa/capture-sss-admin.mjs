import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium, expect } from "../../apps/frontend-user/node_modules/@playwright/test/index.mjs";
import AxeBuilder from "../../apps/frontend-user/node_modules/@axe-core/playwright/dist/index.mjs";

const origin = process.env.SSS_ADMIN_URL ?? "http://127.0.0.1:4184";
const stage = process.argv[2];
if (stage !== "before" && stage !== "after") throw new Error("Use before or after as the first argument.");
const output = `output/playwright/sss-plus-v2/${stage}/admin`;
await mkdir(output, { recursive: true });
const readReportFixture = name => readFile(new URL(`../../output/admin-reporting/${name}.json`, import.meta.url), "utf8").then(JSON.parse);
const [definitions, executiveReport] = await Promise.all(["definitions", "executive"].map(readReportFixture));

const encoded = value => Buffer.from(JSON.stringify(value)).toString("base64url");
const token = `${encoded({ alg: "none" })}.${encoded({ sub: "1", exp: Math.floor(Date.now() / 1000) + 3600 })}.fixture`;
const summary = {
  totalUsers: 1482, activeUsers: 1301, totalGuests: 5892, totalInvitations: 238,
  publishedInvitations: 192, totalTemplates: 14, premiumTemplates: 6,
  recentUsers: [{ id: 42, fullName: "Sothea Example", email: "sothea@example.test", status: "ACTIVE", role: "USER" }],
  recentInvitations: [{ id: 38, title: "Vannak & Bopha", status: "PUBLISHED" }],
  recentPayments: [{ id: 7, orderCode: "QA-001", status: "PAID", paidAmount: 12, currency: "USD", paidAt: "2026-11-24T10:30:00Z" }],
};
const template = {
  id: 38, code: "khmer-celestial", name: "Khmer Celestial", status: "ACTIVE",
  category: "TRADITIONAL", supportedLanguages: ["KH", "EN"], premium: false, price: 0,
  description: JSON.stringify({ presetId: "KHMER_CELESTIAL", exampleExtension: { owner: "fixture" } }),
};
const matrix = [
  ...[320, 360, 375, 390, 414, 430, 600, 768, 820, 1024, 1280, 1440, 1920].map(width => ({ width, path: "/dashboard" })),
  { width: 667, height: 375, path: "/dashboard" },
  ...["/users", "/users/42", "/templates", "/payments", "/packages", "/notifications", "/system-logs", "/reports", "/dev/api-monitor", "/login", "/not-found", "/templates/new", "/templates/38"]
    .flatMap(path => [{ width: 390, path }, { width: 1440, path }]),
  ...["/", "/admin", "/admin/dashboard", "/admin/users", "/admin/templates", "/admin/payments", "/admin/packages", "/admin/notifications", "/admin/reports", "/admin/system-logs"].map(path => ({ width: 1440, path })),
  { width: 390, path: "/dashboard", mode: "navigation" },
  { width: 390, path: "/templates/38", mode: "preview" },
  { width: 1440, path: "/templates/new", mode: "sections" },
  { width: 390, path: "/users", mode: "denied" },
  { width: 1440, path: "/dashboard", mode: "error" },
  { width: 1440, path: "/dashboard", mode: "keyboard" },
];
const browser = await chromium.launch();
const results = [];
try {
  for (const { width, height = width < 768 ? 844 : 1000, path, mode } of matrix) {
    if (process.env.SSS_ADMIN_ROUTES && !process.env.SSS_ADMIN_ROUTES.split(",").includes(path)) continue;
    const lang = width < 768 && !mode ? "km" : "en";
    const theme = width < 768 ? "dark" : "light";
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    const responses = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(({ lang, theme, token, auth }) => {
      localStorage.setItem("koupreng.admin.lang", lang);
      localStorage.setItem("theme", theme);
      if (auth) localStorage.setItem("koupreng.admin.auth", JSON.stringify({
        accessToken: token,
        user: { id: 1, fullName: "Audit fixture", email: "admin@example.test", role: "ADMIN" },
      }));
    }, { lang, theme, token, auth: path !== "/login" && mode !== "denied" });
    await page.route(url => url.pathname.startsWith("/api/"), route => {
      const url = new URL(route.request().url());
      const endpoint = url.pathname;
      const parts = endpoint.split("/");
      const key = parts.at(-1);
      let data;
      if (key === "summary" && mode !== "error") data = summary;
      if (key === "system-health") data = { status: "UP" };
      if (["users", "templates", "packages", "payments", "orders", "notifications", "system-logs", "audit-logs", "alerts"].includes(key)) data = [];
      if (key === "42" && parts.at(-2) === "users") data = summary.recentUsers[0];
      if (endpoint === "/api/v1/admin/templates/38") data = template;
      if (url.origin !== origin && endpoint === "/api/v1/templates") data = [template];
      if (url.origin !== origin && endpoint.startsWith("/api/v1/templates/")) data = template;
      if (endpoint.endsWith("/i18n/messages")) data = { messages: {} };
      if (endpoint === "/api/v1/admin/reports/management/definitions") data = definitions;
      if (endpoint === "/api/v1/admin/reports/management/executive") data = executiveReport;
      const status = data === undefined ? 503 : 200;
      responses.push({ endpoint, status });
      return route.fulfill({ status, json: data === undefined ? { message: "Unavailable in this fixture" } : { data } });
    });
    const name = `${path.slice(1).replaceAll("/", "-") || "index"}-${lang}-${theme}-${width}x${height}${mode ? `-${mode}` : ""}`;
    try {
      await page.goto(origin + path, { waitUntil: "domcontentloaded" });
      await page.locator("h1").first().waitFor({ state: "attached", timeout: 10000 }).catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      if (path.endsWith("/reports")) {
        await expect.poll(() => responses.some(({ endpoint, status }) => endpoint.endsWith("/management/executive") && status === 200)).toBe(true);
        await expect(page.locator(".report-overview-kpis")).toBeVisible();
      }
      if (mode === "navigation") {
        await page.getByRole("button", { name: "Open navigation" }).click();
        await expect(page.getByRole("dialog")).toBeVisible();
      }
      if (mode === "preview") {
        await page.getByRole("button", { name: "Preview", exact: true }).click();
        await expect(page.locator("#template-studio-preview")).toBeVisible();
        const frame = page.frameLocator('iframe[title="Live User Template Preview"]');
        await frame.locator(".kc-root").waitFor({ timeout: 15000 });
        if (stage === "after") {
          const device = page.getByRole("group", { name: "Preview device" });
          const scene = page.getByRole("group", { name: "Invitation preview state" });
          await device.getByRole("button", { name: "Tablet" }).click();
          await expect(device.getByRole("button", { name: "Tablet" })).toHaveAttribute("aria-pressed", "true");
          await device.getByRole("button", { name: "Phone" }).click();
          await scene.getByRole("button", { name: "Invitation" }).click();
        } else {
          await page.getByRole("button", { name: /Full/ }).click();
        }
        await expect(frame.locator(".kc-opening")).toBeHidden();
        await expect(frame.locator(".kc-main")).not.toHaveAttribute("inert", "");
      }
      if (mode === "sections") {
        const sections = page.getByRole("group", { name: "Authoring sections" });
        for (const button of await sections.getByRole("button").all()) {
          await button.click();
          await expect(button).toHaveAttribute("aria-pressed", "true");
        }
      }
      if (mode === "denied") await expect(page).toHaveURL(/\/login/);
      if (mode === "keyboard") {
        const nav = page.getByRole("navigation", { name: "Admin navigation" });
        const templates = nav.getByRole("link", { name: "Invitation templates" });
        await templates.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/\/templates$/);
        await expect(page.locator("#admin-main")).toBeFocused();
      }
      await page.screenshot({ path: `${output}/${name}.png`, animations: "disabled" });
      const geometry = await page.evaluate(() => ({
        title: document.title, lang: document.documentElement.lang,
        heading: document.querySelector("h1")?.textContent,
        documentWidth: document.documentElement.scrollWidth, viewport: innerWidth,
        background: getComputedStyle(document.body).backgroundColor,
        resolvedRoute: location.pathname,
      }));
      const accessibility = [320, 390, 1440].includes(width) && (path === "/dashboard" || path.startsWith("/templates/"))
        ? (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze())
          .violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.map(({ target }) => target) }))
        : null;
      results.push({ name, path, geometry, responses, errors, accessibility });
      console.log(name, geometry.heading ?? "[no h1]", geometry.documentWidth, errors.length, accessibility?.length ?? "—");
    } catch (error) {
      results.push({ name, path, responses, errors, failure: error.message });
      console.error(name, error.message);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
await writeFile(`${output}/results${process.env.SSS_ADMIN_ROUTES ? "-focused" : ""}.json`, JSON.stringify({ engine: browser.version(), results }, null, 2));
// Baselines retain observed defects. Candidate captures enforce the measured gates.
const gateFailures = results.filter(row => row.failure || row.errors.length || (stage === 'after' && (
  row.geometry?.documentWidth > row.geometry?.viewport + 1 ||
  row.accessibility?.some(violation => ['critical', 'serious'].includes(violation.impact))
)));
if (gateFailures.length) {
  console.error('Capture gate failed:', gateFailures.map(row => row.name).join(', '));
  process.exitCode = 1;
}
