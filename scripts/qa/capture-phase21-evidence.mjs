import { chromium } from '../../apps/frontend-user/node_modules/playwright/index.mjs';
import AxeBuilder from '../../apps/frontend-user/node_modules/@axe-core/playwright/dist/index.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const stageArg = process.argv.find((arg) => arg.startsWith('--stage='))?.split('=')[1] || 'before';
const portArg = Number(process.argv.find((arg) => arg.startsWith('--port='))?.split('=')[1] || '4336');
const appDir = path.resolve(process.argv.find((arg) => arg.startsWith('--app-dir='))?.split('=')[1] || 'apps/frontend-user');
const outDir = path.resolve(
  process.argv.find((arg) => arg.startsWith('--out-dir='))?.split('=')[1] ||
    `docs/uxui/phase21-gifts-payments/evidence/${stageArg}`
);
const baseURL = `http://127.0.0.1:${portArg}`;
const TEST_TOKEN = ['eyJhbGciOiJub25lIn0', 'eyJleHAiOjQxMDIyNjg4MDB9', ''].join('.');

const SEED_ORDER_PENDING = {
  orderCode: 'ORD-2026-PENDING',
  templateId: 12,
  templateName: 'Khmer Floral Gold',
  packageName: 'Premium',
  amount: 15,
  currency: 'USD',
  status: 'QR_CREATED',
  paymentLink: 'https://pay.ababank.com/mock-static-link?ref=ORD-2026-PENDING',
  transactionId: 'TRX-PENDING-001',
  expiresAt: '2099-12-31T23:59:59Z',
};

const SEED_ORDER_PAID = {
  orderCode: 'ORD-2026-PAID',
  receiptNumber: 'RCP-2026-0088',
  templateId: 12,
  templateName: 'Khmer Floral Gold',
  itemName: 'Khmer Floral Gold Template License',
  packageName: 'Premium',
  amount: 15,
  paidAmount: 15,
  currency: 'USD',
  status: 'PAID',
  provider: 'ABA PayWay Merchant Alert',
  customerName: 'Sokha Meas',
  customerEmail: 'sokha@example.test',
  paidAt: '2026-11-26T09:15:00Z',
  issuedAt: '2026-11-26T09:15:02Z',
  createdAt: '2026-11-26T09:12:00Z',
};

const SEED_GIFTS = [
  { id: 1, guestId: 501, name: 'ចាន់ សុផល', amount: 100, currency: 'USD', method: 'ABA Transfer', date: '2026-11-26', note: 'Owner-recorded gift' },
  { id: 2, guestId: 502, name: 'កែវ សុភា', amount: 200000, currency: 'KHR', method: 'Cash', date: '2026-11-26', note: 'Reception envelope' },
  { id: 3, guestId: null, name: 'Heng Dara', amount: 50, currency: 'USD', method: 'Wing', date: '2026-11-25', note: 'Friend contribution' },
];

const SEED_PACKAGES = [
  { id: 1, code: 'FREE', packageName: 'Starter Free', description: 'Essential tools for small gatherings', price: 0, currency: 'USD', billingInterval: 'ONE_TIME', maxInvitations: 1, maxGuestsPerInvitation: 50 },
  { id: 2, code: 'PRO', packageName: 'Royal Pro', description: 'Full digital invitations, QR check-in & seating planner', price: 29, currency: 'USD', billingInterval: 'YEARLY', durationDays: 365, maxInvitations: 5, maxGuestsPerInvitation: 500, premiumTemplatesEnabled: true, qrInvitationsEnabled: true, qrCheckInEnabled: true, seatingEnabled: true, advancedAnalyticsEnabled: true, teamMembersEnabled: true },
  { id: 3, code: 'STUDIO', packageName: 'Atelier KHR', description: 'Studio collaboration for Khmer wedding planners', price: 120000, currency: 'KHR', billingInterval: 'MONTHLY', durationDays: 30, maxInvitations: 10, maxGuestsPerInvitation: 1000, premiumTemplatesEnabled: true, qrInvitationsEnabled: true, qrCheckInEnabled: true, seatingEnabled: true, teamMembersEnabled: true },
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
    if (p.endsWith('/public/templates') || p.endsWith('/templates')) {
      return json([
        { id: 12, code: 'khmer-floral-gold', slug: 'khmer-floral-gold', name: 'Khmer Floral Gold', category: 'TRADITIONAL', price: 15, currency: 'USD', isPremium: true, active: true, checkoutEligible: true, checkoutAmount: 15, checkoutCurrency: 'USD' },
      ]);
    }
    if (p.startsWith('/api/v1/template-payments/ORD-2026-PENDING')) return json(SEED_ORDER_PENDING);
    if (p.startsWith('/api/v1/template-payments/ORD-2026-PAID')) return json(SEED_ORDER_PAID);
    if (p === '/api/v1/me/payments') return json([SEED_ORDER_PAID, { ...SEED_ORDER_PENDING, itemType: 'Template Purchase', createdAt: '2026-11-27T08:00:00Z' }]);
    if (p === '/api/v1/me/payments/ORD-2026-PAID/receipt') return json(SEED_ORDER_PAID);
    if (p === '/api/v1/packages' || p === '/api/v1/public/packages') return json(SEED_PACKAGES);
    if (p === '/api/v1/me/entitlements') {
      return json({ packagePlan: SEED_PACKAGES[0], source: 'CONFIGURED_FREE_PACKAGE', features: ['QR_INVITATIONS'], quotas: { invitations: { used: 1, limit: 1, remaining: 0 }, guestsPerInvitation: { used: 3, limit: 50, remaining: 47 } } });
    }
    if (p === '/api/v1/me/subscriptions') {
      return json([{ id: 88, orderCode: 'SUB-2026-019', status: 'PENDING_REVIEW', paymentStatus: 'PENDING', amount: 29, currency: 'USD', createdAt: '2026-11-26T14:20:00Z', packagePlan: SEED_PACKAGES[1] }]);
    }
    if (p.endsWith('/invitations/my')) {
      return json([{ id: 42, title: 'សិរីមង្គលការ សុផល & ចាន់ណារី', status: 'PUBLISHED', slug: 'sophal-channary', templateCode: 'khmer-floral-gold' }]);
    }
    if (p === '/api/v1/invitations/42') {
      return json({ id: 42, title: 'សិរីមង្គលការ សុផល & ចាន់ណារី', status: 'PUBLISHED', slug: 'sophal-channary', templateCode: 'khmer-floral-gold' });
    }
    if (p === '/api/v1/invitations/42/access') {
      return json({ owner: true, permissions: ['VIEW_EVENT', 'EDIT_EVENT', 'MANAGE_GUESTS', 'MANAGE_SEATING', 'MANAGE_CHECKIN'], ownerFeatures: ['QR_INVITATIONS', 'QR_CHECK_IN'] });
    }
    if (p === '/api/v1/invitations/42/gifts') return json(SEED_GIFTS);
    if (p === '/api/v1/invitations/42/guests') return json([{ id: 501, guestName: 'ចាន់ សុផល' }, { id: 502, guestName: 'កែវ សុភា' }]);
    return json({});
  });

  return { context, page };
}

const CASES = [
  { name: '01-template-checkout-light-en-1440.png', route: '/templates/khmer-floral-gold/checkout', width: 1440, height: 900, lang: 'en', theme: 'light' },
  { name: '02-template-checkout-obsidian-km-1440.png', route: '/templates/khmer-floral-gold/checkout', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '03-payment-status-qr-light-en-1440.png', route: '/payments/ORD-2026-PENDING/status', width: 1440, height: 900, lang: 'en', theme: 'light' },
  { name: '04-payment-status-qr-obsidian-km-1440.png', route: '/payments/ORD-2026-PENDING/status', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '05-payment-status-qr-mobile-390.png', route: '/payments/ORD-2026-PENDING/status', width: 390, height: 844, lang: 'en', theme: 'dark' },
  { name: '06-payment-history-obsidian-km-1440.png', route: '/app/payments', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '07-payment-receipt-obsidian-en-1440.png', route: '/app/payments/ORD-2026-PAID', width: 1440, height: 900, lang: 'en', theme: 'dark' },
  { name: '08-subscription-packages-obsidian-km-1440.png', route: '/app/packages', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '09-subscription-checkout-modal-obsidian-1440.png', route: '/app/packages', width: 1440, height: 900, lang: 'en', theme: 'dark', openPlanModal: true },
  { name: '10-wedding-gifts-ledger-obsidian-km-1440.png', route: '/app/events/42/gifts', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '11-wedding-gifts-light-mobile-390.png', route: '/app/events/42/gifts', width: 390, height: 844, lang: 'en', theme: 'light' },
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

      if (c.openPlanModal) {
        const chooseBtn = page.locator('article.pkg-card.is-featured button').first();
        if (await chooseBtn.count()) {
          await chooseBtn.click();
          await page.waitForTimeout(500);
        }
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
