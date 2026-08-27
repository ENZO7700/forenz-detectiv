import { test, expect } from '@playwright/test';
import { gotoApp, dismissQuickTipIfPresent } from '../helpers.js';

test.describe('S10 — Monetizácia pozastavená (clean prod)', () => {
  test('Pricing / license UI nie je dostupné', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);

    await expect(page.getByPlaceholder(/PRO-LAWYER/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Referral$/i })).toHaveCount(0);
  });

  test('case_count localStorage ostáva čitateľný (analytics)', async ({ page }) => {
    await gotoApp(page);
    await page.evaluate(() => {
      localStorage.setItem('forenz_case_count', '2');
    });
    const count = await page.evaluate(() => localStorage.getItem('forenz_case_count'));
    expect(count).toBe('2');
  });
});
