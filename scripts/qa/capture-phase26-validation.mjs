import { chromium } from '../../apps/frontend-user/node_modules/playwright/index.mjs';
import AxeBuilder from '../../apps/frontend-user/node_modules/@axe-core/playwright/dist/index.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { gzipSync } from 'node:zlib';

const stageArg = process.argv.find((arg) => arg.startsWith('--stage='))?.split('=')[1] || 'before';
const portArg = Number(process.argv.find((arg) => arg.startsWith('--port='))?.split('=')[1] || '4360');
const appDir = path.resolve(process.argv.find((arg) => arg.startsWith('--app-dir='))?.split('=')[1] || 'apps/frontend-user');
const outDir = path.resolve(
  process.argv.find((arg) => arg.startsWith('--out-dir='))?.split('=')[1] ||
    `docs/uxui/phase26-cross-cutting-validation/evidence/${stageArg}`
);
const baseURL = `http://127.0.0.1:${portArg}`;
const TEST_TOKEN = ['eyJhbGciOiJub25lIn0', 'eyJleHAiOjQxMDIyNjg4MDB9', ''].join('.'); // gitleaks:allow

const VIEWPORT_WIDTHS = [320, 360, 375, 390, 414, 430, 600, 768, 820, 1024, 1280, 1440];

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server at ${url} timed out`);
}

async function measureBundles(distAssetsDir) {
  const names = await fs.readdir(distAssetsDir);
  const js = [];
  const css = [];
  const media = [];
  for (const name of names) {
    const buf = await fs.readFile(path.join(distAssetsDir, name));
    const entry = {
      name,
      bytes: buf.length,
      gzipBytes: gzipSync(buf).length,
    };
    if (name.endsWith('.js')) js.push(entry);
    else if (name.endsWith('.css')) css.push(entry);
    else media.push(entry);
  }
  const sortDesc = (arr) => arr.sort((a, b) => b.bytes - a.bytes);
  const sumBytes = (arr) => arr.reduce((s, x) => s + x.bytes, 0);
  const sumGzip = (arr) => arr.reduce((s, x) => s + x.gzipBytes, 0);
  return {
    jsTotalBytes: sumBytes(js),
    jsTotalGzipBytes: sumGzip(js),
    cssTotalBytes: sumBytes(css),
    cssTotalGzipBytes: sumGzip(css),
    mediaTotalBytes: sumBytes(media),
    entryJs: js.find((x) => /^index-.*\.js$/.test(x.name)) || null,
    entryCss: css.find((x) => /^index-.*\.css$/.test(x.name)) || null,
    topJsChunks: sortDesc([...js]).slice(0, 10),
    topCssChunks: sortDesc([...css]).slice(0, 8),
    topMediaAssets: sortDesc([...media]).slice(0, 8),
  };
}

async function installMocks(page, { authenticated = true, lang = 'en', theme = 'light', xssInject = false } = {}) {
  await page.addInitScript(({ token, authEnabled, langVal, themeVal }) => {
    window.localStorage.setItem('koupreng.lang', langVal);
    window.localStorage.setItem('koupreng.colorMode', themeVal);
    window.localStorage.setItem('theme', themeVal);
    if (authEnabled) {
      const auth = JSON.stringify({
        accessToken: token,
        tokenType: 'Bearer',
        expiresAt: '2100-01-01T00:00:00Z',
        user: { id: 7, fullName: 'Sokha Meas', email: 'sokha@example.test', role: 'USER' },
      });
      window.sessionStorage.setItem('koupreng.auth', auth);
      window.localStorage.setItem('koupreng.auth', auth);
    } else {
      window.sessionStorage.removeItem('koupreng.auth');
      window.localStorage.removeItem('koupreng.auth');
    }
  }, { token: TEST_TOKEN, authEnabled: authenticated, langVal: lang, themeVal: theme });

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const p = new URL(req.url()).pathname;
    const json = (data, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ data }) });

    if (p.endsWith('/i18n/messages')) return json({ messages: {} });
    if (p.endsWith('/users/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 7, fullName: 'Sokha Meas', email: 'sokha@example.test', role: 'USER', preferredLanguage: lang, colorMode: theme }),
      });
    }
    if (p.endsWith('/auth/me')) return json({ id: 7, fullName: 'Sokha Meas', email: 'sokha@example.test', role: 'USER' });
    if (p.endsWith('/users/profile')) return json({ id: 7, fullName: 'Sokha Meas', email: 'sokha@example.test', phone: '012 345 678', profileImage: '' });
    if (p === '/api/v1/templates' || p === '/api/v1/templates/public') {
      return json([
        { id: 4, code: 'khmer-celestial', slug: 'khmer-celestial', name: 'Khmer Celestial', category: 'TRADITIONAL', status: 'ACTIVE', price: 0, currency: 'USD', premium: false, thumbnailUrl: '/templates/event-essential.svg', supportedEventTypes: ['WEDDING'], supportedLanguages: ['KM', 'EN', 'BOTH'] },
        { id: 5, code: 'silk-heritage', slug: 'silk-heritage', name: 'Silk Heritage', category: 'LUXURY', status: 'ACTIVE', price: 29, currency: 'USD', premium: true, thumbnailUrl: '/templates/event-essential.svg', supportedEventTypes: ['WEDDING'], supportedLanguages: ['KM', 'EN', 'BOTH'] },
      ]);
    }
    if (p.startsWith('/api/v1/templates/recommendations')) return json([]);
    if (p.endsWith('/templates/paid')) return json([]);
    if (p.endsWith('/packages')) {
      return json([
        { id: 1, code: 'FREE', packageName: 'Free', price: 0, currency: 'USD', durationDays: 365, maxInvitations: 1, maxGuestsPerInvitation: 40, maxTeamMembers: 1 },
        { id: 2, code: 'PRO', packageName: 'Pro', price: 49, currency: 'USD', durationDays: 365, maxInvitations: 10, maxGuestsPerInvitation: 500, maxTeamMembers: 5, premiumTemplatesEnabled: true, qrCheckInEnabled: true, seatingEnabled: true, advancedAnalyticsEnabled: true, teamMembersEnabled: true },
      ]);
    }
    if (p.endsWith('/subscriptions/current')) return json(null);
    if (p.endsWith('/subscriptions') || p.endsWith('/me/payments')) return json([]);
    if (p.endsWith('/me/entitlements') || p.endsWith('/subscriptions/entitlements')) {
      return json({
        source: 'PRO_PACKAGE',
        packagePlan: { id: 2, code: 'PRO', packageName: 'Pro' },
        features: ['QR_INVITATIONS', 'QR_CHECK_IN', 'SEATING', 'ADVANCED_ANALYTICS', 'TEAM_MEMBERS'],
        quotas: { invitations: { used: 1, limit: 10 }, guests: { used: 2, limit: 500 }, teamMembers: { used: 1, limit: 5 } },
      });
    }
    const baseEvent = {
      id: 101,
      userId: 7,
      title: 'សិរីមង្គលការ សុផល & ចាន់ណារី',
      eventType: 'WEDDING',
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      slug: 'audit-event',
      groomName: 'សុផល',
      brideName: 'ចាន់ណារី',
      hostName: 'សុផល',
      partnerName: 'ចាន់ណារី',
      venueName: 'Sokha Phnom Penh Hotel',
      eventDate: '2027-11-28',
      eventTime: '17:00',
      templateId: 4,
      templateCode: 'khmer-celestial',
      languageMode: 'BOTH',
      updatedAt: '2026-11-26T08:00:00Z',
    };
    if (p.endsWith('/invitations/my')) return json([baseEvent]);
    if (p === '/api/v1/invitations/101' || p === '/api/v1/invitations/101/preview') return json(baseEvent);
    if (p === '/api/v1/invitations/101/access') {
      return json({
        owner: true,
        permissions: ['VIEW_EVENT', 'EDIT_EVENT', 'MANAGE_GUESTS', 'MANAGE_SEATING', 'MANAGE_CHECKIN', 'MANAGE_BUDGET', 'VIEW_REPORTS'],
        ownerFeatures: ['QR_INVITATIONS', 'QR_CHECK_IN', 'SEATING', 'ADVANCED_ANALYTICS', 'TEAM_MEMBERS'],
      });
    }
    if (p === '/api/v1/invitations/101/guests') {
      const payloadName = xssInject ? '<img src=x onerror="window.__xssFired=true">Dara' : 'Sokha Chan';
      return json([
        { id: 501, invitationId: 101, guestName: payloadName, phone: '012345678', seatCount: 2, guestGroup: 'Bride Side', sendStatus: 'SENT', rsvpStatus: 'ATTENDING' },
        { id: 502, invitationId: 101, guestName: 'ចាន់ ដារ៉ា', phone: '012999888', seatCount: 1, guestGroup: 'Family', sendStatus: 'PENDING', rsvpStatus: 'PENDING' },
      ]);
    }
    if (p === '/api/v1/invitations/101/budget') {
      return json({
        plannedTotalUsd: 12000,
        plannedTotalKhr: 48000000,
        spentTotalUsd: 4500,
        spentTotalKhr: 12000000,
        items: [
          { id: 1, category: 'VENUE', title: 'Grand Ballroom', plannedAmount: 4500, paidAmount: 4500, currency: 'USD', status: 'PAID' },
          { id: 2, category: 'CATERING', title: 'ម្ហូបការ', plannedAmount: 12000000, paidAmount: 6000000, currency: 'KHR', status: 'PARTIAL' },
        ],
      });
    }
    if (p === '/api/v1/invitations/101/budget-items' || p === '/api/v1/invitations/101/expenses') {
      return json([
        { id: 1, category: 'Venue & Transport', itemName: 'Grand Ballroom Rental', estimatedCost: 4500, actualCost: 4500, currency: 'USD', status: 'PAID', expenseDate: '2026-11-20', vendorName: 'Sokha Hotel' },
        { id: 2, category: 'Food & Catering', itemName: 'Khmer Ceremony Feast', estimatedCost: 12000000, actualCost: 6000000, currency: 'KHR', status: 'PENDING', expenseDate: '2026-11-21', vendorName: 'Mekong Catering' },
      ]);
    }
    if (p === '/api/v1/invitations/101/budget/summary') {
      return json({
        plannedTotalUsd: 4500,
        spentTotalUsd: 4500,
        plannedTotalKhr: 12000000,
        spentTotalKhr: 6000000,
      });
    }
    if (p.includes('/analytics')) {
      return json({
        from: '2026-11-01',
        to: '2026-11-27',
        timezone: 'Asia/Phnom_Penh',
        current: { guestRecords: 2, reservedSeats: 3, respondedRecords: 1, confirmedAttendees: 2, checkedInRecords: 0 },
        days: [{ date: '2026-11-27', guestRecordsCreated: 2, latestRsvpRecords: 1, attendingRecords: 1, declinedRecords: 0, maybeRecords: 0, activeCheckInRecords: 0 }],
      });
    }
    if (p === '/api/v1/notifications') {
      return json([{ id: 1, title: 'RSVP Confirmed', message: 'Guest confirmed attendance.', channel: 'TELEGRAM', status: 'DELIVERED', createdAt: '2026-11-27T08:00:00Z' }]);
    }
    if (p === '/api/v1/notifications/summary') return json({ unread: 1, sent: 4, delivered: 4, failed: 0 });
    if (p === '/api/v1/telegram/user/settings') return json({ available: true, connected: false });
    if (p.startsWith('/api/v1/public/invitations/audit-event')) {
      if (p.endsWith('/wishes')) {
        const msg = xssInject ? '<img src=x onerror="window.__xssFired=true">Wishing joy!' : 'សូមជូនពរគូស្វាមីភរិយាថ្មី!';
        return json([{ id: 1, guestName: 'Vireak', message: msg, createdAt: '2026-11-27T08:00:00Z' }]);
      }
      if (p.endsWith('/media')) return json({ coverImage: null, galleryImages: [] });
      return json({
        ...baseEvent,
        enabledSections: JSON.stringify({ story: true, schedule: true, venue: true, rsvp: true, wishes: true }),
        contentJson: JSON.stringify({
          messageText: 'សូមគោរពអញ្ជើញចូលរួមក្នុងពិធីមង្គលការរបស់យើងខ្ញុំ',
          schedule: [{ time: '17:00', title: 'ពិធីទទួលភ្ញៀវ / Guest Welcome' }],
        }),
      });
    }
    return json({});
  });
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });
  const bundles = await measureBundles(path.join(appDir, 'dist', 'assets'));
  const viteBin = path.resolve(appDir, 'node_modules/vite/bin/vite.js');
  const server = spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(portArg), '--strictPort'], {
    cwd: appDir,
    stdio: 'ignore',
    windowsHide: true,
  });

  try {
    await waitForServer(baseURL);
    const browser = await chromium.launch({ headless: true });

    // 1. 12-Viewport Responsive Overflow Sweep across 8 routes
    const responsiveRoutes = ['/', '/templates', '/login', '/app/events', '/app/events/101/guests', '/app/events/101/budget', '/app/events/101/reports', '/i/audit-event'];
    const responsiveMatrix = [];
    const overflowFailures = [];
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await installMocks(page, { authenticated: true, lang: 'km', theme: 'light' });
      for (const route of responsiveRoutes) {
        await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
        if (route === '/app/events/101/budget') {
          await page.waitForFunction(() => document.body.innerText.includes('Grand Ballroom Rental'));
        } else if (route === '/i/audit-event') {
          await page.locator('.kc-opening button').first().waitFor({ state: 'visible' });
        } else {
          await page.waitForTimeout(400);
        }
        const routeWidths = {};
        for (const width of VIEWPORT_WIDTHS) {
          await page.setViewportSize({ width, height: 900 });
          await page.waitForTimeout(80);
          const overflowX = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
          routeWidths[width] = overflowX;
          if (overflowX > 0) overflowFailures.push({ route, width, overflowX });
        }
        responsiveMatrix.push({ route, widths: routeWidths });
      }
      await context.close();
    }

    // 2. WCAG 2.2 AA Light/Dark + EN/KM Audit across 13 key states (including opened envelope, populated budget, and opened 359px mobile drawer)
    const a11yCases = [
      { id: '01-landing-light-en', route: '/', lang: 'en', theme: 'light', width: 1440 },
      { id: '02-landing-dark-km', route: '/', lang: 'km', theme: 'dark', width: 390 },
      { id: '03-templates-dark-en', route: '/templates', lang: 'en', theme: 'dark', width: 1440 },
      { id: '04-login-light-km', route: '/login', lang: 'km', theme: 'light', width: 390 },
      { id: '05-events-dark-km', route: '/app/events', lang: 'km', theme: 'dark', width: 1440 },
      { id: '06-guests-dark-en', route: '/app/events/101/guests', lang: 'en', theme: 'dark', width: 390 },
      { id: '07-budget-light-km', route: '/app/events/101/budget', lang: 'km', theme: 'light', width: 1440, waitText: 'Grand Ballroom Rental' },
      { id: '08-reports-dark-en', route: '/app/events/101/reports', lang: 'en', theme: 'dark', width: 1440 },
      { id: '09-packages-dark-en', route: '/app/packages', lang: 'en', theme: 'dark', width: 1440 },
      { id: '10-notifications-dark-km', route: '/app/notifications', lang: 'km', theme: 'dark', width: 390 },
      { id: '11-public-invite-opening-light-km', route: '/i/audit-event', lang: 'km', theme: 'light', width: 390 },
      { id: '12-public-invite-opened-light-km', route: '/i/audit-event', lang: 'km', theme: 'light', width: 390, openEnvelope: true },
      { id: '13-mobile-drawer-359-dark-km', route: '/app/events', lang: 'km', theme: 'dark', width: 359, openMobileDrawer: true },
    ];

    const a11yResults = [];
    for (const c of a11yCases) {
      const context = await browser.newContext({ viewport: { width: c.width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await installMocks(page, { authenticated: c.route.startsWith('/app'), lang: c.lang, theme: c.theme });
      await page.goto(`${baseURL}${c.route}`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      if (c.waitText) {
        await page.waitForFunction((txt) => document.body.innerText.includes(txt), c.waitText);
      } else {
        await page.waitForTimeout(700);
      }
      if (c.openEnvelope) {
        await page.locator('.kc-opening button').first().click();
        await page.waitForFunction(() => {
          const main = document.querySelector('.kc-main');
          return main && main.getAttribute('aria-hidden') !== 'true' && !main.hasAttribute('inert');
        });
        await page.waitForTimeout(300);
      }
      if (c.openMobileDrawer) {
        await page.locator('.host-hamburger-btn').click();
        await page.waitForFunction(() => {
          const drawer = document.getElementById('host-mobile-navigation');
          return drawer && drawer.classList.contains('open') && !drawer.hasAttribute('inert');
        });
        await page.waitForTimeout(200);
      }
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const diag = await page.evaluate(() => ({
        lang: document.documentElement.lang,
        theme: document.documentElement.getAttribute('data-color-mode') || 'light',
        overflowX: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
        h1Count: document.querySelectorAll('h1').length,
      }));
      const rawViolations = axe.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodeCount: v.nodes.length,
        targets: v.nodes.slice(0, 5).map((n) => n.target?.join(' ')),
        summary: v.nodes[0]?.failureSummary?.split('\n')[0] || '',
      }));
      await page.screenshot({ path: path.join(outDir, `${c.id}.png`) });
      a11yResults.push({ ...c, ...diag, violationCount: rawViolations.length, violations: rawViolations });
      await context.close();
    }

    // 3. PWA, Security & Auth Redirect Checks
    const securityChecks = {};
    {
      const ctxAnon = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const pAnon = await ctxAnon.newPage();
      await installMocks(pAnon, { authenticated: false, lang: 'en', theme: 'light' });
      await pAnon.goto(`${baseURL}/app/events`, { waitUntil: 'domcontentloaded' });
      await pAnon.waitForTimeout(500);
      securityChecks.unauthRedirectedToLogin = pAnon.url().includes('/login');
      const swCount = await pAnon.evaluate(async () => (await navigator.serviceWorker?.getRegistrations())?.length ?? 0);
      securityChecks.serviceWorkerCount = swCount;
      const manifestRes = await pAnon.evaluate(async () => {
        const res = await fetch('/manifest.webmanifest');
        return { ok: res.ok, status: res.status, body: await res.json() };
      });
      securityChecks.manifestValid = manifestRes.ok && Boolean(manifestRes.body?.name);
      await ctxAnon.close();

      const ctxXss = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const pXss = await ctxXss.newPage();
      await installMocks(pXss, { authenticated: true, lang: 'en', theme: 'light', xssInject: true });
      await pXss.goto(`${baseURL}/i/audit-event`, { waitUntil: 'domcontentloaded' });
      await pXss.waitForTimeout(500);
      securityChecks.xssNotExecutedOnPublicInvite = await pXss.evaluate(() => window.__xssFired === undefined);
      await ctxXss.close();
    }

    // 4. Lab Performance Telemetry (Chromium Localhost Preview — 1 warmup + 3 runs per key route)
    const perfRoutes = ['/', '/templates', '/app/events', '/i/audit-event'];
    const perfSummary = [];
    for (const route of perfRoutes) {
      const runs = [];
      for (let i = 0; i < 4; i++) {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
        const page = await ctx.newPage();
        await installMocks(page, { authenticated: route.startsWith('/app'), lang: 'en', theme: 'light' });
        await page.addInitScript(() => {
          window.__p26Perf = { cls: 0, lcp: 0, fcp: 0 };
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) window.__p26Perf.cls += entry.value;
            }
          }).observe({ type: 'layout-shift', buffered: true });
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) window.__p26Perf.lcp = entry.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') window.__p26Perf.fcp = entry.startTime;
            }
          }).observe({ type: 'paint', buffered: true });
        });
        const cdp = await ctx.newCDPSession(page);
        await cdp.send('Performance.enable');
        await page.goto(`${baseURL}${route}`, { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300);
        const m = await page.evaluate(() => {
          const nav = performance.getEntriesByType('navigation')[0];
          const res = performance.getEntriesByType('resource');
          const sumRes = (re) => res.filter((r) => re.test(r.name)).reduce((s, r) => s + (r.encodedBodySize || 0), 0);
          return {
            domContentLoadedMs: Math.round(nav?.domContentLoadedEventEnd || 0),
            loadMs: Math.round(nav?.loadEventEnd || 0),
            fcpMs: Math.round(window.__p26Perf.fcp || 0),
            lcpMs: Math.round(window.__p26Perf.lcp || 0),
            cls: Number((window.__p26Perf.cls || 0).toFixed(4)),
            jsTransferBytes: sumRes(/\.js(?:\?|$)/),
            cssTransferBytes: sumRes(/\.css(?:\?|$)/),
          };
        });
        const cdpMetrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
        if (i > 0) {
          runs.push({
            ...m,
            taskMs: Math.round((cdpMetrics.TaskDuration || 0) * 1000),
            scriptMs: Math.round((cdpMetrics.ScriptDuration || 0) * 1000),
            jsHeapUsedMB: Number(((cdpMetrics.JSHeapUsedSize || 0) / 1048576).toFixed(2)),
          });
        }
        await ctx.close();
      }
      const median = (k) => {
        const sorted = runs.map((r) => r[k]).sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)];
      };
      perfSummary.push({
        route,
        domContentLoadedMs: median('domContentLoadedMs'),
        loadMs: median('loadMs'),
        fcpMs: median('fcpMs'),
        lcpMs: median('lcpMs'),
        cls: median('cls'),
        jsTransferKb: Number((median('jsTransferBytes') / 1024).toFixed(1)),
        cssTransferKb: Number((median('cssTransferBytes') / 1024).toFixed(1)),
        taskMs: median('taskMs'),
        scriptMs: median('scriptMs'),
        jsHeapUsedMB: median('jsHeapUsedMB'),
      });
    }

    const report = {
      stage: stageArg,
      generatedAt: new Date().toISOString(),
      bundles,
      overflowFailureCount: overflowFailures.length,
      overflowFailures,
      responsiveMatrix,
      a11yResults,
      securityChecks,
      perfLabMethod: 'Local Vite preview Chromium headless, 1440x900, reduced-motion, 1 warmup + median of 3 runs (LAB DATA ONLY)',
      perfSummary,
    };

    await fs.writeFile(path.join(outDir, 'metrics.json'), JSON.stringify(report, null, 2));
    console.log(`Phase 26 [${stageArg}] overflowFailures=${overflowFailures.length}`);
    console.log('Overflow failures:', JSON.stringify(overflowFailures));
    for (const r of a11yResults) {
      console.log(`  ${r.id}: lang=${r.lang} theme=${r.theme} overflow=${r.overflowX}px h1=${r.h1Count} axeViolations=${r.violationCount} (${r.violations.map((v) => `${v.id}:${v.nodeCount}`).join(', ') || 'clean'})`);
    }
    console.log('Security/PWA:', JSON.stringify(securityChecks));
    console.log('Perf Lab Summary:', JSON.stringify(perfSummary, null, 2));
    await browser.close();
  } finally {
    server.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
