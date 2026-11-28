import { chromium } from '../../apps/frontend-user/node_modules/playwright/index.mjs';
import AxeBuilder from '../../apps/frontend-user/node_modules/@axe-core/playwright/dist/index.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import qrcode from '../../apps/frontend-user/node_modules/qrcode-generator/dist/qrcode.mjs';

const stageArg = process.argv.find((arg) => arg.startsWith('--stage='))?.split('=')[1] || 'after';
const rootArg = process.argv.find((arg) => arg.startsWith('--app-dir='))?.split('=')[1] || 'apps/frontend-user';
const portArg = Number(process.argv.find((arg) => arg.startsWith('--port='))?.split('=')[1] || '4319');
const baseArg = process.argv.find((arg) => arg.startsWith('--base-url='))?.slice('--base-url='.length);
const extended = process.argv.includes('--extended');
const recordMotion = process.argv.includes('--record-motion');
const only = process.argv.find(arg => arg.startsWith('--only='))?.slice('--only='.length);
const outDirArg =
  process.argv.find((arg) => arg.startsWith('--out-dir='))?.split('=')[1] ||
  `docs/uxui/phase16-guest-experience/evidence/${stageArg}`;

const outDir = path.resolve(outDirArg);
const appDir = path.resolve(rootArg);
const baseURL = baseArg || `http://127.0.0.1:${portArg}`;
// A locally generated non-payment payload exercises the image slot without
// publishing a merchant account or disguising artwork as a valid QR.
const qrPayload = 'KOUPRENG AUDIT SAMPLE - NOT A PAYMENT CODE';
const auditQr = qrcode(0, 'M');
auditQr.addData(qrPayload);
auditQr.make();
const qrSvg = auditQr.createSvgTag({ cellSize: 6, margin: 24, scalable: true });
const qrPath = '/__audit__/non-payable-qr.svg';

const RENDERER_SLUGS = [
  { key: 'khmer-floral-gold', code: 'khmer-floral-gold', id: 1 },
  { key: 'royal-garden-cinematic', code: 'royal-garden-cinematic', id: 2 },
  { key: 'silk-heritage', code: 'silk-heritage', id: 3 },
  { key: 'khmer-celestial', code: 'khmer-celestial', id: 10 },
  { key: 'royal-khmer-wedding', code: 'royal-khmer-wedding', id: 11 },
  { key: 'the-digital-yes-wedding', code: 'the-digital-yes-wedding', id: 7 },
  { key: 'emerald-canva-luxe-wedding', code: 'emerald-canva-luxe-wedding', id: 9 },
  { key: 'withjoy-modern-portal', code: 'withjoy-modern-portal', id: 4 },
  { key: 'bliss-editorial-wedding', code: 'bliss-editorial-wedding', id: 5 },
  { key: 'khmer-golden-canva-inspired-wedding', code: 'khmer-golden-canva-inspired-wedding', id: 6 },
  { key: 'cover-khmer-golden-wedding', code: 'cover-khmer-golden-wedding', id: 12 },
  { key: 'template-boilerplate', code: 'template-boilerplate', id: 13 },
  { key: 'event-essential', code: 'event-essential', id: 30 },
  { key: 'koupreng-demo-wedding', code: 'koupreng-demo-wedding', id: 14 },
];

function buildInvitationPayload({ code, templateId = 1, lang = 'KM', slug = `guest-${code}` }) {
  const isEn = lang === 'EN';
  const content = {
    version: 1,
    hasHostContent: true,
    languageMode: lang,
    title: isEn
      ? 'Sophal & Channary Royal Wedding'
      : 'សិរីមង្គលអាពាហ៍ពិពាហ៍ សុផល និង ចាន់ណារី',
    subtitle: isEn
      ? 'We joyfully invite you to witness our union'
      : 'សូមគោរពអញ្ជើញជាភ្ញៀវកិត្តិយស',
    groom: isEn ? 'Chann Sophal' : 'ចាន់ សុផល',
    bride: isEn ? 'Meas Channary' : 'មាស ចាន់ណារី',
    groomParents: isEn ? 'Mr. Chann Dara & Mrs. Sokha' : 'លោក ចាន់ តារា និងលោកស្រី សុខា',
    brideParents: isEn ? 'Mr. Meas Rithy & Mrs. Bopha' : 'លោក មាស រិទ្ធី និងលោកស្រី បុប្ផា',
    dateText: isEn ? 'Sunday, 5 December 2027' : 'ថ្ងៃអាទិត្យ ទី៥ ខែធ្នូ ឆ្នាំ២០២៧',
    eventDate: '2027-12-05',
    eventTime: '17:00',
    receptionTime: '17:30',
    venueName: 'Sokha Phnom Penh Hotel Grand Ballroom',
    venueAddress: 'Keo Chenda St, Sangkat Chroy Changvar, Phnom Penh',
    venueMapUrl: 'https://maps.google.com/?q=11.5761,104.9231',
    coverImage: '/images/wedding/couple-hero-meadow.webp',
    galleryImages: [
      '/templates/khmer-floral-gold/groom.webp',
      '/templates/khmer-floral-gold/bride.webp',
    ],
    message: isEn
      ? 'With grateful hearts, our families welcome your presence and blessings on this joyous evening.'
      : 'ដោយសេចក្តីគោរពដ៏ខ្ពង់ខ្ពស់ គ្រួសារទាំងសងខាងសូមគោរពអញ្ជើញលោកអ្នកចូលរួមប្រសិទ្ធពរជ័យ។',
    schedule: [
      {
        dayLabel: isEn ? 'Morning Ceremony' : 'ពិធីពេលព្រឹក',
        time: '07:00 AM',
        title: isEn ? 'Procession & Traditional Blessing' : 'ពិធីហែជំនូន និងបាចផ្កាស្លា',
        description: isEn ? 'Traditional Khmer ceremony at the residence.' : 'ពិធីមង្គលតាមប្រពៃណីជាតិ។',
      },
      {
        dayLabel: isEn ? 'Evening Reception' : 'ពិធីពិសាភោជនាហារ',
        time: '05:30 PM',
        title: isEn ? 'Dinner Banquet & Celebration' : 'ពិធីពិសាភោជនាហារមង្គលការ',
        description: isEn ? 'Grand Ballroom hospitality & music.' : 'ជួបជុំភ្ញៀវកិត្តិយសនៅសាលមហោស្រព។',
      },
    ],
    faq: [
      {
        q: isEn ? 'What is the attire?' : 'តើគួរស្លៀកពាក់បែបណា?',
        a: isEn ? 'Traditional Khmer Silk or Evening Formal' : 'សម្លៀកបំពាក់ប្រពៃណី ឬផ្លូវការ។',
        question: isEn ? 'What is the attire?' : 'តើគួរស្លៀកពាក់បែបណា?',
        answer: isEn ? 'Traditional Khmer Silk or Evening Formal' : 'សម្លៀកបំពាក់ប្រពៃណី ឬផ្លូវការ។',
      },
    ],
    rsvpEnabled: true,
    guestCountEnabled: true,
    maxPartySize: 4,
    design: {
      showOpening: true,
      openingStyle: 'khmer-royal',
      frameStyle: 'double-gold',
      ornamentStyle: 'khmer-corner-01',
    },
    giftSection: {
      enabled: true,
      note: 'AUDIT SAMPLE · NOT A PAYMENT CODE',
      khqrImageUrl: qrPath,
    },
    gift: [{ title: 'AUDIT SAMPLE · NOT A PAYMENT CODE', qrImage: qrPath }],
  };

  return {
    id: 500 + templateId,
    slug,
    templateId,
    templateCode: code,
    templateSlug: code,
    eventType: 'WEDDING',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    languageMode: lang,
    title: content.title,
    groomName: content.groom,
    brideName: content.bride,
    eventDate: '2027-12-05',
    eventTime: '17:00',
    venueName: content.venueName,
    venueAddress: content.venueAddress,
    rsvpEnabled: true,
    guestCountEnabled: true,
    maxPartySize: 4,
    contentJson: JSON.stringify(content),
  };
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Preview server at ${url} did not start within ${timeoutMs}ms`);
}

export async function openInvitationContext(browser, c) {
  const fixtureRequests = [];
  const contextOptions = {
    viewport: { width: c.width || 390, height: c.height || 844 },
    reducedMotion: c.reducedMotion || 'no-preference',
  };
  if (c.userAgent) contextOptions.userAgent = c.userAgent;
  if (c.record) contextOptions.recordVideo = { dir: path.join(outDir, 'video'), size: contextOptions.viewport };

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  await page.addInitScript(({ lang, colorMode }) => {
    if (location.origin === 'null') return;
    window.localStorage.setItem('koupreng.lang', lang);
    window.localStorage.setItem('koupreng.colorMode', colorMode);
    window.localStorage.setItem('theme', colorMode);
    window.sessionStorage.removeItem('koupreng.auth');
    window.localStorage.removeItem('koupreng.auth');
  }, { lang: c.lang || 'km', colorMode: c.dashboardTheme || 'light' });

  await page.route(`**${qrPath}`, route => route.fulfill({ contentType: 'image/svg+xml', body: qrSvg }));

  await page.route(url => url.pathname.startsWith('/api/'), async (route) => {
    const reqUrl = new URL(route.request().url());
    const p = reqUrl.pathname;
    const method = route.request().method();
    fixtureRequests.push({ method, path: p, body: method === 'POST' ? route.request().postDataJSON() : undefined });
    const fulfillJson = (bodyObj, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(bodyObj) });

    if (p.endsWith('/i18n/messages')) return fulfillJson({ data: { messages: {} } });
    if (p === '/api/v1/public/invitations/network-error-sample') {
      return route.abort('failed');
    }
    if (p === '/api/v1/public/invitations/private-unpublished' || p === '/api/v1/public/invitations/private-unpublished/media') {
      return fulfillJson({ message: 'Invitation not found' }, 404);
    }
    if (p === '/api/v1/public/invitations/protected-gate' && method === 'GET') {
      return fulfillJson({ message: 'Invitation password required', passwordProtected: true }, 403);
    }
    if (p === '/api/v1/public/invitations/protected-gate/media') {
      return fulfillJson({ message: 'Invitation password required' }, 403);
    }
    if (p === '/api/v1/public/invitations/protected-gate/access/verify' && method === 'POST') {
      return fulfillJson({ message: 'Too many invalid password attempts' }, 429);
    }
    if (p === '/api/v1/public/invitations/guest-personalized' && method === 'GET') {
      const payload = buildInvitationPayload({ code: 'khmer-floral-gold', templateId: 1, lang: 'EN', slug: 'guest-personalized' });
      payload.guest = {
        id: 88,
        guestName: 'Sokha & Dara',
        tableNumber: 'VIP 1',
        seatLabel: 'A1-A2',
        maxAttendees: 2,
      };
      return fulfillJson({ data: payload });
    }
    if (p === '/api/v1/public/invitations/guest-personalized/guest-view' && method === 'GET') {
      return fulfillJson({ data: { guestName: 'Sokha & Dara', rsvpStatus: 'PENDING', seatCount: 2, tableName: 'VIP 1', seatNumber: 'A1-A2' } });
    }
    if (p === '/api/v1/public/invitations/guest-personalized/guests/gtok_demo_88/rsvp' && method === 'POST') {
      const body = route.request().postDataJSON();
      if (body.responseStatus !== 'ATTENDING' || body.attendeeCount !== 2) return fulfillJson({ message: 'Unexpected fixture RSVP payload' }, 422);
      return fulfillJson({
        data: {
          id: 901,
          guestName: 'Sokha & Dara',
          responseStatus: 'ATTENDING',
          attendeeCount: 2,
          inviteToken: 'gtok_demo_88',
          tableName: 'VIP 1',
          seatNumber: 'A1-A2',
          ticket: {
            ticketCode: 'KPR-VIP-0088',
            guestName: 'Sokha & Dara',
            eventTitle: 'Sophal & Channary Royal Wedding',
            tableNumber: 'VIP 1',
            seatLabel: 'A1-A2',
            qrPayload: 'KPR-VIP-0088',
          },
        },
      });
    }

    const matchPub = p.match(/^\/api\/v1\/public\/invitations\/([^/]+)$/);
    if (matchPub && method === 'GET') {
      const slug = matchPub[1];
      const entry = RENDERER_SLUGS.find((r) => slug === `guest-${r.key}`) || { key: 'unknown-slug', code: 'unknown-slug', id: 999 };
      return fulfillJson({ data: buildInvitationPayload({ code: entry.code, templateId: entry.id, lang: (c.lang || 'km').toUpperCase(), slug }) });
    }
    if (p.match(/^\/api\/v1\/public\/invitations\/[^/]+\/media$/)) {
      return fulfillJson({ data: [] });
    }
    if (p === '/api/v1/templates' || p === '/api/v1/templates/public') {
      return fulfillJson({
        data: RENDERER_SLUGS.map((r) => ({ id: r.id, code: r.code, slug: r.key, name: r.key, status: 'ACTIVE' })),
      });
    }
    return fulfillJson({ data: {} });
  });

  return { context, page, fixtureRequests };
}

async function settleVisibleScene(page, c) {
  // A still marked settled must not be an arbitrary frame in the entrance.
  // Finite, visible animations complete; decorative infinite loops stay alive.
  await page.evaluate(() => document.fonts.ready);
  if (c.renderer === 'royal-garden-cinematic' && c.clickOpener) {
    const skip = page.locator('.rg-entrance-skip, .rg-intro-controls button').last();
    if (await skip.isVisible()) await skip.click();
    await page.waitForFunction(() => document.querySelector('.tpl-royal-garden')?.dataset.stage === 'CONTENT', undefined, { timeout: 15000 });
  }
  if (c.renderer === 'khmer-floral-gold' && c.clickOpener) {
    await page.locator('.kfg-welcome-scene, .kfg-content').first().waitFor({ timeout: 15000 });
  }
  await page.waitForFunction(() => [...document.getAnimations()].every(animation => {
    if (!['running', 'pending'].includes(animation.playState)) return true;
    // Scroll/view timeline reveals are tied to the current reading position;
    // they do not finish merely by waiting at a fixed viewport.
    if (animation.timeline?.constructor.name !== 'DocumentTimeline') return true;
    if (animation.effect?.getTiming().iterations === Infinity) return true;
    const target = animation.effect?.target;
    if (!(target instanceof Element)) return true;
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > innerHeight) return true;
    return false;
  }), undefined, { timeout: 30000 });
  return page.evaluate(() => ({
    kind: 'settled-still',
    note: 'Finite visible document-time entrances settled; ambient loops and scroll/view timeline reveals remain at the captured reading position.',
    phase: document.querySelector('.tpl-royal-garden')?.dataset.stage || (document.querySelector('.kfg-welcome-scene') ? 'welcome' : 'content'),
    images: [...document.images].filter(image => {
      const rect = image.getBoundingClientRect();
      return rect.width && rect.height && rect.bottom > 0 && rect.top < innerHeight;
    }).map(image => ({ src: image.getAttribute('src'), loaded: image.complete && image.naturalWidth > 0 })),
  }));
}

async function recordOpening(page, c) {
  const celestial = c.renderer === 'khmer-celestial';
  const cover = celestial ? '.kc-opening' : '.kfg-opening';
  const content = celestial ? '.kc-hero' : '.kfg-content';
  await page.locator(cover).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(({ celestial }) => {
    const audit = window.__openingAudit = { frames: [], phases: [], actions: [], longTasks: [], unreadableFrames: [], stopped: false };
    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) new PerformanceObserver(list => {
      audit.longTasks.push(...list.getEntries().map(entry => ({ start: entry.startTime, duration: entry.duration })));
    }).observe({ type: 'longtask' });
    const tick = now => {
      if (audit.stopped) return;
      audit.frames.push(now);
      const openingNode = document.querySelector(celestial ? '.kc-opening' : '.kfg-opening');
      const opening = openingNode?.getBoundingClientRect().height ? openingNode : null;
      const welcome = document.querySelector('.kfg-welcome-scene');
      const details = document.querySelector(celestial ? '.kc-hero' : '.kfg-content');
      const phase = opening ? (opening.closest('.is-opening') ? 'opening' : 'cover') : welcome ? 'welcome' : details ? 'content' : 'unmounted';
      if (audit.phases.at(-1)?.phase !== phase) audit.phases.push({ phase, at: now });
      const essential = opening?.querySelector(celestial ? '.kc-opening__guest-name' : '.kfg-guest') || welcome?.querySelector('h2') || details?.querySelector('h1,h2');
      if (essential) {
        let opacity = 1;
        for (let node = essential; node instanceof Element; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
        if (opacity < .95) audit.unreadableFrames.push({ at: now, phase, opacity });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, { celestial });
  // The interrupted case acts during the initial arrival; the complete case
  // retains its cover entrance and then lets the whole welcome run naturally.
  await page.waitForTimeout(c.interrupt ? 300 : 2100);
  const action = async (selector, label) => {
    await page.evaluate(label => window.__openingAudit.actions.push({ label, at: performance.now() }), label);
    await page.locator(selector).click();
  };
  if (celestial) await action(c.interrupt ? '.kc-opening__skip' : '.kc-opening__button', c.interrupt ? 'skip-cover-entrance' : 'open');
  else {
    await action('.kfg-open', 'open');
    if (c.interrupt && await page.locator('.kfg-skip-opening').isVisible()) {
      await page.waitForTimeout(180);
      await action('.kfg-skip-opening', 'skip-unseal');
    }
  }
  await page.locator(content).waitFor({ timeout: 45000 });
  await page.waitForTimeout(1800);
  return page.evaluate(({ content }) => {
    const audit = window.__openingAudit;
    audit.stopped = true;
    const gaps = audit.frames.slice(1).map((time, index) => time - audit.frames[index]);
    const sorted = [...gaps].sort((a, b) => a - b);
    return {
      kind: 'recorded-motion',
      note: 'Headless Chromium laboratory, unthrottled, Playwright video enabled. RAF intervals diagnose main-thread scheduling; they are not compositor dropped-frame certification or physical-device 60fps proof.',
      phases: audit.phases,
      actions: audit.actions,
      frames: audit.frames.length,
      intervalMs: { p50: sorted[Math.floor(sorted.length * .5)], p95: sorted[Math.floor(sorted.length * .95)], max: Math.max(...gaps), above25ms: gaps.filter(value => value > 25).length },
      longTasks: audit.longTasks,
      unreadableFrames: audit.unreadableFrames,
      finalFocus: { tag: document.activeElement?.tagName, className: document.activeElement?.className },
      contentVisible: Boolean(document.querySelector(content)),
      duplicatedCover: [...document.querySelectorAll('.kc-opening,.kfg-opening,.kfg-welcome-scene')].some(node => node.getBoundingClientRect().height > 0),
      audibleMedia: [...document.querySelectorAll('audio,video')].filter(media => !media.paused && !media.muted && media.volume > 0).map(media => media.tagName),
      activeAnimationCount: document.getAnimations().filter(animation => animation.playState === 'running').length,
    };
  }, { content });
}

async function runCase(browser, c) {
  const { context, page, fixtureRequests } = await openInvitationContext(browser, c);
  const consoleErrors = [];
  const pageErrors = [];
  const scriptFailures = [];
  let sceneEvidence;
  await page.exposeFunction('recordFixtureScriptFailure', failure => scriptFailures.push(failure));
  await page.addInitScript(() => {
    window.addEventListener('error', event => {
      if (!event.filename) return;
      const source = new URL(event.filename, location.href);
      window.recordFixtureScriptFailure({ file: source.origin + source.pathname, line: event.lineno, message: event.message });
    });
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(`${err.message} ${err.stack || ''}`.slice(0, 220)));

  try {
    await page.goto(`${baseURL}${c.route}`, { waitUntil: 'domcontentloaded' });
    if (c.waitForSelector) {
      await page.locator(c.waitForSelector).first().waitFor({ state: 'visible', timeout: 25000 }).catch(() => {});
    }
    if (!c.record) await page.waitForTimeout(c.extraWaitMs ?? 600);

    if (c.record) {
      sceneEvidence = await recordOpening(page, c);
    } else if (c.clickOpener) {
      if (c.renderer === 'khmer-floral-gold') {
        const kfgBtn = page.locator('.kfg-open').first();
        if (await kfgBtn.isVisible().catch(() => false)) await kfgBtn.click();
      } else {
        const opener = page.getByRole('button', {
          name: /Open invitation|View invitation details|Open Invitation|Turn the page|Tap seal|Skip opening|\u1794\u17be\u1780\u179f|\u1794\u17be\u1780\u1791\u17c6\u1796\u17d0\u179a|\u1785\u17bb\u1785|\u179a\u17c6\u179b\u1784/i,
        }).first();
        if (await opener.isVisible().catch(() => false)) {
          await opener.click().catch(() => {});
        }
      }
      await page.waitForTimeout(450);
    }

    if (c.submitWrongPassword) {
      const pwInput = page.locator('input[type="password"]').first();
      if (await pwInput.isVisible().catch(() => false)) {
        await pwInput.fill('wrong-pass');
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(350);
      }
    }

    if (c.submitRsvp) {
      await page.locator('.kfg-open').click();
      await page.locator('.kfg-welcome-scene,.kfg-content').first().waitFor();
      if (await page.locator('.kfg-skip-welcome').isVisible()) await page.locator('.kfg-skip-welcome').click();
      await page.locator('.kfg-content').waitFor();
      const form = page.locator('.pub-rsvp-form');
      await form.waitFor();
      const name = form.getByLabel('Guest name', { exact: true });
      if (await name.isVisible()) await name.fill('Sokha & Dara');
      await form.locator('input[type="radio"][value="ATTENDING"]').check();
      await form.locator('input[type="number"]').fill('2');
      await form.locator('textarea').fill('Fictional attendance confirmation.');
      const response = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/v1/public/invitations/guest-personalized/guests/gtok_demo_88/rsvp');
      await form.getByRole('button', { name: 'Submit RSVP', exact: true }).click();
      if ((await response).status() !== 200) throw new Error('Fixture RSVP submission did not succeed');
      await page.locator('.pub-rsvp-done').waitFor();
      if (!(await page.locator('.pub-rsvp-done').textContent()).includes('Sokha & Dara')) throw new Error('Confirmed RSVP omitted the submitted guest');
      await page.locator('#rsvp-checkin-qr').waitFor();
      await page.locator('.pub-rsvp-done').scrollIntoViewIfNeeded();
    }

    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    if (!c.record) sceneEvidence = await settleVisibleScene(page, c);

    const metrics = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const cs = getComputedStyle(body);
      const rendererNode = document.querySelector('[data-template-renderer], [data-variant], [data-template-code], .kfg-root, .bliss-root, .wj-root, .em-root, .dy-root, .sh-root, .kc-root, .tx-root');
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        url: location.pathname + location.search,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollWidth: html.scrollWidth,
        overflowPx: html.scrollWidth - window.innerWidth,
        bodyBg: cs.backgroundColor,
        colorMode: html.dataset.colorMode || null,
        lang: html.lang || null,
        h1Text: document.querySelector('h1')?.textContent?.trim()?.slice(0, 80) || null,
        hasHorizontalScroll: html.scrollWidth > window.innerWidth,
        rendererMarker: rendererNode ? (rendererNode.getAttribute('data-template-renderer') || rendererNode.getAttribute('data-variant') || rendererNode.className.split(' ')[0]) : null,
        domContentLoadedMs: Math.round(navigation?.domContentLoadedEventEnd ?? 0),
      };
    });

    let axeViolations = [];
    if (c.runAxe !== false) {
      try {
        const axe = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        axeViolations = axe.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
          help: v.help,
          targets: v.nodes.map((n) => n.target.join(' ')).slice(0, 4),
          details: v.nodes.map(n => ({ target: n.target, failureSummary: n.failureSummary })),
        }));
      } catch (e) {
        axeViolations = [{ id: 'axe-error', help: String(e) }];
      }
    }

    await page.screenshot({ path: path.join(outDir, c.name), fullPage: Boolean(c.fullPage) });
    return {
      name: c.name,
      stage: stageArg,
      route: c.route,
      renderer: c.renderer || null,
      width: c.width,
      height: c.height,
      reducedMotion: c.reducedMotion || 'no-preference',
      metrics,
      axeViolations,
      consoleErrorCount: consoleErrors.length,
      pageErrorCount: pageErrors.length,
      pageErrors,
      scriptFailures,
      sceneEvidence,
      ...(c.submitRsvp ? { rsvpEvidence: { successVisible: true, qrPassVisible: true, submission: fixtureRequests.filter(request => request.method === 'POST') } } : {}),
    };
  } finally {
    await context.close();
    if (c.record) await page.video()?.saveAs(path.join(outDir, 'video', c.name.replace('.png', '.webm')));
  }
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const server = baseArg ? null : spawn(
    'node',
    ['./node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(portArg), '--strictPort'],
    { cwd: appDir, stdio: 'ignore' }
  );

  try {
    await waitForServer(baseURL);
    const browser = await chromium.launch();
    const allCases = [
      // All 14 registered/alias renderers on mobile 390x844 KM (post-open ceremony content)
      ...RENDERER_SLUGS.map((r, i) => ({
        name: `${String(i + 1).padStart(2, '0')}-renderer-${r.key}-km-390.png`,
        route: `/i/guest-${r.key}`,
        renderer: r.key,
        width: 390,
        height: 844,
        lang: 'km',
        clickOpener: true,
        waitForSelector: '#root > div',
      })),
      // Desktop 1440x900 + Tablet 768x1024 + Narrow 320x568 + Reduced Motion + Dark Dashboard Isolation
      { name: '15-khmer-floral-gold-desktop-en-1440.png', route: '/i/guest-khmer-floral-gold', renderer: 'khmer-floral-gold', width: 1440, height: 900, lang: 'en', clickOpener: true, waitForSelector: '#root > div' },
      { name: '16-royal-garden-tablet-en-768.png', route: '/i/guest-royal-garden-cinematic', renderer: 'royal-garden-cinematic', width: 768, height: 1024, lang: 'en', clickOpener: true, waitForSelector: '#root > div' },
      { name: '17-bliss-editorial-narrow-320.png', route: '/i/guest-bliss-editorial-wedding', renderer: 'bliss-editorial-wedding', width: 320, height: 568, lang: 'km', clickOpener: true, waitForSelector: '#root > div' },
      { name: '18-withjoy-reduced-motion-390.png', route: '/i/guest-withjoy-modern-portal', renderer: 'withjoy-modern-portal', width: 390, height: 844, lang: 'en', reducedMotion: 'reduce', waitForSelector: '#root > div' },
      { name: '19-silk-heritage-dashboard-dark-isolated-390.png', route: '/i/guest-silk-heritage', renderer: 'silk-heritage', width: 390, height: 844, lang: 'km', dashboardTheme: 'dark', clickOpener: true, waitForSelector: '#root > div' },
      { name: '20-landscape-phone-khmer-celestial-844x390.png', route: '/i/guest-khmer-celestial', renderer: 'khmer-celestial', width: 844, height: 390, lang: 'km', clickOpener: true, waitForSelector: '#root > div' },
      // Guest journey states & negative scenarios
      { name: '21-state-password-gate-rate-limit-390.png', route: '/i/protected-gate', renderer: 'gate-429', width: 390, height: 844, lang: 'km', submitWrongPassword: true, waitForSelector: '.protected-gate-card' },
      { name: '22-state-private-not-found-390.png', route: '/i/private-unpublished', renderer: 'state-404', width: 390, height: 844, lang: 'km', waitForSelector: '#root > div' },
      { name: '23-state-network-error-390.png', route: '/i/network-error-sample', renderer: 'state-offline', width: 390, height: 844, lang: 'en', waitForSelector: '#root > div' },
      { name: '24-state-rsvp-and-qr-pass-success-390.png', route: '/i/guest-personalized?token=gtok_demo_88', renderer: 'rsvp-qr-pass', width: 390, height: 844, lang: 'en', submitRsvp: true, fullPage: true, waitForSelector: '#root > div' },
      { name: '25-state-telegram-inapp-ua-390.png', route: '/i/guest-the-digital-yes-wedding', renderer: 'inapp-telegram', width: 390, height: 844, lang: 'en', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Telegram-iOS/10.0', clickOpener: true, waitForSelector: '#root > div' },
      ...(extended ? RENDERER_SLUGS.map(r => ({
        name: `desktop-${r.key}-en-1440.png`, route: `/i/guest-${r.key}`, renderer: r.key,
        width: 1440, height: 900, lang: 'en', clickOpener: true, waitForSelector: '#root > div',
      })) : []),
      ...(recordMotion ? ['khmer-floral-gold', 'khmer-celestial'].flatMap(renderer =>
        ['no-preference', 'reduce'].flatMap(reducedMotion => [false, true].map(interrupt => ({
          name: `motion-${renderer}-${reducedMotion}-${interrupt ? 'interrupted' : 'complete'}.png`, route: `/i/guest-${renderer}`, renderer,
          width: 390, height: 844, lang: 'km', reducedMotion, record: true, interrupt, runAxe: false,
        })))) : []),
    ];
    const cases = allCases.filter(c => !only || (only === 'motion' ? c.record : c.renderer === only));
    if (!cases.length) throw new Error(`No evidence cases match --only=${only}`);

    const results = [];
    for (const c of cases) {
      try {
        const res = await runCase(browser, c);
        results.push(res);
        console.log(`[${stageArg}] ${res.name}: overflow=${res.metrics.overflowPx}px axe=${res.axeViolations.length} errors=${res.pageErrorCount}`);
      } catch (error) {
        console.error(`[${stageArg}] ${c.name}: ${error.message}`);
        results.push({ name: c.name, renderer: c.renderer, width: c.width, height: c.height, error: error.message });
      }
    }

    await fs.writeFile(
      path.join(outDir, 'metrics.json'),
      JSON.stringify({ stage: stageArg, appDir, engine: browser.version(), fixtureMedia: { cover: '/images/wedding/couple-hero-meadow.webp', gallery: ['/templates/khmer-floral-gold/groom.webp', '/templates/khmer-floral-gold/bride.webp'], qr: { path: qrPath, payload: qrPayload, note: 'Generated test text, not a KHQR payment payload. No payment or settlement certification.' } }, capturedAt: new Date().toISOString(), results }, null, 2)
    );
    await browser.close();
    if (results.some(result => result.error || result.pageErrorCount || result.metrics?.overflowPx > 0 || result.axeViolations?.some(violation => ['serious', 'critical'].includes(violation.impact)) || result.sceneEvidence?.audibleMedia?.length || result.sceneEvidence?.duplicatedCover)) process.exitCode = 1;
  } finally {
    server?.kill();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
