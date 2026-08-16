import { test, expect } from '@playwright/test';
import { gotoApp, dismissQuickTipIfPresent, openIndexedDbMeta } from '../helpers.js';

test.describe('S01 — Onboarding, Guest Mode & IndexedDB', () => {
  test('HomeHero dark motif, CTA a guest admin user', async ({ page }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);

    await expect(page).toHaveTitle(/ForenzDetectiv/i);
    await expect(page.locator('text=ForenzDetectiv AI').first()).toBeVisible();
    await expect(page.locator('.bg-slate-950').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Spustiť Demo spis|Spustit demo/i }).first()).toBeVisible();
  });

  test('IndexedDB ForenzDetectiv_OfflineDB v2 so store-mi', async ({ page }) => {
    await gotoApp(page);
    const meta = await openIndexedDbMeta(page);
    expect(meta.name).toBe('ForenzDetectiv_OfflineDB');
    expect(meta.version).toBe(2);
    for (const store of ['cases', 'documents', 'analysis_cache', 'file_blobs']) {
      expect(meta.stores).toContain(store);
    }
  });

  test('Offline sieť — app nespadne na bielu obrazovku', async ({ page, context }) => {
    await gotoApp(page);
    await dismissQuickTipIfPresent(page);
    await context.setOffline(true);
    // Bez reload (ERR_INTERNET_DISCONNECTED) — client-side navigácia
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await expect(page.getByText('ForenzDetectiv').first()).toBeVisible();
    await expect(page.locator('body')).not.toBeEmpty();
    await context.setOffline(false);
  });
});
