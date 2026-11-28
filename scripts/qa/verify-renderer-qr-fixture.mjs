// Decode screenshots of the actual renderer image slot using a non-payment QR.
import { chromium } from '../../apps/frontend-user/node_modules/playwright/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { openInvitationContext } from './capture-phase16-evidence.mjs';

const base = process.argv[2] || 'http://127.0.0.1:4319';
const output = process.argv[3] || 'output/playwright/sss-plus-v2/qr-fixture-verified';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const rows = [];
try {
  for (const renderer of ['khmer-celestial', 'silk-heritage']) {
    const { context, page } = await openInvitationContext(browser, { width: 390, height: 844, lang: 'en' });
    try {
      await page.goto(`${base}/i/guest-${renderer}`);
      await page.locator(renderer === 'khmer-celestial' ? '.kc-opening__button' : '.sh-cover .sh-button').click();
      const image = page.locator('img[src="/__audit__/non-payable-qr.svg"]');
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(image => image.decode());
      await page.evaluate(() => document.fonts.ready);
      const screenshot = path.join(output, `${renderer}-gift-qr.png`);
      await image.screenshot({ path: screenshot });
      await page.addScriptTag({ path: 'apps/frontend-user/node_modules/jsqr/dist/jsQR.js' });
      const pixels = `data:image/png;base64,${(await readFile(screenshot)).toString('base64')}`;
      const result = await page.evaluate(async pixels => {
        const image = new Image(); image.src = pixels; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
        const rgba = context.getImageData(0, 0, canvas.width, canvas.height);
        return { width: canvas.width, height: canvas.height, decoded: window.jsQR(rgba.data, canvas.width, canvas.height)?.data || null };
      }, pixels);
      if (result.decoded !== 'KOUPRENG AUDIT SAMPLE - NOT A PAYMENT CODE') throw new Error(`Rendered gift QR did not preserve the safe fixture: ${JSON.stringify(result)}`);
      rows.push({ renderer, screenshot, ...result });
      console.log(renderer, `${result.width}x${result.height}`, 'decoded-safe-fixture');
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
await writeFile(path.join(output, 'results.json'), JSON.stringify({ note: 'Safe fixture screenshot decode only. Not KHQR, transfer, ticket export, or payment settlement certification.', rows }, null, 2));
