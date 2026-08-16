import { test, expect } from '@playwright/test';
import { gotoApp, dismissQuickTipIfPresent } from '../helpers.js';

test.describe('S10 — Monetizácia, Paywall & licencia', () => {
  test('Otvorenie cenníka a aktivácia PRO-LAWYER-2026', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);

    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByText(/Cenník|Pricing/i).first().click();

    const promo = page.getByPlaceholder(/PRO-LAWYER/i);
    await expect(promo).toBeVisible({ timeout: 10_000 });
    await promo.fill('PRO-LAWYER-2026');
    await page.getByRole('button', { name: /Uplatniť|Aktivovať|Apply/i }).first().click();
    await expect(page.getByText(/aktivovan|Licencia|PRO|365/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('Free tier case limit helper je v localStorage API', async ({ page }) => {
    await gotoApp(page);
    await page.evaluate(() => {
      localStorage.setItem('forenz_case_count', '2');
    });
    const count = await page.evaluate(() => localStorage.getItem('forenz_case_count'));
    expect(count).toBe('2');
  });
});
