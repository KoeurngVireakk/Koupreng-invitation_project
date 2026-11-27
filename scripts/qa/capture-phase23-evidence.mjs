import { chromium } from '../../apps/frontend-user/node_modules/playwright/index.mjs';
import AxeBuilder from '../../apps/frontend-user/node_modules/@axe-core/playwright/dist/index.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const stageArg = process.argv.find((arg) => arg.startsWith('--stage='))?.split('=')[1] || 'before';
const portArg = Number(process.argv.find((arg) => arg.startsWith('--port='))?.split('=')[1] || '4350');
const appDir = path.resolve(process.argv.find((arg) => arg.startsWith('--app-dir='))?.split('=')[1] || 'apps/frontend-user');
const outDir = path.resolve(
  process.argv.find((arg) => arg.startsWith('--out-dir='))?.split('=')[1] ||
    `docs/uxui/phase23-team-org-notifications-ai/evidence/${stageArg}`
);
const baseURL = `http://127.0.0.1:${portArg}`;
const TEST_TOKEN = ['eyJhbGciOiJub25lIn0', 'eyJleHAiOjQxMDIyNjg4MDB9', ''].join('.');

const SEED_ORGS = [
  {
    id: 10,
    name: 'Koupreng Royal Planners',
    slug: 'koupreng-royal-planners',
    status: 'ACTIVE',
    ownerUserId: 7,
    createdAt: '2026-10-01T08:00:00Z',
    members: [
      { id: 1, userId: 7, email: 'sokha@example.test', role: 'OWNER', status: 'ACTIVE', joinedAt: '2026-10-01T08:00:00Z', inviteAcceptedAt: '2026-10-01T08:00:00Z' },
      { id: 2, userId: 12, email: 'dara.manager@example.test', role: 'MANAGER', status: 'ACTIVE', joinedAt: '2026-10-10T09:00:00Z', inviteAcceptedAt: '2026-10-10T09:00:00Z' },
      { id: 3, userId: null, email: 'bopha.pending@example.test', role: 'CHECK_IN_STAFF', status: 'PENDING', invitedAt: '2026-11-25T10:00:00Z', inviteAcceptedAt: null },
    ],
  },
  {
    id: 11,
    name: 'Phnom Penh Event Crew',
    slug: 'phnom-penh-event-crew',
    status: 'ACTIVE',
    ownerUserId: 99,
    createdAt: '2026-10-12T08:00:00Z',
    members: [
      { id: 4, userId: 99, email: 'lead@example.test', role: 'OWNER', status: 'ACTIVE', joinedAt: '2026-10-12T08:00:00Z' },
      { id: 5, userId: 7, email: 'sokha@example.test', role: 'DESIGNER', status: 'ACTIVE', joinedAt: '2026-10-15T08:00:00Z' },
    ],
  },
];

const SEED_NOTIFICATIONS = [
  {
    id: 101,
    title: 'Guest RSVP Confirmed',
    message: 'Chan Sophal (2 guests) confirmed attendance.',
    type: 'RSVP_RECEIVED',
    channel: 'TELEGRAM',
    status: 'DELIVERED',
    readAt: null,
    createdAt: '2026-11-26T09:30:00Z',
  },
  {
    id: 102,
    title: 'Delivery Failed',
    message: 'Could not deliver reminder to invalid recipient.',
    type: 'REMINDER',
    channel: 'EMAIL',
    status: 'FAILED',
    errorMessage: 'Recipient mailbox bounced.',
    readAt: '2026-11-26T10:00:00Z',
    createdAt: '2026-11-26T08:15:00Z',
  },
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
    if (p.endsWith('/users/profile')) return json({ id: 7, fullName: 'Sokha Meas', email: 'sokha@example.test', phone: '012 345 678', profileImage: '' });
    if (p.endsWith('/invitations/my')) {
      return json([{ id: 42, userId: 7, organizationId: 10, title: 'សិរីមង្គលការ សុផល & ចាន់ណារី', status: 'PUBLISHED', eventType: 'WEDDING', eventDate: '2026-12-20', slug: 'sophal-channary', templateCode: 'khmer-floral-gold', updatedAt: '2026-11-26T00:00:00Z' }]);
    }
    if (p === '/api/v1/invitations/42') {
      return json({ id: 42, userId: 7, organizationId: 10, title: 'សិរីមង្គលការ សុផល & ចាន់ណារី', status: 'PUBLISHED', eventType: 'WEDDING', eventDate: '2026-12-20', groomName: 'សុផល', brideName: 'ចាន់ណារី', venueName: 'Sokha Phnom Penh', slug: 'sophal-channary', templateCode: 'khmer-floral-gold', updatedAt: '2026-11-26T00:00:00Z' });
    }
    if (p === '/api/v1/invitations/42/access') {
      return json({ owner: true, permissions: ['VIEW_EVENT', 'EDIT_EVENT', 'MANAGE_GUESTS', 'MANAGE_SEATING', 'MANAGE_CHECKIN', 'VIEW_REPORTS'], ownerFeatures: ['QR_INVITATIONS', 'QR_CHECK_IN', 'TEAM_MEMBERS'] });
    }
    if (p === '/api/v1/subscriptions/entitlements') {
      return json({ packagePlan: { id: 2, code: 'PRO', packageName: 'Pro' }, features: ['TEAM_MEMBERS'], quotas: { teamMembers: { used: 3, limit: 10, remaining: 7 } } });
    }
    if (p === '/api/v1/organizations') return json(SEED_ORGS);
    if (p === '/api/v1/organizations/10') return json(SEED_ORGS[0]);
    if (p === '/api/v1/notifications') return json(SEED_NOTIFICATIONS);
    if (p === '/api/v1/notifications/summary') return json({ unread: 1, sent: 12, delivered: 10, failed: 1 });
    if (p === '/api/v1/telegram/user/settings') return json({ available: true, connected: false });
    return json({});
  });

  return { context, page };
}

const CASES = [
  { name: '01-organizations-light-en-1440.png', route: '/app/organizations', width: 1440, height: 900, lang: 'en', theme: 'light' },
  { name: '02-organizations-obsidian-km-1440.png', route: '/app/organizations', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '03-organization-detail-obsidian-en-1440.png', route: '/app/organizations/10', width: 1440, height: 900, lang: 'en', theme: 'dark' },
  { name: '04-organization-detail-mobile-390.png', route: '/app/organizations/10', width: 390, height: 844, lang: 'en', theme: 'dark' },
  { name: '05-event-team-obsidian-km-1440.png', route: '/app/events/42/team', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '06-notifications-light-en-1440.png', route: '/app/notifications', width: 1440, height: 900, lang: 'en', theme: 'light' },
  { name: '07-notifications-obsidian-km-1440.png', route: '/app/notifications', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '08-profile-obsidian-en-1440.png', route: '/app/profile', width: 1440, height: 900, lang: 'en', theme: 'dark' },
  { name: '09-ai-assistant-obsidian-km-1440.png', route: '/app/events/42/assistant', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '10-ai-assistant-light-en-1440.png', route: '/app/events/42/assistant', width: 1440, height: 900, lang: 'en', theme: 'light' },
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
