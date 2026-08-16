import { test, expect } from '@playwright/test';
import { gotoApp, dismissQuickTipIfPresent, makePdfBuffer, expectToastMatching } from '../helpers.js';

test.describe('S02 — Mega Upload Pipeline & Bulk gates', () => {
  test('2.3 Nadlimitný súbor 52 MB → toast 50 000 KB', async ({ page }) => {
    test.setTimeout(120_000);
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);

    const input = page.locator('input[type="file"]').first();
    await expect(input).toBeAttached();

    const oversized = makePdfBuffer(50 * 1024 * 1024 + 4096, 'spis_52mb.pdf');
    await input.setInputFiles(oversized);

    await expectToastMatching(page, /prekračuje limit 50 MB|max 50 000 KB/i);
  });

  test('2.1/2.2 Malý PDF (< 50 MB) sa prijme do file inputu (bez bielej obrazovky)', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);

    const input = page.locator('input[type="file"]').first();
    const okPdf = makePdfBuffer(64 * 1024, 'vysetrovaci_spis_ok.pdf');
    await input.setInputFiles(okPdf);

    // Backend môže zlyhať — UI nesmie crashnúť
    await expect(page.locator('text=ForenzDetectiv').first()).toBeVisible();
    await page.waitForTimeout(800);
    await expect(page.locator('body')).not.toHaveText(/Something went wrong|Application error/i);
  });

  test('Bulk file input akceptuje multiple atribút', async ({ page }) => {
    await gotoApp(page);
    const inputs = page.locator('input[type="file"]');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
    // Aspoň jeden input podporuje multiple (bulk)
    let hasMultiple = false;
    for (let i = 0; i < count; i++) {
      if (await inputs.nth(i).getAttribute('multiple') !== null) {
        hasMultiple = true;
        break;
      }
    }
    expect(hasMultiple).toBeTruthy();
  });
});
