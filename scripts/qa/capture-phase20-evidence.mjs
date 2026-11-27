import { chromium } from '../../apps/frontend-user/node_modules/playwright/index.mjs';
import AxeBuilder from '../../apps/frontend-user/node_modules/@axe-core/playwright/dist/index.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import zlib from 'node:zlib';

const stageArg = process.argv.find((arg) => arg.startsWith('--stage='))?.split('=')[1] || 'before';
const portArg = Number(process.argv.find((arg) => arg.startsWith('--port='))?.split('=')[1] || '4334');
const appDir = path.resolve(process.argv.find((arg) => arg.startsWith('--app-dir='))?.split('=')[1] || 'apps/frontend-user');
const outDir = path.resolve(
  process.argv.find((arg) => arg.startsWith('--out-dir='))?.split('=')[1] ||
    `docs/uxui/phase20-tickets-checkin/evidence/${stageArg}`
);
const baseURL = `http://127.0.0.1:${portArg}`;
const TEST_TOKEN = ['eyJhbGciOiJub25lIn0', 'eyJleHAiOjQxMDIyNjg4MDB9', ''].join('.');

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makeMockQrPngDataUri(size = 84) {
  const raw = Buffer.alloc((size + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const mX = Math.floor(x / 4);
      const mY = Math.floor(y / 4);
      const inQuiet = mX < 2 || mY < 2 || mX >= 19 || mY >= 19;
      const isFinder = (fx, fy) => {
        const dx = mX - fx;
        const dy = mY - fy;
        if (dx < 0 || dx > 6 || dy < 0 || dy > 6) return null;
        return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
      };
      let dark = false;
      if (!inQuiet) {
        const f1 = isFinder(2, 2);
        const f2 = isFinder(12, 2);
        const f3 = isFinder(2, 12);
        if (f1 !== null) dark = f1;
        else if (f2 !== null) dark = f2;
        else if (f3 !== null) dark = f3;
        else dark = ((mX * 7 + mY * 13 + mX * mY) % 3) === 0;
      }
      raw[y * (size + 1) + 1 + x] = dark ? 24 : 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // grayscale
  const compressed = zlib.deflateSync(raw);
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString('base64')}`;
}

const MOCK_QR_DATA_URI = makeMockQrPngDataUri();

const SEED_DESIGN = {
  layout: 'GOLD',
  accent: '#967037',
  frame: 'DOUBLE',
  font: 'MOUL',
  header: 'សិរីមង្គលការ · Exclusive Invitation',
  footer: 'Please present this digital pass at the reception entrance.',
  coverMediaId: null,
  backgroundMediaId: null,
  coverFit: 'COVER',
  coverFocusX: 50,
  coverFocusY: 50,
  backgroundOpacity: 0.12,
  showTable: true,
  showSeatCount: true,
  showGroup: true,
};

const SEED_GUESTS = [
  { id: 501, guestName: 'ចាន់ សុផល', phone: '012 345 678', email: 'sophal@example.test', tableNumber: 'VIP-01', groupName: 'VIP Guest', side: 'ខាងកូនកំលោះ', seatCount: 2 },
  { id: 502, guestName: 'Keo Sophea', phone: '098 765 432', email: 'sophea@example.test', tableNumber: '05', groupName: 'University Friends', side: 'ខាងកូនក្រមុំ', seatCount: 2 },
  { id: 503, guestName: 'ហេង ដារ៉ា', phone: '077 889 900', email: 'dara@example.test', tableNumber: '08', groupName: 'Colleagues', side: 'ខាងកូនកំលោះ', seatCount: 1 },
];

const SEED_CHECKINS = [
  { id: 901, guestId: 501, guestName: 'ចាន់ សុផល', tableNumber: 'VIP-01', source: 'Camera QR', giftAmount: 50, giftCurrency: 'USD', note: 'Arrived with family', checkedInAt: '2026-11-27T09:30:00Z' },
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
    const req = route.request();
    const p = new URL(req.url()).pathname;
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
      return json({ owner: true, permissions: ['VIEW_EVENT', 'EDIT_EVENT', 'MANAGE_GUESTS', 'MANAGE_SEATING', 'MANAGE_CHECKIN'], ownerFeatures: ['QR_INVITATIONS', 'QR_CHECK_IN'] });
    }
    if (p === '/api/v1/invitations/42/ticket-design') return json({ design: SEED_DESIGN });
    if (p === '/api/v1/invitations/42/ticket') {
      return json({
        id: '42',
        kind: 'GENERAL',
        title: 'សិរីមង្គលការ សុផល & ចាន់ណារី',
        hostName: 'សុផល',
        partnerName: 'ចាន់ណារី',
        eventDate: '2026-12-20',
        eventTime: '17:00',
        venueName: 'Chroy Changvar Grand Hall',
        languageMode: c.lang || 'en',
        qrCodeDataUri: MOCK_QR_DATA_URI,
        invitationUrl: 'https://koupreng.example/i/sophal-channary',
        tableName: 'VIP-01',
        seatNumber: 'A1',
        seatCount: 2,
        group: 'VIP Guest',
      });
    }
    if (p === '/api/v1/invitations/42/guests') return json(SEED_GUESTS);
    if (p === '/api/v1/invitations/42/media') return json({ all: [], coverImage: null, galleryImages: [] });
    if (p === '/api/v1/invitations/42/qr') {
      return json({
        title: 'សិរីមង្គលការ សុផល & ចាន់ណារី',
        tokenType: 'GENERAL',
        qrCodeDataUri: MOCK_QR_DATA_URI,
        invitationUrl: 'https://koupreng.example/i/sophal-channary',
      });
    }
    if (p === '/api/v1/invitations/42/check-in/summary') {
      return json({ totalGuests: 3, checkedIn: 1, attendingCheckedIn: 1, remaining: 2 });
    }
    if (p === '/api/v1/invitations/42/check-in/list') return json(SEED_CHECKINS);
    if (p === '/api/v1/invitations/42/guests/502/check-in' && req.method() === 'POST') {
      return json({ id: 902, guestId: 502, guestName: 'Keo Sophea', alreadyCheckedIn: false, checkedInAt: '2026-11-27T10:15:00Z', source: 'Manual Desk' });
    }
    return json({});
  });

  return { context, page };
}

const CASES = [
  { name: '01-ticket-designer-light-en-1440.png', route: '/app/events/42/tickets/design', width: 1440, height: 900, lang: 'en', theme: 'light' },
  { name: '02-ticket-designer-obsidian-km-1440.png', route: '/app/events/42/tickets/design', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '03-ticket-designer-mobile-preview-390.png', route: '/app/events/42/tickets/design', width: 390, height: 844, lang: 'km', theme: 'dark', clickMobilePreview: true },
  { name: '04-qr-management-light-en-1440.png', route: '/app/events/42/qr', width: 1440, height: 900, lang: 'en', theme: 'light' },
  { name: '05-qr-management-obsidian-km-1440.png', route: '/app/events/42/qr', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '06-checkin-desk-light-en-1440.png', route: '/app/events/42/check-in', width: 1440, height: 900, lang: 'en', theme: 'light' },
  { name: '07-checkin-desk-obsidian-km-1440.png', route: '/app/events/42/check-in', width: 1440, height: 900, lang: 'km', theme: 'dark' },
  { name: '08-checkin-desk-mobile-obsidian-390.png', route: '/app/events/42/check-in', width: 390, height: 844, lang: 'en', theme: 'dark' },
  { name: '09-checkin-celebration-modal-obsidian-1440.png', route: '/app/events/42/check-in', width: 1440, height: 900, lang: 'en', theme: 'dark', triggerCelebration: true },
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

      if (c.clickMobilePreview) {
        const previewBtn = page.locator('.ticket-mobile-switch button').nth(1);
        if (await previewBtn.count()) {
          await previewBtn.click();
          await page.waitForTimeout(700);
        }
      }

      if (c.triggerCelebration) {
        const checkInBtn = page.locator('button.checkin-row-btn.action-checkin').first();
        if (await checkInBtn.count()) {
          await checkInBtn.click();
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

      await page.screenshot({ path: path.join(outDir, c.name), fullPage: Boolean(c.fullPage) });
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
