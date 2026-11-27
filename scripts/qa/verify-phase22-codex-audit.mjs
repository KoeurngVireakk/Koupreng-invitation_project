import { chromium } from '../../apps/frontend-user/node_modules/playwright/index.mjs';
import AxeBuilder from '../../apps/frontend-user/node_modules/@axe-core/playwright/dist/index.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const portArg = Number(process.argv.find((arg) => arg.startsWith('--port='))?.split('=')[1] || '4341');
const appDir = path.resolve('apps/frontend-user');
const outDir = path.resolve('docs/uxui/phase22-budget-analytics/evidence/codex-audit');
const baseURL = `http://127.0.0.1:${portArg}`;
const TEST_TOKEN = ['eyJhbGciOiJub25lIn0', 'eyJleHAiOjQxMDIyNjg4MDB9', ''].join('.');

const SEED_EXPENSES = [
  { id: 1, name: '=FORMULA("bad"), Catering', itemName: '=FORMULA("bad"), Catering', category: 'Food & Catering', budget: 4500.1, estimatedCost: 4500.1, amount: 3000.2, actualCost: 3000.2, currency: 'USD', date: '2026-12-01', expenseDate: '2026-12-01', status: 'PENDING', vendorName: 'Chroy Changvar Kitchen' },
  { id: 2, name: 'Lotus Floral Arch', itemName: 'Lotus Floral Arch', category: 'Decor & Flowers', budget: 1200000, estimatedCost: 1200000, amount: 1500000, actualCost: 1500000, currency: 'KHR', date: '2026-11-28', expenseDate: '2026-11-28', status: 'PAID', vendorName: '@Flora' },
];

const SEED_BUDGET = {
  totalBudget: 8000,
  currency: 'USD',
  items: SEED_EXPENSES,
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
    acceptDownloads: true,
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
      if (c.mode === 'report-error') return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Access denied' }) });
      return json({ id: 42, title: 'សិរីមង្គលការ សុផល & ចាន់ណារី', status: 'PUBLISHED', eventType: 'WEDDING', eventDate: '2026-12-20', groomName: 'សុផល', brideName: 'ចាន់ណារី', slug: 'sophal-channary', templateCode: 'khmer-floral-gold' });
    }
    if (p === '/api/v1/invitations/42/access') {
      return json({ owner: true, permissions: ['VIEW_EVENT', 'EDIT_EVENT', 'MANAGE_GUESTS', 'MANAGE_SEATING', 'MANAGE_CHECKIN', 'VIEW_REPORTS'], ownerFeatures: ['QR_INVITATIONS', 'QR_CHECK_IN', 'ADVANCED_ANALYTICS'] });
    }
    if (p === '/api/v1/invitations/42/expenses' || p === '/api/v1/invitations/42/budget/items' || p === '/api/v1/invitations/42/budget-items') {
      return json(c.mode === 'empty' ? [] : SEED_EXPENSES);
    }
    if (p === '/api/v1/invitations/42/budget') return json(c.mode === 'empty' ? { totalBudget: 0, currency: 'USD', items: [] } : SEED_BUDGET);
    if (p === '/api/v1/invitations/42/gifts') return json(c.mode === 'empty' ? [] : SEED_GIFTS);
    if (p === '/api/v1/invitations/42/guests') return json([]);
    if (p === '/api/v1/invitations/42/rsvps') return json([]);
    if (p === '/api/v1/invitations/42/check-in/list') return json([]);
    if (p === '/api/v1/invitations/42/analytics') {
      if (c.mode === 'analytics-empty') return json({ ...SEED_ANALYTICS, current: { guestRecords: 0, reservedSeats: 0, respondedRecords: 0, confirmedAttendees: 0, checkedInRecords: 0 }, days: [] });
      return json(SEED_ANALYTICS);
    }
    if (p === '/api/v1/invitations/42/reports/guests') return json({ totalGuests: 48, sent: 44, opened: 39 });
    if (p === '/api/v1/invitations/42/reports/rsvp') return json({ yesCount: 30, attendeeTotal: 74, pendingCount: 12 });
    return json({});
  });

  return { context, page };
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const server = spawn(process.execPath, [path.join(appDir, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(portArg), '--host', '127.0.0.1'], {
    cwd: appDir,
    stdio: 'ignore',
  });
  try {
    await waitForServer(baseURL);
    const browser = await chromium.launch();
    const cases = [
      { name: '01-expenses-light-mobile-390.png', route: '/app/events/42/budget', width: 390, height: 844, lang: 'en', theme: 'light' },
      { name: '02-financial-report-light-mobile-390.png', route: '/app/events/42/reports', width: 390, height: 844, lang: 'en', theme: 'light' },
      { name: '03-expenses-khr-filtered-csv-desktop.png', route: '/app/events/42/budget', width: 1440, height: 900, lang: 'en', theme: 'light', interactive: 'khr-filter-csv' },
      { name: '04-analytics-inverted-date-alert.png', route: '/app/events/42/analytics', width: 1440, height: 900, lang: 'en', theme: 'dark', interactive: 'inverted-date' },
      { name: '05-analytics-empty-zero-denominator.png', route: '/app/events/42/analytics', width: 1440, height: 900, lang: 'en', theme: 'light', mode: 'analytics-empty' },
      { name: '06-financial-report-error-403.png', route: '/app/events/42/reports', width: 1440, height: 900, lang: 'km', theme: 'dark', mode: 'report-error' },
      { name: '07-financial-report-a4-preview-dark-1440.png', route: '/app/events/42/reports', width: 1440, height: 900, lang: 'en', theme: 'dark', interactive: 'a4-preview' },
      { name: '08-financial-report-a4-preview-light-1440.png', route: '/app/events/42/reports', width: 1440, height: 900, lang: 'en', theme: 'light', interactive: 'a4-preview' },
    ];
    const metrics = [];
    for (const c of cases) {
      const { context, page } = await openContext(browser, c);
      await page.goto(`${baseURL}${c.route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(450);

      let extra = {};
      if (c.interactive === 'khr-filter-csv') {
        await page.selectOption('select.exp-currency-filter', 'KHR');
        await page.waitForTimeout(200);
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          page.getByRole('button', { name: /Export CSV/i }).click(),
        ]);
        const dlPath = await download.path();
        const csvContent = await fs.readFile(dlPath, 'utf8');
        extra = {
          downloadedFilename: download.suggestedFilename(),
          hasBom: csvContent.startsWith('\uFEFF'),
          hasKhrSubtotal: csvContent.includes('Subtotal (KHR)'),
          excludesUsdRow: !csvContent.includes('Catering'),
          escapesFormulaAt: csvContent.includes("'@Flora"),
        };
      }
      if (c.interactive === 'inverted-date') {
        const fromInput = page.getByLabel('From', { exact: true });
        const toInput = page.getByLabel('To', { exact: true });
        await fromInput.fill('2026-12-10');
        await toInput.fill('2026-12-01');
        await page.getByRole('button', { name: 'Apply dates' }).click();
        await page.waitForTimeout(200);
        const alertText = await page.getByRole('alert').textContent();
        extra = { alertText };
      }
      if (c.interactive === 'a4-preview') {
        await page.locator('.report-preview-btn').click();
        await page.waitForSelector('.financial-report-page.is-print-preview .report-sheet-simulation');
        await page.waitForTimeout(300);
        extra = await page.evaluate(() => {
          const root = document.querySelector('.financial-report-page.is-print-preview');
          const sheet = root.querySelector('.report-sheet-simulation');
          const rows = sheet.querySelectorAll('.report-table tbody tr');
          return {
            reportInk: getComputedStyle(root).getPropertyValue('--report-ink').trim(),
            reportPaper: getComputedStyle(root).getPropertyValue('--report-paper').trim(),
            sheetBg: getComputedStyle(sheet).backgroundColor,
            h1Color: getComputedStyle(sheet.querySelector('.financial-report-header h1')).color,
            cardBg: getComputedStyle(sheet.querySelector('.report-summary-card')).backgroundColor,
            sectionBg: getComputedStyle(sheet.querySelector('.report-section')).backgroundColor,
            incomeColor: getComputedStyle(sheet.querySelector('.report-amount--income')).color,
            trEvenBg: getComputedStyle(rows[1]).backgroundColor,
            tdEvenColor: getComputedStyle(rows[1].querySelector('td')).color,
          };
        });
      }

      const overflowX = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).disableRules(['region']).exclude('.host-header').analyze();
      const nonHeaderViolations = axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
      await page.screenshot({ path: path.join(outDir, c.name) });
      metrics.push({ name: c.name, route: c.route, overflowX, axeViolations: nonHeaderViolations, extra });
      await context.close();
    }
    await browser.close();
    await fs.writeFile(path.join(outDir, 'metrics.json'), JSON.stringify(metrics, null, 2));
    for (const m of metrics) {
      const count = m.axeViolations.reduce((n, v) => n + v.nodes, 0);
      console.log(`  ${m.name}: overflow=${m.overflowX}px, axe_non_header=${count} ${JSON.stringify(m.extra)}`);
      if (m.overflowX > 0 || count > 0) process.exitCode = 1;
    }
  } finally {
    server.kill();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
