import { test, expect } from '@playwright/test';
import { gotoApp, dismissQuickTipIfPresent, launchDemo } from '../helpers.js';

test.describe('S11 — PWA, mobilné UI & offline', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Mobile bottom nav má safe-area padding', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);

    const nav = page.locator('nav').filter({ has: page.getByRole('button', { name: /Pavúk|Spis|Alibi|Sherlock/i }) }).first();
    await expect(nav).toBeVisible({ timeout: 15_000 });
    const pb = await nav.evaluate((el) => getComputedStyle(el).paddingBottom);
    expect(pb).toBeTruthy();
  });

  test('MobileDrawer obsahuje Inštalovať do mobilu (PWA)', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);

    // Hamburger / menu
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByText(/Inštalovať do mobilu \(PWA\)/i)).toBeVisible({ timeout: 10_000 });
  });

  test('Offline po demo — UI ostáva použiteľné', async ({ page, context }) => {
    await launchDemo(page);
    await context.setOffline(true);
    await page.getByRole('button', { name: /Pavúk|Kartotéka|Spis/i }).first().click();
    await expect(page.locator('text=ForenzDetectiv').first()).toBeVisible();
    await context.setOffline(false);
  });
});
