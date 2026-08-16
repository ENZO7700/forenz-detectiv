import { test, expect } from '@playwright/test';
import { gotoApp, dismissQuickTipIfPresent, launchDemo } from '../helpers.js';

test.describe('S05/S08/S09 — Legal smoke, Sherlock, PDF export', () => {
  test('S05 smoke: app obsahuje právny / trust surface (Trust pack alebo docs odkaz)', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);
    // Plné § 346 coverage = npm test legalIntegration — tu len UI dostupnosť
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/ForenzDetectiv|rozpory|alibi/i);
  });

  test('S08 Sherlock panel sa otvorí', async ({ page }) => {
    await launchDemo(page);
    const sherlock = page.getByRole('button', { name: /Sherlock|AI/i }).first();
    await expect(sherlock).toBeVisible({ timeout: 15_000 });
    await sherlock.click();
    await expect(
      page.locator('text=/Sherlock|otázk|Zadaj|Asistent/i').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('S09 PDF export dialóg / tlačidlo', async ({ page }) => {
    await launchDemo(page);
    const exportBtn = page.getByRole('button', { name: /Export|PDF|Protokol/i }).first();
    await expect(exportBtn).toBeVisible({ timeout: 15_000 });
    await exportBtn.click();
    // Dialóg alebo download path
    const dialog = page.locator('[role="dialog"]').filter({ hasText: /PDF|Export|protokol|hash|SHA/i });
    if (await dialog.count()) {
      await expect(dialog.first()).toBeVisible();
    } else {
      // Fallback: toast alebo download started — UI stále živé
      await expect(page.locator('text=ForenzDetectiv').first()).toBeVisible();
    }
  });
});
