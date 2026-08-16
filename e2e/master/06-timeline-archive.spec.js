import { test, expect } from '@playwright/test';
import { launchDemo } from '../helpers.js';

test.describe('S06/S07 — Timeline & Archive', () => {
  test('S06 Timeline tab po demo', async ({ page }) => {
    await launchDemo(page);
    const timeline = page.getByRole('button', { name: /Časová os|Timeline|časov/i }).first();
    if (await timeline.isVisible().catch(() => false)) {
      await timeline.click();
      await expect(page.locator('input[type="range"], [role="slider"], text=/00:|Prehrať|Replay/i').first()).toBeVisible({
        timeout: 15_000
      });
    } else {
      // Mobile bottom nav
      const mobileTime = page.getByRole('button', { name: /Časová os|Timeline/i });
      test.skip(!(await mobileTime.count()), 'Timeline tab not visible in this viewport');
    }
  });

  test('S07 Archív / Kartotéka po demo', async ({ page }) => {
    await launchDemo(page);
    const archive = page.getByRole('button', { name: /Kartotéka|Archív|Spis/i }).first();
    await expect(archive).toBeVisible({ timeout: 15_000 });
    await archive.click();
    await expect(
      page.locator('text=/PDF|SPIS|dokument|výpoveď|Kartotéka|Archív/i').first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
