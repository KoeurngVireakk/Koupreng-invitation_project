import { chromium } from "../../apps/frontend-user/node_modules/@playwright/test/index.mjs";
import { installUxFixtures } from "../../apps/frontend-user/tests/e2e/support/uxFixtures.js";
import fs from "node:fs/promises";
import process from "node:process";
const base = process.env.UX_AUDIT_BASE || "http://127.0.0.1:4183";
const out = process.env.UX_AUDIT_OUT || "docs/qa/ux-ui";
await fs.mkdir(`${out}/routes`, { recursive: true });
const browser = await chromium.launch();
const results = [];
const routes = ["/login", "/register", "/forgot-password", "/reset-password", "/app/profile", "/app/change-password", "/app/events", "/app/events/new", "/app/packages", "/app/payments", "/app/payments/AUDIT", "/app/notifications", "/app/organizations", "/app/organizations/11", "/app/templates/paid", ...["", "/invitation", "/preview", "/guests", "/rsvp", "/gifts", "/budget", "/seating", "/check-in", "/qr", "/reports", "/settings", "/delivery", "/media", "/wishes", "/assistant"].map(module => `/app/events/101${module}`), "/templates", "/templates/browse", "/templates/browse/event-essential", "/templates/event-essential", "/templates/event-essential/demo", "/templates/event-essential/preview", "/templates/30/checkout", "/w/audit-event", "/i/audit-event?token=audit-guest", "/payments/AUDIT/status", "/payments/success", "/payments/return", "/payments/cancel", "/", "/pricing", "/contact", "/venues", "/venues/11", "/dashboard/invitations/101/guests", "/dashboard/expenses", "/create/wedding", "/about", "/help", "/does-not-exist"];
routes.push("/event/ux-local-draft", "/preview/ux-local-draft", "/create/wedding/101", "/event/101/manage", "/dashboard/invitations/101/edit", "/dashboard/invitations/101/preview", "/dashboard/invitations/design", "/dashboard/invitations/edit");
if (process.env.UX_AUDIT_OUT) {
  const modules = ["guests", "rsvp", "gifts", "budget", "seating", "check-in", "reports", "qr", "wishes", "assistant", "delivery", "media"];
  const globalModules = ["guests", "rsvp", "gifts", "budget", "seating", "check-in", "reports", "delivery", "media"];
  const accountRoutes = ["profile", "change-password", "notifications", "packages", "payments", "payments/AUDIT", "organizations", "organizations/11", "templates/paid"];
  routes.push("/app/events/101/team", "/app/events/101/analytics", "/event/create", "/dashboard/events/create",
    "/dashboard", "/dashboard/events", "/dashboard/invitations", "/dashboard/invitations/new", "/dashboard/invitations/101",
    "/dashboard/share", "/events", "/event/list", "/guests", "/expenses", "/gift", "/gifts", "/reports", "/profile",
    ...modules.map(part => `/dashboard/invitations/101/${part}`),
    ...globalModules.map(part => `/dashboard/${part}`),
    ...accountRoutes.map(part => `/dashboard/${part}`));
}
const selectedRoutes = [...new Set(process.env.UX_AUDIT_ROUTES ? process.env.UX_AUDIT_ROUTES.split(",") : routes)];
let previous = [];
if (process.env.UX_AUDIT_ROUTES) {
  try {
    previous = JSON.parse(await fs.readFile(`${out}/rendered-route-audit.json`, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
for (const [lang, width] of [["km", 390], ["en", 1440]]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
  await installUxFixtures(page, lang);
  let errors = [], failed = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("requestfailed", request => failed.push({ url: request.url(), error: request.failure()?.errorText }));
  for (const path of selectedRoutes) {
    errors = []; failed = [];
    const name = path.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "home";
    await page.goto(`${base}${path}`);
    await page.waitForLoadState("networkidle", { timeout: 7000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => { window.scrollTo(0, 0); document.querySelector(".dash-main-scroll")?.scrollTo(0, 0); });
    const screenshot = `${out}/routes/${name}-${lang}-${width}.png`;
    await page.screenshot({ path: screenshot, fullPage: true });
    const metrics = await page.evaluate(() => {
      const visible = element => { const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 && !element.closest("[inert]") && element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); };
      const overflow = [...document.querySelectorAll("main,section,article,table,form,input,select,button,h1,h2")].filter(visible).filter(element => { const r = element.getBoundingClientRect(); return r.right > innerWidth + 2 || r.left < -2; }).slice(0, 12).map(element => ({ tag: element.tagName, class: element.className, text: element.textContent.slice(0, 70) }));
      return { heading: [...document.querySelectorAll("h1,h2")].filter(visible).slice(0, 5).map(element => element.textContent), body: document.body.innerText.slice(-600), documentWidth: document.documentElement.scrollWidth, width: innerWidth, overflow, smallText: [...document.querySelectorAll("main p,main label,main th,main td")].filter(visible).filter(element => parseFloat(getComputedStyle(element).fontSize) < 13).length };
    });
    results.push({ path, resolved: new URL(page.url()).pathname + new URL(page.url()).search, lang, width, screenshot, metrics, errors: [...errors], failed: [...failed] });
    console.log(lang, width, path, "overflow", metrics.overflow.length, "errors", errors.length);
  }
  await page.close();
}
await fs.writeFile(`${out}/rendered-route-audit.json`, JSON.stringify([...previous.filter(row => !selectedRoutes.includes(row.path)), ...results], null, 2));
await browser.close();
// Child geometry is diagnostic: scrollable tables and hidden panels may extend
// beyond the viewport. Document overflow and runtime errors are candidate failures.
if (process.env.UX_AUDIT_GATE === '1') {
  const gateFailures = results.filter(row => row.errors.length || row.metrics.documentWidth > row.metrics.width + 1);
  if (gateFailures.length) {
    console.error('Route gate failed:', gateFailures.map(row => `${row.lang}:${row.path}`).join(', '));
    process.exitCode = 1;
  }
}
