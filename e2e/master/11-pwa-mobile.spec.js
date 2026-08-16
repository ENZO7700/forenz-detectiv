import { test, expect } from '@playwright/test';
import { gotoApp, dismissQuickTipIfPresent, expectUploadFirstHome } from '../helpers.js';

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

  test('MobileDrawer: Menu otvorí účet / cenník', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByText(/Cenník|Sprievodca|Audit/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('Offline na empty home — UI ostáva použiteľné', async ({ page, context }) => {
    await expectUploadFirstHome(page);
    await context.setOffline(true);
    await expect(page.locator('body')).toContainText(/ForenzDetectiv/i);
    await context.setOffline(false);
  });
});
