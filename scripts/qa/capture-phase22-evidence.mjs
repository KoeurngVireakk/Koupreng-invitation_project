import { chromium } from '../../apps/frontend-user/node_modules/playwright/index.mjs';
import AxeBuilder from '../../apps/frontend-user/node_modules/@axe-core/playwright/dist/index.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const stageArg = process.argv.find((arg) => arg.startsWith('--stage='))?.split('=')[1] || 'before';
const portArg = Number(process.argv.find((arg) => arg.startsWith('--port='))?.split('=')[1] || '4338');
const appDir = path.resolve(process.argv.find((arg) => arg.startsWith('--app-dir='))?.split('=')[1] || 'apps/frontend-user');
const outDir = path.resolve(
  process.argv.find((arg) => arg.startsWith('--out-dir='))?.split('=')[1] ||
    `docs/uxui/phase22-budget-analytics/evidence/${stageArg}`
);
const baseURL = `http://127.0.0.1:${portArg}`;
const TEST_TOKEN = ['eyJhbGciOiJub25lIn0', 'eyJleHAiOjQxMDIyNjg4MDB9', ''].join('.');

const SEED_EXPENSES = [
  { id: 1, name: 'Grand Ballroom Catering', itemName: 'Grand Ballroom Catering', category: 'Food & Catering', budget: 4500, estimatedCost: 4500, amount: 3000, actualCost: 3000, currency: 'USD', date: '2026-12-01', expenseDate: '2026-12-01', status: 'PENDING', vendorName: 'Chroy Changvar Kitchen' },
  { id: 2, name: 'Lotus Floral Arch', itemName: 'Lotus Floral Arch', category: 'Decor & Flowers', budget: 1200000, estimatedCost: 1400000, amount: 1500000, actualCost: 1500000, currency: 'KHR', date: '2026-11-28', expenseDate: '2026-11-28', status: 'PAID', vendorName: 'Phnom Penh Flora' },
];

const SEED_BUDGET = {
  totalBudget: 8000,
  currency: 'USD',
  items: [
    { id: 1, category: 'FOOD', itemName: 'Grand Ballroom Catering', vendorName: 'Chroy Changvar Kitchen', estimatedCost: 4500, actualCost: 3000, currency: 'USD', date: '2026-12-01' },
    { id: 2, category: 'DECOR', itemName: 'Lotus Floral Arch', vendorName: 'Phnom Penh Flora', estimatedCost: 1200000, actualCost: 1200000, currency: 'KHR', date: '2026-11-28' },
  ],
};

const SEED_GIFTS = [
  { id: 1, guestId: 501, name: 'ចាន់ សុផល', amount: 150, currency: 'USD', method: 'ABA QR', date: '2026-11-26', note: 'VIP envelope' },
  { id: 2, guestId: 502, name: 'កែវ សុភា', amount: 400000, currency: 'KHR', method: 'Cash', date: '2026-11-26', note: 'Reception' },
];

const SEED_ANALYTICS = {
  from: '2026-11-20',
  to: '2026-11-27',
  timezone: 'Asia/Phnom_Penh',
  current: { guestRecords: 48, reservedSeats: 92, respondedRecords: 36, confirmedAttendees: 74, checkedInRecords: 28 },
  days: [
    { date: '2026-11-20', guestRecordsCreated: 12, latestRsvpRecords: 6, attendingRecords: 5, declinedRecords: 1, maybeRecords: 0, activeCheckInRecords: 0 },
    { date: '2026-11-21', guestRecordsCreated: 10, latestRsvpRecords: 9, attendingRecords: 8, declinedRecords: 0, maybeRecords: 1, activeCheckInRecords: 0 },
    { date: '2026-11-22', guestRecordsCreated: 14, latestRsvpRecords: 11, attendingRecords: 9, declinedRecords: 2, maybeRecords: 0, activeCheckInRecords: 0 },
    { date: '2026-11-23', guestRecordsCreated: 12, latestRsvpRecords: 10, attendingRecords: 8, declinedRecords: 1, maybeRecords: 1, activeCheckInRecords: 28 },
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
      return json([{ id: 42, title: 'សិរីមង្គលការ សុផល & ចាន់ណារី', status: 'PUBLISHED', eventType: 'WEDDING', eventDate: '2026-12-20', slug: 'sophal-channary', templateCode: 'khmer-floral-gold' }]);
    }
    if (p === '/api/v1/invitations/42') {
      return json({ id: 42, title: 'សិរីមង្គលការ សុផល & ចាន់ណារី', status: 'PUBLISHED', eventType: 'WEDDING', eventDate: '2026-12-20', groomName: 'សុផល', brideName: 'ចាន់ណារី', slug: 'sophal-channary', templateCode: 'khmer-floral-gold' });
    }
    if (p === '/api/v1/invitations/42/access') {
      return json({ owner: true, permissions: ['VIEW_EVENT', 'EDIT_EVENT', 'MANAGE_GUESTS', 'MANAGE_SEATING', 'MANAGE_CHECKIN', 'VIEW_REPORTS'], ownerFeatures: ['QR_INVITATIONS', 'QR_CHECK_IN', 'ADVANCED_ANALYTICS'] });
    }
    if (p === '/api/v1/invitations/42/expenses' || p === '/api/v1/invitations/42/budget/items' || p === '/api/v1/invitations/42/budget-items') return json(SEED_EXPENSES);
    if (p === '/api/v1/invitations/42/budget') return json(SEED_BUDGET);
    if (p === '/api/v1/invitations/42/gifts') return json(SEED_GIFTS);
    if (p === '/api/v1/invitations/42/guests') return json([{ id: 501, guestName: 'ចាន់ សុផល', sideType: 'GROOM_SIDE' }, { id: 502, guestName: 'កែវ សុភា', sideType: 'BRIDE_SIDE' }]);
    if (p === '/api/v1/invitations/42/rsvps') return json([{ id: 1, responseStatus: 'ATTENDING', attendeeCount: 2 }]);
    if (p === '/api/v1/invitations/42/check-in/list') return json([{ id: 901, guestId: 501, active: true }]);
    if (p === '/api/v1/invitations/42/analytics') return json(SEED_ANALYTICS);
    if (p === '/api/v1/invitations/42/reports/guests') return json({ totalGuests: 48, sent: 44, opened: 39 });
    if (p === '/api/v1/invitations/42/reports/rsvp') return json({ yesCount: 30, attendeeTotal: 74, pendingCount: 12 });
    return json({});
  });

  return { context, page };
}

const CASES = [
  { name: '01-expenses-budget-light-en-1440.png', route: '/app/events/42/budget', width: 1440, height: 900, lang: 'en', theme: 'light' },
  { name: '02-expenses-budget-obsidian-km-1440.png', route: '/app/events/42/budget', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '03-expenses-budget-mobile-390.png', route: '/app/events/42/budget', width: 390, height: 844, lang: 'en', theme: 'dark' },
  { name: '04-attendance-analytics-light-en-1440.png', route: '/app/events/42/analytics', width: 1440, height: 900, lang: 'en', theme: 'light' },
  { name: '05-attendance-analytics-obsidian-km-1440.png', route: '/app/events/42/analytics', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '06-financial-report-light-en-1440.png', route: '/app/events/42/reports', width: 1440, height: 900, lang: 'en', theme: 'light' },
  { name: '07-financial-report-obsidian-km-1440.png', route: '/app/events/42/reports', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '08-financial-report-mobile-390.png', route: '/app/events/42/reports', width: 390, height: 844, lang: 'en', theme: 'dark' },
  { name: '09-financial-report-a4-preview-dark-1440.png', route: '/app/events/42/reports', width: 1440, height: 900, lang: 'en', theme: 'dark', preview: true },
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
    const metrics = [];

    for (const c of CASES) {
      const { context, page } = await openContext(browser, c);
      await page.goto(`${baseURL}${c.route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      if (c.preview) {
        await page.locator('.report-preview-btn').click();
        await page.waitForSelector('.financial-report-page.is-print-preview .report-sheet-simulation');
        await page.waitForTimeout(300);
      }

      const layout = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          overflowX: Math.max(0, doc.scrollWidth - window.innerWidth),
          theme: doc.getAttribute('data-color-mode') || 'light',
          lang: doc.lang || 'unknown',
        };
      });

      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const nonHeaderViolations = axe.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.filter((n) => !String(n.target?.[0] || '').includes('button[aria-haspopup="menu"]')).length,
        targets: v.nodes.map((n) => n.target?.[0]),
      })).filter((v) => v.nodes > 0);

      await page.screenshot({ path: path.join(outDir, c.name) });
      metrics.push({ name: c.name, route: c.route, ...layout, axeViolations: nonHeaderViolations, totalAxeRaw: axe.violations.length });
      await context.close();
    }

    await fs.writeFile(path.join(outDir, 'metrics.json'), JSON.stringify(metrics, null, 2));
    console.log(`Captured ${metrics.length} screenshots -> ${outDir}`);
    for (const m of metrics) {
      console.log(`  ${m.name}: overflow=${m.overflowX}px, axe_non_header=${m.axeViolations.length} (${m.axeViolations.map(v => `${v.id}:${v.nodes}`).join(', ') || 'clean'})`);
    }
    await browser.close();
  } finally {
    server.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
