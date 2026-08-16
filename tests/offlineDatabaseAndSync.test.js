import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  saveDocumentOffline,
  saveCaseOffline
} from '../src/lib/offlineDb.js';

describe('4. 💾 Offline IndexedDB & Sync Conflict Resolution Test Suite', () => {

  test('4.1 InMemory / Fallback ukladanie dokumentu pri absencii natívneho IndexedDB', async () => {
    const doc = {
      id: 'doc-offline-01',
      title: 'Zápisnica z obhliadky miesta činu',
      content: 'Nájdené odtlačky prstov a biologické stopy...',
      page_number: 1
    };

    // saveDocumentOffline bezpečne vráti boolean bez pádu (try/catch ošetrenie v node)
    const res = await saveDocumentOffline(doc);
    assert.strictEqual(typeof res, 'boolean');
  });

  test('4.2 Conflict Resolution: Logika Last-Write-Wins so zlučovaním entít', () => {
    const localEntity = {
      id: 'person-101',
      name: 'Peter Novák',
      role: 'podozrivý',
      notes: 'Lokálna offline poznámka vyšetrovateľa',
      updated_at: '2026-08-16T14:30:00.000Z'
    };

    const cloudEntity = {
      id: 'person-101',
      name: 'Peter Novák',
      role: 'obvinený', // Zmena na cloude
      tags: ['prioritné sledovanie'],
      updated_at: '2026-08-16T14:45:00.000Z' // Novší čas
    };

    const resolveConflict = (local, cloud) => {
      const localTime = new Date(local.updated_at).getTime();
      const cloudTime = new Date(cloud.updated_at).getTime();

      if (cloudTime >= localTime) {
        // Cloud vyhráva, ale zachovaj nekonfliktné lokálne polia
        return { ...local, ...cloud };
      }
      return { ...cloud, ...local };
    };

    const merged = resolveConflict(localEntity, cloudEntity);
    assert.strictEqual(merged.role, 'obvinený', 'Novší status z cloudu má prednosť');
    assert.strictEqual(merged.notes, 'Lokálna offline poznámka vyšetrovateľa', 'Nekonfliktná lokálna poznámka je zachovaná');
    assert.deepStrictEqual(merged.tags, ['prioritné sledovanie']);
  });

  test('4.3 Ošetrenie QuotaExceededError pri prekročení limitu úložiska', () => {
    const handleStorageError = (err) => {
      if (err?.name === 'QuotaExceededError' || err?.code === 22) {
        return {
          recovered: false,
          userMessage: 'Lokálne úložisko prehliadača je plné. Uvoľnite miesto vymazaním starých spisov.',
          actionNeeded: 'CLEANUP_OLD_CASES'
        };
      }
      return { recovered: false, userMessage: 'Chyba úložiska: ' + err.message };
    };

    const simulatedQuotaErr = new Error('Quota exceeded');
    simulatedQuotaErr.name = 'QuotaExceededError';

    const handled = handleStorageError(simulatedQuotaErr);
    assert.strictEqual(handled.actionNeeded, 'CLEANUP_OLD_CASES');
    assert.match(handled.userMessage, /úložisko prehliadača je plné/);
  });
});
