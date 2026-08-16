import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { gotoApp, dismissQuickTipIfPresent, writePdfFixture, expectToastMatching } from '../helpers.js';

test.describe('S02 — Mega Upload Pipeline & Bulk gates', () => {
  test('2.3 Nadlimitný súbor >50 MB → toast 50 000 KB', async ({ page }) => {
    test.setTimeout(120_000);
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);

    // Fake size without allocating 50MB heap (avoids OOM in Chromium)
    await page.locator('input[type="file"]').first().evaluate((input) => {
      const file = new File(['%PDF-1.4 oversized marker'], 'spis_52mb.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 + 4096 });
      const dt = new DataTransfer();
      dt.items.add(file);
      // DataTransfer may copy size from blob — rebuild via prototype trick
      const dt2 = new DataTransfer();
      try {
        dt2.items.add(file);
      } catch {
        /* ignore */
      }
      input.files = dt2.files;
      // If browser ignored size override, dispatch with manually patched FileList
      if (!input.files[0] || input.files[0].size <= 50 * 1024 * 1024) {
        const patched = {
          0: file,
          length: 1,
          item: (i) => (i === 0 ? file : null),
          [Symbol.iterator]: function* () { yield file; }
        };
        Object.defineProperty(input, 'files', { configurable: true, value: patched });
      }
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await expectToastMatching(page, /prekračuje limit 50 MB|50 000 KB/i);
  });

  test('2.1/2.2 Malý PDF (< 50 MB) — UI ostane živé', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);

    const filePath = writePdfFixture(64 * 1024, 'vysetrovaci_spis_ok.pdf');
    try {
      await page.locator('input[type="file"]').first().setInputFiles(filePath);
      await page.waitForTimeout(800);
      await expect(page.locator('body')).toContainText('ForenzDetectiv');
    } finally {
      fs.unlinkSync(filePath);
      try {
        fs.rmdirSync(path.dirname(filePath));
      } catch {
        /* ignore */
      }
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
