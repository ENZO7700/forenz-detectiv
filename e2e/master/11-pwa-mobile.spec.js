import { test, expect } from '@playwright/test';
import { gotoApp, dismissQuickTipIfPresent, launchDemo } from '../helpers.js';

test.describe('S11 — PWA, mobilné UI & offline', () => {
  test('Mobile bottom nav má data-testid a safe-area inline style', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);
    const nav = page.getByTestId('mobile-bottom-nav');
    // Attached even when lg:hidden (display:none on desktop viewport)
    await expect(nav).toBeAttached({ timeout: 10_000 });
    await expect(nav).toHaveAttribute('style', /safe-area-inset-bottom/i);
  });

  test('MobileDrawer: Menu otvorí účet / cenník', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);
    await page.setViewportSize({ width: 390, height: 844 });
    const menu = page.getByRole('button', { name: /Otvoriť navigáciu/i });
    await expect(menu).toBeAttached({ timeout: 10_000 });
    await menu.click({ force: true });
    await expect(page.getByRole('dialog').getByText(/Cenník|Sprievodca|Audit/i).first()).toBeVisible({
      timeout: 10_000
    });
  });

  test('Offline po demo — UI ostáva použiteľné', async ({ page, context }) => {
    await launchDemo(page);
    try {
      await context.setOffline(true);
      await expect(page.locator('body')).toContainText(/ForenzDetectiv|ForenzDetektív/i);
    } finally {
      await context.setOffline(false);
    }
  });
});
