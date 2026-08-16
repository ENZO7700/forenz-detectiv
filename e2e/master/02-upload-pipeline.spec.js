import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { gotoApp, dismissQuickTipIfPresent, writePdfFixture, expectToastMatching } from '../helpers.js';

test.describe('S02 — Mega Upload Pipeline & Bulk gates', () => {
  test('2.3 Nadlimitný súbor >50 MB → toast 50 000 KB', async ({ page }) => {
    test.setTimeout(180_000);
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);

    const filePath = writePdfFixture(50 * 1024 * 1024 + 4096, 'spis_52mb.pdf');
    try {
      const input = page.locator('input[type="file"]').first();
      await expect(input).toBeAttached();
      await input.setInputFiles(filePath);
      await expectToastMatching(page, /prekračuje limit 50 MB|max 50 000 KB/i);
    } finally {
      fs.unlinkSync(filePath);
      try {
        fs.rmdirSync(path.dirname(filePath));
      } catch {
        /* ignore */
      }
    }
  });

  test('2.1/2.2 Malý PDF (< 50 MB) — UI ostane živé', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);

    const filePath = writePdfFixture(64 * 1024, 'vysetrovaci_spis_ok.pdf');
    try {
      const input = page.locator('input[type="file"]').first();
      await input.setInputFiles(filePath);
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toContainText('ForenzDetectiv', { timeout: 20_000 });
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  test('Bulk / hero file input existuje (multiple)', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);
    const input = page.locator('input[type="file"]').first();
    await expect(input).toBeAttached();
    await expect(input).toHaveAttribute('multiple', '');
  });
});
