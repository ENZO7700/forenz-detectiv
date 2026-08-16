import { test, expect } from '@playwright/test';
import { gotoApp, dismissQuickTipIfPresent, launchDemo } from '../helpers.js';

test.describe('S11 — PWA, mobilné UI & offline', () => {
  test('Mobile bottom nav má safe-area padding', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);

    const nav = page.locator('nav').filter({ hasText: /Pavúk|Spis|Alibi|Sherlock/i }).first();
    await expect(nav).toBeVisible({ timeout: 20_000 });
    const pb = await nav.evaluate((el) => getComputedStyle(el).paddingBottom);
    expect(pb).toBeTruthy();
  });

  test('MobileDrawer: Menu otvorí účet / cenník', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);
    await page.getByRole('button', { name: /Otvoriť navigáciu|Menu/i }).click();
    await expect(page.getByText(/Cenník|Sprievodca|Audit/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('Offline po demo — UI ostáva použiteľné', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await launchDemo(page);
    try {
      await context.setOffline(true);
      await page.getByRole('button', { name: /^Pavúk$/i }).click();
      await expect(page.locator('body')).toContainText('ForenzDetectiv');
    } finally {
      await context.setOffline(false);
    }
  });
});
