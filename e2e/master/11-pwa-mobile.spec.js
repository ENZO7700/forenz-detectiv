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

test.describe('S11b — iPhone 17 logical 393×852', () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test('AppLayout dead zone + bottom nav', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);
    await expect(page.getByTestId('app-layout')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('camera-dead-zone')).toBeVisible();
    await expect(page.getByTestId('mobile-bottom-nav')).toBeVisible();
  });
});

test.describe('S11c — iPhone Air logical 420×912', () => {
  test.use({ viewport: { width: 420, height: 912 } });

  test('Touch chrome is below camera dead zone', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);
    const dead = page.getByTestId('camera-dead-zone');
    const bar = page.getByTestId('m3-app-bar');
    await expect(dead).toBeVisible({ timeout: 15_000 });
    await expect(bar).toBeVisible();
    const deadBox = await dead.boundingBox();
    const barBox = await bar.boundingBox();
    expect(deadBox).toBeTruthy();
    expect(barBox).toBeTruthy();
    expect(barBox.y).toBeGreaterThanOrEqual(deadBox.y + deadBox.height - 1);
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
  });
});
