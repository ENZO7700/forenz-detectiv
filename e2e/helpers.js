/**
 * Shared helpers for Master E2E (PROMPT scenarios 01–12).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect } from '@playwright/test';

export async function gotoApp(page, pathName = '/') {
  await page.goto(pathName);
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByText('ForenzDetectiv').first()).toBeVisible({ timeout: 20_000 });
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
  await expect(
    page.getByRole('button', { name: /Pavúk vzťahov|Pavúk/i }).first()
  ).toBeVisible({ timeout: 20_000 });
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

/** Write PDF fixture to temp file (Playwright rejects in-memory buffers > 50MB). */
export function writePdfFixture(sizeBytes, fileName = 'spis.pdf') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'forenz-e2e-'));
  const filePath = path.join(dir, fileName);
  const fd = fs.openSync(filePath, 'w');
  fs.writeSync(fd, Buffer.from('%PDF-1.4\n'));
  const remaining = Math.max(0, sizeBytes - 8);
  const chunk = Buffer.alloc(1024 * 1024, 0);
  let written = 0;
  while (written < remaining) {
    const n = Math.min(chunk.length, remaining - written);
    fs.writeSync(fd, chunk, 0, n);
    written += n;
  }
  fs.closeSync(fd);
  return filePath;
}

export async function expectToastMatching(page, pattern) {
  const toast = page.getByTestId('app-toast');
  await expect(toast).toBeVisible({ timeout: 10_000 });
  await expect(toast).toContainText(pattern);
}

export async function openPricingModal(page) {
  // Desktop header plan badge
  const planBtn = page.getByRole('button', { name: /Free|Pro|Agency/i }).first();
  if (await planBtn.isVisible().catch(() => false)) {
    await planBtn.click();
    return;
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByText(/^Cenník$|Pricing/i).first().click();
}
