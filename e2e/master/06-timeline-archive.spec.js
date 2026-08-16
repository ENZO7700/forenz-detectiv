import { test, expect } from '@playwright/test';
import { launchDemo } from '../helpers.js';

test.describe('S06/S07 — Timeline & Archive', () => {
  test('S06 Timeline tab po demo', async ({ page }) => {
    await launchDemo(page);
    await page.getByRole('button', { name: /Časová os \(Timeline\)/i }).click();
    await expect(
      page.locator('input[type="range"]')
        .or(page.getByRole('slider'))
        .or(page.getByText(/Prehrať|Replay|udalosť|Timeline/i))
        .first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test('S07 Archív / Kartotéka po demo', async ({ page }) => {
    await launchDemo(page);
    await page.getByRole('button', { name: /Kartotéka & Spisy/i }).click();
    await expect(page.getByText(/Kartotéka|výpoveď|dokument|spis|Demo|BA|KE/i).first()).toBeVisible({
      timeout: 15_000
    });
  });
});
