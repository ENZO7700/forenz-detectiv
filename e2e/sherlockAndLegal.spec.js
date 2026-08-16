import { test, expect } from '@playwright/test';

test.describe('ForenzDetectiv - Sherlock AI & Legal Source of Truth v prehliadači', () => {
  test('Otvorenie Sherlock AI a odoslanie otázky k prípadu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Nájdi tlačidlo na otvorenie Sherlocka
    const sherlockTrigger = page.locator('button').filter({ hasText: /Sherlock|AI/i }).first();
    if (await sherlockTrigger.isVisible()) {
      await sherlockTrigger.click();
      await page.waitForTimeout(500);

      // Nájdi vstupné textové pole pre otázku
      const inputField = page.locator('input[placeholder*="otázku"], textarea[placeholder*="otázku"], input[type="text"]').last();
      if (await inputField.isVisible()) {
        await inputField.fill('Aké sú kľúčové rozpory a alibi v tomto prípade?');
        
        // Nájdi tlačidlo Odoslať
        const sendBtn = page.locator('button').filter({ hasText: /Odoslať|Send/i }).or(page.locator('button:has(svg)')).last();
        if (await sendBtn.isVisible()) {
          await sendBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('Overenie tlačidla PDF exportu protokolu vyšetrovania', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Nájdi tlačidlo Exportovať PDF / Protokol
    const exportBtn = page.locator('button, a').filter({ hasText: /Export|PDF|Stiahnuť protokol|Protokol/i }).first();
    await expect(exportBtn).toBeVisible({ timeout: 10000 });
  });
});
