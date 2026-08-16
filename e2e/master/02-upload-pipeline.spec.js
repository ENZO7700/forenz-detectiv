import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { gotoApp, dismissQuickTipIfPresent, writePdfFixture, expectToastMatching } from '../helpers.js';

test.describe('S02 — Mega Upload Pipeline & Bulk gates', () => {
  test('2.3 Nadlimitný súbor >50 MB → toast 50 000 KB', async ({ page }) => {
    test.setTimeout(120_000);
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);

    // Playwright blocks in-memory buffers >50MB; inject File via DataTransfer in-page
    await page.locator('input[type="file"]').first().evaluate((input) => {
      const size = 50 * 1024 * 1024 + 4096;
      const bytes = new Uint8Array(size);
      bytes[0] = 0x25; bytes[1] = 0x50; bytes[2] = 0x44; bytes[3] = 0x46; // %PDF
      const file = new File([bytes], 'spis_52mb.pdf', { type: 'application/pdf' });
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
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
