import { test, expect } from '@playwright/test';
import { installUxFixtures } from './support/uxFixtures.js';

// Wide data keeps its table semantics; essential actions and horizontal access
// must remain available in narrow panels and with long, valid guest data.
for (const lang of ['en', 'km']) {
  test(`check-in row action remains visible while guest details scroll (${lang})`, async ({ page }) => {
    await installUxFixtures(page, lang);
    await page.route('**/api/v1/invitations/101/guests', route => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: [{
        id: 501, guestName: 'Aleksandra Wiśniewska-Kowalczyk',
        phone: '+44 7700 900123', email: 'bartholomew.fitzgerald@northwind-industries.example.test',
        groupName: 'Friends of the bride and groom', side: 'Bride', tableNumber: '12', seatCount: 2,
      }] }),
    }));
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/app/events/101/check-in');
      const roster = page.getByTestId('guest-roster-table');
      const action = roster.locator('tbody button').first();
      await expect(action).toBeEnabled();
      await roster.scrollIntoViewIfNeeded();
      const isAvailable = () => action.evaluate(button => {
        const scroll = button.closest('.guest-table-wrap');
        const buttonRect = button.getBoundingClientRect(), scrollRect = scroll.getBoundingClientRect();
        return buttonRect.left >= scrollRect.left && buttonRect.right <= scrollRect.right + 1;
      });
      await expect.poll(isAvailable).toBe(true);
      await roster.evaluate(table => { table.parentElement.scrollLeft = table.parentElement.scrollWidth; });
      await expect.poll(isAvailable).toBe(true);
      await action.focus();
      await expect(action).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });

  test(`payment history can be scrolled by keyboard (${lang})`, async ({ page }) => {
    await installUxFixtures(page, lang);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/app/payments');
      const table = page.getByRole('region', { name: lang === 'en' ? 'Payment history' : 'ប្រវត្តិការទូទាត់', exact: true });
      await expect(table).toBeVisible();
      await table.focus();
      await expect(table).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => table.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
      await table.getByRole('link', { name: lang === 'en' ? 'Receipt' : 'បង្កាន់ដៃ' }).focus();
      const receipt = table.getByRole('link');
      await expect(receipt).toBeFocused();
      expect(await receipt.evaluate(link => {
        const r = link.getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth;
      })).toBe(true);
    }
  });
}
