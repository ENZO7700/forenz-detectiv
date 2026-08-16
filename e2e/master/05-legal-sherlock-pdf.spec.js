import { test, expect } from '@playwright/test';
import { gotoApp, dismissQuickTipIfPresent, launchDemo } from '../helpers.js';

test.describe('S05/S08/S09 — Legal smoke, Sherlock, PDF export', () => {
  test('S05 smoke: Home obsahuje forenzný copy', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);
    await expect(page.getByText(/rozpory|alibi|ForenzDetectiv AI|nemožné/i).first()).toBeVisible();
  });

  test('S08 Sherlock panel sa otvorí', async ({ page }) => {
    await launchDemo(page);
    const sherlock = page.getByRole('button', { name: /^Sherlock$/i }).or(
      page.getByRole('button', { name: /Sherlock/i })
    ).first();
    await expect(sherlock).toBeVisible({ timeout: 15_000 });
    await sherlock.click();
    await expect(page.getByText(/Sherlock|otázk|Zadaj|Asistent/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('S09 PDF export dialóg / tlačidlo Report PDF', async ({ page }) => {
    await launchDemo(page);
    const exportBtn = page.getByRole('button', { name: /Report PDF/i });
    await expect(exportBtn).toBeVisible({ timeout: 15_000 });
    await exportBtn.click();
    await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 10_000 });
  });
});
