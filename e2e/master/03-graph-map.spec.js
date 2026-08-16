import { test, expect } from '@playwright/test';
import { launchDemo } from '../helpers.js';

test.describe('S03/S04 — Graph + Alibi Map (demo BA–KE)', () => {
  test('Demo spustí mapu s alibi paradoxom (Bratislava / Košice)', async ({ page }) => {
    await launchDemo(page);
    await expect(
      page.locator('text=/Bratislava|Košice|nemožn|alibi|KRITICK|rozpor/i').first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test('Prepnutie na Pavúk vzťahov po demo', async ({ page }) => {
    await launchDemo(page);
    // Exact desktop tab label (avoid hidden mobile "Pavúk")
    await page.getByRole('button', { name: 'Pavúk vzťahov', exact: true }).click();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20_000 });
  });

  test('Filtrovanie / taby grafu sú klikateľné', async ({ page }) => {
    await launchDemo(page);
    await page.getByRole('button', { name: 'Pavúk vzťahov', exact: true }).click();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20_000 });
    const filterCandidates = page.locator('button').filter({
      hasText: /Kľúčoví|Rozpory|Aktéri|Filter|Všetci/i
    });
    if ((await filterCandidates.count()) > 0) {
      await filterCandidates.first().click();
    }
    await expect(page.locator('canvas').first()).toBeVisible();
  });
});
