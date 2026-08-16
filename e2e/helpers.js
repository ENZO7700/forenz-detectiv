/**
 * Shared helpers for Master E2E (PROMPT scenarios 01–12).
 */
import { expect } from '@playwright/test';

export async function gotoApp(page, path = '/') {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}

export async function dismissQuickTipIfPresent(page) {
  const close = page.getByRole('button', { name: /Zavrieť tip|Zavřít tip|Close/i });
  if (await close.isVisible().catch(() => false)) {
    await close.click();
  }
}

export async function launchDemo(page) {
  await gotoApp(page);
  await dismissQuickTipIfPresent(page);
  const demoBtn = page.getByRole('button', { name: /Spustiť Demo spis|Spustit demo|Demo spis/i }).first();
  await expect(demoBtn).toBeVisible({ timeout: 15_000 });
  await demoBtn.click();
  // Demo scanning delay ~1.4s then map
  await expect(page.getByRole('button', { name: /Alibi mapa|Mapa|Alibi/i }).or(page.locator('text=/Bratislava|Košice|Praha|Brno/i').first())).toBeVisible({
    timeout: 20_000
  });
}

export async function openIndexedDbMeta(page) {
  return page.evaluate(async () => {
    const DB_NAME = 'ForenzDetectiv_OfflineDB';
    const DB_VERSION = 2;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error || new Error('IDB open failed'));
      req.onsuccess = () => {
        const db = req.result;
        const stores = Array.from(db.objectStoreNames);
        db.close();
        resolve({ name: DB_NAME, version: DB_VERSION, stores });
      };
      req.onupgradeneeded = () => {
        // App may create stores; if test opens first, create minimal schema
        const db = req.result;
        for (const name of ['cases', 'documents', 'analysis_cache', 'file_blobs']) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: name === 'analysis_cache' ? 'key' : 'id' });
          }
        }
      };
    });
  });
}

/** Oversized PDF for gate tests — allocates in Node, streams to input. */
export function makePdfBuffer(sizeBytes, name = 'spis.pdf') {
  const buf = Buffer.alloc(Math.max(sizeBytes, 8));
  buf.write('%PDF-1.4', 0, 'ascii');
  return { name, mimeType: 'application/pdf', buffer: buf };
}

export async function expectToastMatching(page, pattern) {
  const toast = page.getByTestId('app-toast');
  await expect(toast).toBeVisible({ timeout: 10_000 });
  await expect(toast).toContainText(pattern);
}
