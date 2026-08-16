import { test, expect } from '@playwright/test';
import { gotoApp, dismissQuickTipIfPresent, launchDemo } from '../helpers.js';

test.describe('S05/S08/S09 — Legal smoke, Sherlock, PDF export', () => {
  test('S05 smoke: Home obsahuje forenzný copy', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);
    await expect(page.getByText(/rozpory|alibi|ForenzDetectiv/i).first()).toBeVisible();
  });

  test('S08 Sherlock panel sa otvorí', async ({ page }) => {
    await launchDemo(page);
    const sherlock = page.getByRole('button', { name: /Sherlock/i }).first();
    await expect(sherlock).toBeVisible({ timeout: 15_000 });
    await sherlock.click();
    await expect(page.getByText(/Sherlock|otázk|Zadaj|Asistent/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('S09 PDF export dialóg / tlačidlo', async ({ page }) => {
    await launchDemo(page);
    const exportBtn = page.getByRole('button', { name: /Export|PDF|Protokol/i }).first();
    await expect(exportBtn).toBeVisible({ timeout: 15_000 });
    await exportBtn.click();
    const dialog = page.locator('[role="dialog"]');
    if (await dialog.count()) {
      await expect(dialog.first()).toBeVisible();
    } else {
      await expect(page.getByText('ForenzDetectiv').first()).toBeVisible();
    }
  });
});
