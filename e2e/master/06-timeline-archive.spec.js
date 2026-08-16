import { test, expect } from '@playwright/test';
import { launchDemo } from '../helpers.js';

test.describe('S06/S07 — Timeline & Archive', () => {
  test('S06 Timeline tab po demo', async ({ page }) => {
    await launchDemo(page);
    const timeline = page.getByRole('button', { name: /Časová os/i }).first();
    await expect(timeline).toBeVisible({ timeout: 15_000 });
    await timeline.click();
    await expect(
      page.locator('input[type="range"]').or(page.getByRole('slider')).or(page.getByText(/Prehrať|Replay|00:/i)).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('S07 Archív / Kartotéka po demo', async ({ page }) => {
    await launchDemo(page);
    const archive = page.getByRole('button', { name: /Kartotéka & Spisy|Kartotéka/i }).first();
    await expect(archive).toBeVisible({ timeout: 15_000 });
    await archive.click();
    await expect(page.getByText(/Kartotéka|výpoveď|dokument|spis|Demo|BA|KE/i).first()).toBeVisible({
      timeout: 15_000
    });
  });
});
