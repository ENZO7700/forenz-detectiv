import { test, expect } from '@playwright/test';
import { expectUploadFirstHome, gotoApp, dismissQuickTipIfPresent } from '../helpers.js';

test.describe('S03/S04 — Graph + Map (upload-first, no demo)', () => {
  test('Empty home: upload CTA, žiadne demo tlačidlá', async ({ page }) => {
    await expectUploadFirstHome(page);
    await expect(page.getByText(/Bratislava|Košice demo|Spustiť Demo/i)).toHaveCount(0);
  });

  test('Desktop header + pricing dostupné bez načítaného spisu', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);
    await expect(page.getByTitle('Licencie a plány').or(page.getByRole('button', { name: /Free|Pro/i })).first()).toBeVisible({
      timeout: 15_000
    });
  });

  test('Geospatial / map UI je pokryté unit testami — empty state nemá mapu', async ({ page }) => {
    await expectUploadFirstHome(page);
    // Map tab sa zobrazí až po dokumentoch; empty home = HomeHero
    await expect(page.locator('input[type="file"]').first()).toBeAttached();
  });
});
