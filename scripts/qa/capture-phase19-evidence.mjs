import { chromium } from '../../apps/frontend-user/node_modules/playwright/index.mjs';
import AxeBuilder from '../../apps/frontend-user/node_modules/@axe-core/playwright/dist/index.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const stageArg = process.argv.find((arg) => arg.startsWith('--stage='))?.split('=')[1] || 'before';
const portArg = Number(process.argv.find((arg) => arg.startsWith('--port='))?.split('=')[1] || '4333');
const appDir = path.resolve(process.argv.find((arg) => arg.startsWith('--app-dir='))?.split('=')[1] || 'apps/frontend-user');
const outDir = path.resolve(
  process.argv.find((arg) => arg.startsWith('--out-dir='))?.split('=')[1] ||
    `docs/uxui/phase19-seating-floor-plan/evidence/${stageArg}`
);
const baseURL = `http://127.0.0.1:${portArg}`;
const TEST_TOKEN = ['eyJhbGciOiJub25lIn0', 'eyJleHAiOjQxMDIyNjg4MDB9', ''].join('.');

const SEED_TABLES = [
  { id: 1, tableName: 'VIP 1 (គ្រួសារខាងប្រុស)', tableLabel: 'Family Front Row', capacity: 10, assignedSeats: 4, remainingSeats: 6, sortOrder: 1, notes: '{"x":25,"y":28}' },
  { id: 2, tableName: 'VIP 2 (គ្រួសារខាងស្រី)', tableLabel: 'Family Front Row', capacity: 10, assignedSeats: 10, remainingSeats: 0, sortOrder: 2, notes: '{"x":75,"y":28}' },
  { id: 3, tableName: 'Table 3 (មិត្តភក្តិ)', tableLabel: 'University Friends', capacity: 8, assignedSeats: 0, remainingSeats: 8, sortOrder: 3, notes: '{"x":25,"y":62}' },
];

const SEED_PLAN = {
  tables: SEED_TABLES,
  assignments: [
    { id: 11, guestId: 501, tableId: 1, guestName: 'ចាន់ សុផល', seatCount: 2, seatLabel: 'A1-A2', guestGroup: 'Groom Side' },
    { id: 12, guestId: 502, tableId: 1, guestName: 'ហេង ធីតា', seatCount: 2, seatLabel: 'A3-A4', guestGroup: 'Groom Side' },
    { id: 13, guestId: 503, tableId: 2, guestName: 'Meas Sophea', seatCount: 10, seatLabel: 'All VIP 2', guestGroup: 'Bride Side' },
  ],
  unassignedGuests: [
    { id: 504, guestName: 'Dara Heng', seatCount: 2 },
    { id: 505, guestName: 'Sokunthy Keo', seatCount: 1 },
  ],
};

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
    if (p.endsWith('/invitations/my')) {
      return json([{ id: 42, title: 'សិរីមង្គលការ សុផល & ចាន់ណារី', status: 'PUBLISHED', slug: 'sophal-channary', templateCode: 'khmer-floral-gold' }]);
    }
    if (p === '/api/v1/invitations/42') {
      return json({ id: 42, title: 'សិរីមង្គលការ សុផល & ចាន់ណារី', status: 'PUBLISHED', slug: 'sophal-channary', templateCode: 'khmer-floral-gold' });
    }
    if (p === '/api/v1/invitations/42/access') {
      return json({ owner: true, permissions: ['VIEW_EVENT', 'EDIT_EVENT', 'MANAGE_GUESTS', 'MANAGE_SEATING', 'MANAGE_CHECKIN'], ownerFeatures: ['QR_INVITATIONS'] });
    }
    if (p === '/api/v1/invitations/42/seating') return json(c.emptyMode ? { tables: [], assignments: [], unassignedGuests: [] } : SEED_PLAN);
    if (p === '/api/v1/invitations/42/seating/summary') {
      return json(c.emptyMode ? { totalTables: 0, totalCapacity: 0, assignedSeats: 0 } : { totalTables: 3, totalCapacity: 28, assignedSeats: 14 });
    }
    if (p === '/api/v1/invitations/42/seating/layout') {
      return json({ eventId: 42, version: 1, data: { schemaVersion: 1, positions: { 1: { x: 25, y: 28 }, 2: { x: 75, y: 28 }, 3: { x: 25, y: 62 } }, venue: { stage: { x: 50, y: 9 }, entrance: { x: 50, y: 92 }, walkway: { x: 50, y: 51, orientation: 'vertical', enabled: true } } } });
    }
    return json({});
  });

  return { context, page };
}

const CASES = [
  { name: '01-seating-list-light-en-1440.png', route: '/app/events/42/seating', width: 1440, height: 900, lang: 'en', theme: 'light' },
  { name: '02-seating-list-obsidian-km-1440.png', route: '/app/events/42/seating', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '03-seating-tablet-dark-768.png', route: '/app/events/42/seating', width: 768, height: 1024, lang: 'en', theme: 'dark' },
  { name: '04-seating-mobile-guests-km-390.png', route: '/app/events/42/seating', width: 390, height: 844, lang: 'km', theme: 'light', clickGuestTab: true },
  { name: '05-seating-floorplan-light-1440.png', route: '/app/events/42/seating', width: 1440, height: 900, lang: 'en', theme: 'light', openPlan: true },
  { name: '06-seating-floorplan-obsidian-1440.png', route: '/app/events/42/seating', width: 1440, height: 900, lang: 'en', theme: 'dark', openPlan: true },
  { name: '07-seating-floorplan-mobile-390.png', route: '/app/events/42/seating', width: 390, height: 844, lang: 'en', theme: 'dark', openPlan: true },
  { name: '08-seating-empty-obsidian-390.png', route: '/app/events/42/seating', width: 390, height: 844, lang: 'km', theme: 'dark', emptyMode: true },
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
      await page.waitForTimeout(350);

      if (c.clickGuestTab) {
        await page.locator('.seating-mobile-tabs button').nth(1).click().catch(() => {});
        await page.waitForTimeout(250);
      }
      if (c.openPlan) {
        const mobilePlanBtn = page.locator('.seating-mobile-tabs button').nth(2);
        if (await mobilePlanBtn.isVisible().catch(() => false)) {
          await mobilePlanBtn.click().catch(() => {});
        } else {
          await page.getByTestId('tab-floor-plan').click().catch(() => {});
        }
        await page.waitForTimeout(350);
      }

      const metrics = await page.evaluate(() => ({
        url: location.pathname,
        innerWidth: window.innerWidth,
        overflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
        colorMode: document.documentElement.dataset.colorMode || 'light',
        bodyBg: getComputedStyle(document.body).backgroundColor,
      }));
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      await page.screenshot({ path: path.join(outDir, c.name), fullPage: true });

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
