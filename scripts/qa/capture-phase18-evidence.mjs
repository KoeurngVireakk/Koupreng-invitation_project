import { chromium } from '../../apps/frontend-user/node_modules/playwright/index.mjs';
import AxeBuilder from '../../apps/frontend-user/node_modules/@axe-core/playwright/dist/index.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const stageArg = process.argv.find((arg) => arg.startsWith('--stage='))?.split('=')[1] || 'before';
const portArg = Number(process.argv.find((arg) => arg.startsWith('--port='))?.split('=')[1] || '4332');
const appDir = path.resolve(process.argv.find((arg) => arg.startsWith('--app-dir='))?.split('=')[1] || 'apps/frontend-user');
const outDir = path.resolve(
  process.argv.find((arg) => arg.startsWith('--out-dir='))?.split('=')[1] ||
    `docs/uxui/phase18-rsvp-lifecycle/evidence/${stageArg}`
);
const baseURL = `http://127.0.0.1:${portArg}`;
const TEST_TOKEN = ['eyJhbGciOiJub25lIn0', 'eyJleHAiOjQxMDIyNjg4MDB9', ''].join('.');

const SEED_INVITATION = {
  id: 42,
  title: 'សិរីមង្គលការ សុផល & ចាន់ណារី',
  groomName: 'Sok Sophal',
  brideName: 'Channary',
  eventDate: '2026-12-20',
  venueName: 'Koh Pich Hall A',
  status: 'PUBLISHED',
  slug: 'sophal-channary',
  templateCode: 'khmer-floral-gold',
  languageMode: 'EN',
  showPublicWishes: true,
  rsvpDeadline: '2026-12-15',
  maxGuestsPerInvite: 4,
};

const SEED_RSVPS = [
  { id: 1, guestId: 501, guestName: 'ចាន់ សុផល', phone: '012 345 678', responseStatus: 'ATTENDING', attendeeCount: 2, wish: 'សូមជូនពរគូស្វាមីភរិយាថ្មី មានសុភមង្គលជារៀងរហូត!', respondedAt: '2026-11-20T09:00:00Z' },
  { id: 2, guestId: 503, guestName: 'Meas Sophea', phone: '070 445 566', responseStatus: 'MAYBE', attendeeCount: 2, wish: 'Will confirm flight soon, warmest congratulations!', respondedAt: '2026-11-21T10:30:00Z' },
  { id: 3, guestId: 504, guestName: 'Dara Heng', phone: '011 889 900', responseStatus: 'NOT_ATTENDING', attendeeCount: 0, wish: 'Sending love from Siem Reap!', respondedAt: '2026-11-22T08:15:00Z' },
];

const SEED_GUESTS = [
  { id: 501, guestName: 'ចាន់ សុផល', phone: '012 345 678', seatCount: 2 },
  { id: 502, guestName: 'Heng Thida', phone: '085 221 144', seatCount: 1 },
  { id: 503, guestName: 'Meas Sophea', phone: '070 445 566', seatCount: 2 },
  { id: 504, guestName: 'Dara Heng', phone: '011 889 900', seatCount: 1 },
];

const SEED_WISHES = [
  { id: 'w-1', guestName: 'ចាន់ សុផល', message: 'សូមជូនពរគូស្វាមីភរិយាថ្មី មានសុភមង្គលជារៀងរហូត!', createdAt: '2026-11-20T09:00:00Z' },
  { id: 'w-2', guestName: 'Meas Sophea', message: 'Wishing you a lifetime of joy and harmony!', createdAt: '2026-11-21T10:30:00Z' },
];

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

async function openContext(browser, c) {
  const context = await browser.newContext({
    viewport: { width: c.width || 1440, height: c.height || 900 },
    reducedMotion: c.reducedMotion || 'no-preference',
  });
  const page = await context.newPage();
  await page.addInitScript(({ token, lang, theme }) => {
    window.localStorage.setItem('koupreng.lang', lang);
    window.localStorage.setItem('koupreng.colorMode', theme);
    window.localStorage.setItem('theme', theme);
    const auth = JSON.stringify({
      accessToken: token,
      tokenType: 'Bearer',
      expiresAt: '2100-01-01T00:00:00Z',
      user: { id: 7, fullName: 'Sokha Meas', email: 'sokha@example.test', role: 'USER' },
    });
    window.sessionStorage.setItem('koupreng.auth', auth);
    window.localStorage.setItem('koupreng.auth', auth);
  }, { token: TEST_TOKEN, lang: c.lang || 'en', theme: c.theme || 'light' });

  await page.route('**/api/**', async (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (data, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ data }) });

    if (p.endsWith('/i18n/messages')) return json({ messages: {} });
    if (p.endsWith('/auth/me') || p.endsWith('/users/me')) return json({ id: 7, fullName: 'Sokha Meas', email: 'sokha@example.test', role: 'USER' });
    if (p.endsWith('/invitations/my')) return json([SEED_INVITATION]);
    if (p === '/api/v1/invitations/42') return json(SEED_INVITATION);
    if (p === '/api/v1/invitations/42/access') {
      return json({ owner: true, permissions: ['VIEW_EVENT', 'EDIT_EVENT', 'MANAGE_GUESTS', 'MANAGE_CHECKIN'], ownerFeatures: ['QR_INVITATIONS'] });
    }
    if (p === '/api/v1/invitations/42/rsvps') return json(SEED_RSVPS);
    if (p === '/api/v1/invitations/42/rsvps/summary') {
      return json({ attending: 1, notAttending: 1, pending: 1, totalAttendeeCount: 2 });
    }
    if (p === '/api/v1/invitations/42/guests') return json(SEED_GUESTS);
    if (p === '/api/v1/invitations/42/wishes') return json(SEED_WISHES);
    if (p.startsWith('/api/v1/public/invitations/sophal-channary')) {
      if (p.endsWith('/guest-view')) {
        return json({
          guestName: 'ចាន់ សុផល',
          rsvpStatus: 'ATTENDING',
          seatCount: 2,
          tableName: 'VIP Table 1',
          seatNumber: 'A2',
        });
      }
      if (p.endsWith('/wishes')) return json([]);
      return json(SEED_INVITATION);
    }
    return json({});
  });

  return { context, page };
}

const CASES = [
  { name: '01-rsvp-dashboard-light-en-1440.png', route: '/app/events/42/rsvp', width: 1440, height: 900, lang: 'en', theme: 'light' },
  { name: '02-rsvp-dashboard-obsidian-km-1440.png', route: '/app/events/42/rsvp', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '03-rsvp-dashboard-mobile-dark-390.png', route: '/app/events/42/rsvp', width: 390, height: 844, lang: 'en', theme: 'dark' },
  { name: '04-rsvp-wishes-wall-obsidian-1440.png', route: '/app/events/42/rsvp', width: 1440, height: 900, lang: 'en', theme: 'dark', openWishesWall: true },
  { name: '05-wishes-page-obsidian-en-1440.png', route: '/app/events/42/wishes', width: 1440, height: 900, lang: 'en', theme: 'dark' },
  { name: '06-wishes-page-mobile-km-390.png', route: '/app/events/42/wishes', width: 390, height: 844, lang: 'km', theme: 'light' },
  { name: '07-public-rsvp-general-1440.png', route: '/i/sophal-channary', width: 1440, height: 900, lang: 'en', theme: 'light', scrollToRsvp: true },
  { name: '08-public-rsvp-mobile-390.png', route: '/i/sophal-channary', width: 390, height: 844, lang: 'km', theme: 'light', scrollToRsvp: true },
  { name: '09-public-rsvp-qr-pass-1440.png', route: '/i/sophal-channary?token=tok-responded', width: 1440, height: 900, lang: 'en', theme: 'light', scrollToRsvp: true },
];

async function run() {
  await fs.mkdir(outDir, { recursive: true });
  const viteBin = path.resolve(appDir, 'node_modules/vite/bin/vite.js');
  const server = spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(portArg), '--strictPort'], {
    cwd: appDir,
    stdio: 'ignore',
    windowsHide: true,
  });

  try {
    await waitForServer(baseURL);
    const browser = await chromium.launch({ headless: true });
    const results = [];
    for (const c of CASES) {
      const { context, page } = await openContext(browser, c);
      await page.goto(`${baseURL}${c.route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(450);

      if (c.openWishesWall) {
        await page.locator('.rsvp-kpi-card.is-wishes').first().click().catch(() => {});
        await page.waitForTimeout(300);
      }
      if (c.scrollToRsvp) {
        const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Open our invitation"), button:has-text("រំលង"), button:has-text("បើកសំបុត្រអញ្ជើញ")').first();
        if (await skipBtn.isVisible().catch(() => false)) {
          await skipBtn.click().catch(() => {});
          await page.waitForTimeout(550);
        }
        await page.locator('.pub-rsvp-live, #rsvp-section').first().scrollIntoViewIfNeeded().catch(() => {});
        await page.waitForTimeout(450);
      }

      const metrics = await page.evaluate(() => ({
        url: location.pathname + location.search,
        innerWidth: window.innerWidth,
        overflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
        colorMode: document.documentElement.dataset.colorMode || document.documentElement.dataset.uiTheme || 'light',
        bodyBg: getComputedStyle(document.body).backgroundColor,
      }));
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      await page.screenshot({ path: path.join(outDir, c.name), fullPage: Boolean(c.openWishesWall || !c.scrollToRsvp) });

      results.push({
        name: c.name,
        stage: stageArg,
        metrics,
        axeViolations: axe.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
          targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
        })),
      });
      console.log(`[${stageArg}] ${c.name}: overflow=${metrics.overflowPx}px axe=${axe.violations.length} bg=${metrics.bodyBg}`);
      await context.close();
    }
    await browser.close();
    await fs.writeFile(path.join(outDir, 'metrics.json'), JSON.stringify({ stage: stageArg, capturedAt: new Date().toISOString(), results }, null, 2));
  } finally {
    server.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
