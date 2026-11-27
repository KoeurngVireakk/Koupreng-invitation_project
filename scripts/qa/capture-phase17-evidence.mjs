import { chromium } from '../../apps/frontend-user/node_modules/playwright/index.mjs';
import AxeBuilder from '../../apps/frontend-user/node_modules/@axe-core/playwright/dist/index.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const stageArg = process.argv.find((arg) => arg.startsWith('--stage='))?.split('=')[1] || 'before';
const portArg = Number(process.argv.find((arg) => arg.startsWith('--port='))?.split('=')[1] || '4331');
const appDir = path.resolve(process.argv.find((arg) => arg.startsWith('--app-dir='))?.split('=')[1] || 'apps/frontend-user');
const outDir = path.resolve(
  process.argv.find((arg) => arg.startsWith('--out-dir='))?.split('=')[1] ||
    `docs/uxui/phase17-guest-crm/evidence/${stageArg}`
);
const baseURL = `http://127.0.0.1:${portArg}`;
const TEST_TOKEN = ['eyJhbGciOiJub25lIn0', 'eyJleHAiOjQxMDIyNjg4MDB9', ''].join('.');

const SEED_GUESTS = [
  { id: 501, invitationId: 42, guestName: 'ចាន់ សុផល & ភរិយា (Sok Sophal)', companionName: 'Malis', phone: '012 345 678', email: 'sophal@example.test', guestGroup: 'Groom Side', sideType: 'Family', seatCount: 2, tableNumber: 'VIP 1', sendStatus: 'SENT', inviteToken: 'tok-501', note: 'Owner private note: vegetarian table near elders', rsvpStatus: 'ATTENDING', attendeeCount: 2, checkedIn: true },
  { id: 502, invitationId: 42, guestName: 'ហេង ធីតា (Heng Thida)', phone: '085 221 144', email: 'thida@example.test', guestGroup: 'Bride Side', sideType: 'College Friend', seatCount: 1, sendStatus: 'PENDING', inviteToken: 'tok-502', rsvpStatus: 'PENDING', attendeeCount: 1, checkedIn: false },
  { id: 503, invitationId: 42, guestName: 'មាស សុភា (Meas Sophea)', phone: '070 445 566', email: '', guestGroup: 'Bride Side', sideType: 'Coworker', seatCount: 3, tableNumber: 'B-02', sendStatus: 'OPENED', inviteToken: 'tok-503', rsvpStatus: 'MAYBE', attendeeCount: 2, checkedIn: false },
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
    if (p.endsWith('/invitations/my')) {
      return json([{ id: 42, title: 'សិរីមង្គលការ សុផល & ចាន់ណារី', status: c.draftMode ? 'DRAFT' : 'PUBLISHED', slug: 'sophal-channary', templateCode: 'khmer-floral-gold' }]);
    }
    if (p === '/api/v1/invitations/42') {
      return json({ id: 42, title: 'សិរីមង្គលការ សុផល & ចាន់ណារី', status: c.draftMode ? 'DRAFT' : 'PUBLISHED', slug: 'sophal-channary', templateCode: 'khmer-floral-gold' });
    }
    if (p === '/api/v1/invitations/42/access') {
      return json({ owner: true, permissions: ['VIEW_EVENT', 'EDIT_EVENT', 'MANAGE_GUESTS', 'MANAGE_CHECKIN'], ownerFeatures: ['QR_INVITATIONS', 'GUEST_IMPORT'] });
    }
    if (p === '/api/v1/invitations/42/guests/overview') {
      return json(
        c.emptyMode
          ? { guestRecords: 0, reservedSeats: 0, attendingRecords: 0, declinedRecords: 0, maybeRecords: 0, unansweredRecords: 0, respondedRecords: 0, toInviteRecords: 0, checkedInRecords: 0, markedSentRecords: 0 }
          : { guestRecords: 3, reservedSeats: 6, attendingRecords: 1, declinedRecords: 0, maybeRecords: 1, unansweredRecords: 1, respondedRecords: 2, toInviteRecords: 1, checkedInRecords: 1, markedSentRecords: 2 }
      );
    }
    if (p === '/api/v1/invitations/42/guests/page') {
      const items = c.emptyMode
        ? []
        : SEED_GUESTS.map((g) => ({
            guest: g,
            rsvpStatus: g.rsvpStatus,
            attendeeCount: g.attendeeCount,
            checkedIn: g.checkedIn,
            respondedAt: g.rsvpStatus !== 'PENDING' ? '2026-11-20T09:00:00Z' : null,
            checkedInAt: g.checkedIn ? '2026-11-22T17:00:00Z' : null,
          }));
      return json({ items, page: 0, size: 25, totalElements: items.length, totalPages: 1 });
    }
    if (p === '/api/v1/invitations/42/guests') return json(c.emptyMode ? [] : SEED_GUESTS);
    if (p === '/api/v1/invitations/42/delivery/summary') {
      return json({
        totalGuests: c.emptyMode ? 0 : 3,
        ready: c.emptyMode ? 0 : 2,
        sent: c.emptyMode ? 0 : 1,
        opened: c.emptyMode ? 0 : 1,
        responded: c.emptyMode ? 0 : 1,
        failed: c.emptyMode ? 0 : 1,
        guests: c.emptyMode
          ? []
          : [
              { guestId: 501, guestName: SEED_GUESTS[0].guestName, email: 'sophal@example.test', phone: '012 345 678', sendStatus: 'SENT', invitationUrl: 'https://koupreng.app/i/sophal-channary?token=tok-501', lastSentAt: '2026-11-20T08:30:00Z', responded: true },
              { guestId: 502, guestName: SEED_GUESTS[1].guestName, email: 'thida@example.test', phone: '085 221 144', sendStatus: 'PENDING', invitationUrl: 'https://koupreng.app/i/sophal-channary?token=tok-502', responded: false },
              { guestId: 503, guestName: SEED_GUESTS[2].guestName, email: '', phone: '070 445 566', sendStatus: 'FAILED', lastSendError: 'Mailbox full', invitationUrl: 'https://koupreng.app/i/sophal-channary?token=tok-503', responded: false },
            ],
      });
    }
    if (p === '/api/v1/invitations/42/delivery/events') {
      return json([
        { id: 1, guestName: SEED_GUESTS[0].guestName, channel: 'EMAIL', status: 'SENT', createdAt: '2026-11-20T08:30:00Z' },
        { id: 2, guestName: SEED_GUESTS[2].guestName, channel: 'TELEGRAM', status: 'FAILED', errorMessage: 'Chat unavailable', createdAt: '2026-11-20T09:15:00Z' },
      ]);
    }
    return json({});
  });

  return { context, page };
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const server = spawn(
    'node',
    ['./node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(portArg), '--strictPort'],
    { cwd: appDir, stdio: 'ignore' }
  );

  try {
    await waitForServer(baseURL);
    const browser = await chromium.launch();
    const cases = [
      { name: '01-guests-light-en-1440.png', route: '/app/events/42/guests', width: 1440, height: 900, lang: 'en', theme: 'light', waitFor: '.guest-record-row' },
      { name: '02-guests-obsidian-km-1440.png', route: '/app/events/42/guests', width: 1440, height: 900, lang: 'km', theme: 'dark', waitFor: '.guest-record-row' },
      { name: '03-guests-tablet-dark-768.png', route: '/app/events/42/guests', width: 768, height: 1024, lang: 'en', theme: 'dark', waitFor: '.guest-record-row' },
      { name: '04-guests-mobile-light-km-390.png', route: '/app/events/42/guests', width: 390, height: 844, lang: 'km', theme: 'light', waitFor: '.guest-record-row', fullPage: true },
      { name: '05-guests-mobile-dark-430.png', route: '/app/events/42/guests', width: 430, height: 932, lang: 'en', theme: 'dark', waitFor: '.guest-record-row' },
      { name: '06-guests-selected-bulk-1440.png', route: '/app/events/42/guests', width: 1440, height: 900, lang: 'en', theme: 'dark', waitFor: '.guest-record-row', selectFirst: true },
      { name: '07-guests-import-modal-dark-1440.png', route: '/app/events/42/guests', width: 1440, height: 900, lang: 'en', theme: 'dark', waitFor: '.guest-record-row', openImport: true },
      { name: '08-guests-empty-km-390.png', route: '/app/events/42/guests', width: 390, height: 844, lang: 'km', theme: 'dark', waitFor: '.guest-inline-empty-row, .guest-empty-state', emptyMode: true },
      { name: '09-delivery-dark-en-1440.png', route: '/app/events/42/delivery', width: 1440, height: 900, lang: 'en', theme: 'dark', waitFor: '.delivery-recipient-table' },
      { name: '10-delivery-mobile-km-390.png', route: '/app/events/42/delivery', width: 390, height: 844, lang: 'km', theme: 'light', waitFor: '.delivery-recipient-table', fullPage: true },
    ];

    const results = [];
    for (const c of cases) {
      const { context, page } = await openContext(browser, c);
      try {
        await page.goto(`${baseURL}${c.route}`, { waitUntil: 'domcontentloaded' });
        await page.locator(c.waitFor).first().waitFor({ state: 'visible', timeout: 25000 });
        if (c.selectFirst) {
          await page.getByRole('checkbox', { name: /Select guest/i }).first().check();
          await page.waitForTimeout(200);
        }
        if (c.openImport) {
          await page.getByRole('button', { name: /Import/i }).first().click();
          await page.locator('.guest-import').waitFor({ state: 'visible', timeout: 10000 });
        }
        await page.evaluate(async () => document.fonts.ready);
        await page.waitForTimeout(300);

        const m = await page.evaluate(() => ({
          url: location.pathname,
          innerWidth: window.innerWidth,
          overflowPx: document.documentElement.scrollWidth - window.innerWidth,
          colorMode: document.documentElement.dataset.colorMode || null,
          bodyBg: getComputedStyle(document.body).backgroundColor,
        }));
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
        const violations = axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.map((n) => n.target.join(' ')).slice(0, 4) }));
        await page.screenshot({ path: path.join(outDir, c.name), fullPage: Boolean(c.fullPage) });
        results.push({ name: c.name, stage: stageArg, metrics: m, axeViolations: violations });
        console.log(`[${stageArg}] ${c.name}: overflow=${m.overflowPx}px axe=${violations.length} bg=${m.bodyBg}`);
      } finally {
        await context.close();
      }
    }
    await fs.writeFile(path.join(outDir, 'metrics.json'), JSON.stringify({ stage: stageArg, capturedAt: new Date().toISOString(), results }, null, 2));
    await browser.close();
  } finally {
    server.kill();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
