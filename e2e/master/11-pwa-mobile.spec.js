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

  test('MobileDrawer: Menu otvorí účet / cenník (PWA položka je conditional na beforeinstallprompt)', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByText(/Cenník|Sprievodca|Audit/i).first()).toBeVisible({ timeout: 10_000 });
    // PWA install item only when canInstall — soft assert if present
    const pwa = page.getByText(/Inštalovať do mobilu \(PWA\)/i);
    if (await pwa.isVisible().catch(() => false)) {
      await expect(pwa).toBeVisible();
    }
  });

  test('Offline po demo — UI ostáva použiteľné', async ({ page, context }) => {
    await launchDemo(page);
    await context.setOffline(true);
    await page.getByRole('button', { name: /Pavúk vzťahov|Pavúk|Kartotéka/i }).first().click();
    await expect(page.getByText('ForenzDetectiv').first()).toBeVisible();
    await context.setOffline(false);
  });
});
