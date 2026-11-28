// Read-only fixture audit. Contract assertions, images and lab probes are
// separate evidence; a successful render never implies persistence certification.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '../../apps/frontend-user/node_modules/@playwright/test/index.mjs';
import AxeBuilder from '../../apps/frontend-user/node_modules/@axe-core/playwright/dist/index.mjs';
import { routeContracts, installRouteContractFixtures, assertRouteContract } from '../../apps/frontend-user/tests/e2e/support/batch12RouteContracts.js';

const options = Object.fromEntries(process.argv.slice(2).map(argument => argument.replace(/^--/, '').split('=')));
const stage = options.stage;
if (!['before', 'after'].includes(stage)) throw new Error('Specify --stage=before or --stage=after');
const baseUser = options.user ?? (stage === 'before' ? 'http://127.0.0.1:4185' : 'http://127.0.0.1:4173');
const baseAdmin = options.admin ?? (stage === 'before' ? 'http://127.0.0.1:4186' : 'http://127.0.0.1:4174');
const selectedGroups = options.groups?.split(',');
let contracts = routeContracts.filter(row => !selectedGroups || selectedGroups.includes(row.group));
if (options.families === '1') contracts = contracts.filter((row, index, rows) => rows.findIndex(other => other.application === row.application && other.group === row.group) === index);
if (!contracts.length) throw new Error('No route contracts matched the requested groups');
const widths = (options.widths ?? '390,1440').split(',').map(Number);
if (widths.some(width => !Number.isFinite(width) || width < 320)) throw new Error('Invalid viewport width');
const output = `output/playwright/sss-plus-v2/contracts-${stage}${options.name ? `-${options.name}` : ''}`;
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const rows = [];
try {
  // Sequential captures keep timings comparable and avoid CPU contention.
  for (const contract of contracts) for (const width of widths) {
    const lang = options.locale ?? (width < 768 ? 'km' : 'en');
    const theme = options.theme ?? (width < 768 ? 'dark' : 'light');
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.setDefaultNavigationTimeout(15000);
    const state = await installRouteContractFixtures(page, contract, { lang });
    await page.addInitScript(({ theme, lang, application }) => {
      if (window !== window.top || location.origin === 'null') return;
      // The two shells intentionally own separate preference contracts.
      if (application === 'frontend-admin') {
        localStorage.setItem('theme', theme);
        localStorage.setItem('koupreng.admin.lang', lang);
      } else {
        localStorage.setItem('koupreng.colorMode', theme);
        localStorage.setItem('koupreng.lang', lang);
      }
      window.__audit = { lcp: null, cls: 0, longTasks: [] };
      for (const type of ['largest-contentful-paint', 'layout-shift', 'longtask']) {
        if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
        new PerformanceObserver(list => list.getEntries().forEach(entry => {
          if (type === 'largest-contentful-paint') window.__audit.lcp = entry.startTime;
          if (type === 'layout-shift' && !entry.hadRecentInput) window.__audit.cls += entry.value;
          if (type === 'longtask') window.__audit.longTasks.push(entry.duration);
        })).observe({ type, buffered: true });
      }
    }, { theme, lang, application: contract.application });
    const name = `${contract.application}-${contract.group}-${contract.pattern.replace(/[^a-z0-9]+/gi, '-')}-${lang}-${theme}-${width}`;
    const row = {
      application: contract.application,
      pattern: contract.pattern,
      group: contract.group,
      fixture: 'batch12 bounded read-only contracts; unknown501/mutations405',
      width,
      lang,
      theme,
      reducedMotion: true,
      screenshot: `${output}/${name}.png`,
      contractFailures: [],
      runtimeErrors: [],
      writes: [],
      unspecifiedReads: [],
    };
    try {
      await page.goto((contract.application === 'frontend-admin' ? baseAdmin : baseUser) + contract.concreteUrl, { waitUntil: 'domcontentloaded' });
      try { await assertRouteContract(page, contract, state); } catch (error) { row.contractFailures.push(error.message); }
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: row.screenshot, fullPage: true, animations: 'disabled' });
      row.geometry = await page.evaluate(() => ({ viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, heading: document.querySelector('h1')?.textContent, theme: document.documentElement.className, colorMode: document.documentElement.dataset.colorMode, locale: document.documentElement.lang }));
      if (options.axe === '1') row.accessibility = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.map(({ target, html }) => ({ target, html })) }));
      row.lab = await page.evaluate(() => ({ ...window.__audit, transferBytes: performance.getEntriesByType('resource').reduce((sum, entry) => sum + entry.transferSize, 0), note: 'Single Chromium laboratory sample, unthrottled; no field INP or device certification' }));
    } catch (error) { row.failure = error.message; }
    row.runtimeErrors = state.errors;
    row.unspecifiedReads = state.unexpected;
    row.writes = state.writes;
    row.overflow = Number(row.geometry?.documentWidth ?? 0) > width + 1;
    row.acceptanceFailures = [
      ...(row.failure ? [`runtime: ${row.failure}`] : []),
      ...row.contractFailures.map(message => `contract: ${message}`),
      ...row.runtimeErrors.map(message => `pageerror: ${message}`),
      ...row.unspecifiedReads.map(({ method, path }) => `unspecified API: ${method} ${path}`),
      ...row.writes.map(({ method, path }) => `unexpected mutation: ${method} ${path}`),
      ...(row.overflow ? [`overflow: document width ${row.geometry.documentWidth} > viewport ${width}`] : []),
      ...(row.accessibility ?? [])
        .filter(violation => ['serious', 'critical'].includes(violation.impact))
        .map(violation => `axe:${violation.impact}:${violation.id}`),
    ];
    rows.push(row);
    console.log(name, row.acceptanceFailures.length ? 'FAIL' : 'rendered', row.accessibility?.length ?? 'axe not run', `writes=${row.writes.length}`, `unknownReads=${row.unspecifiedReads.length}`);
    await context.close();
    await writeFile(`${output}/results.json`, JSON.stringify({ engine: browser.version(), stage, rows }, null, 2));
  }
} finally { await browser.close(); }
const acceptanceFailures = rows.filter(row => row.acceptanceFailures?.length);
const diagnostics = {
  contractFailures: rows.reduce((sum, row) => sum + row.contractFailures.length, 0),
  runtimeErrors: rows.reduce((sum, row) => sum + row.runtimeErrors.length, 0),
  overflow: rows.filter(row => row.overflow).length,
  axeViolations: rows.reduce((sum, row) => sum + (row.accessibility?.length ?? 0), 0),
  writes: rows.reduce((sum, row) => sum + row.writes.length, 0),
  unspecifiedReads: rows.reduce((sum, row) => sum + row.unspecifiedReads.length, 0),
};
console.log(JSON.stringify({ renders: rows.length, acceptanceFailures: acceptanceFailures.length, diagnostics, report: `${output}/results.json` }));
if (stage === 'after' && acceptanceFailures.length) process.exitCode = 1;
