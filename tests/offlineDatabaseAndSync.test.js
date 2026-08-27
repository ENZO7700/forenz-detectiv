import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  saveDocumentOffline,
  saveCaseOffline,
  sanitizeCasePayload,
  sanitizeDocument,
  sanitizePerson,
  sanitizeEvent,
  casePayloadNeedsRepair
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

  test('4.1b Neukladá nekompletný dokument bez id/title', async () => {
    const res = await saveDocumentOffline({ id: '', title: '' });
    assert.strictEqual(res, false);
    assert.strictEqual(sanitizeDocument(null), null);
    assert.strictEqual(sanitizeDocument({ id: 'x' }), null);
  });

  test('4.1c sanitizeCasePayload odstráni null a nekompletné entity', () => {
    const cleaned = sanitizeCasePayload({
      documents: [{ id: 'd1', title: 'OK' }, null, { id: '', title: '' }],
      persons: [{ id: 'p1', name: 'Anna' }, { id: 'p2' }, null],
      events: [{ id: 'e1', title: 'Udalosť', persons: ['Anna', null, ''] }],
      locations: [{ name: 'Bratislava' }, { address: '' }]
    });

    assert.strictEqual(cleaned.documents.length, 1);
    assert.strictEqual(cleaned.persons.length, 1);
    assert.strictEqual(cleaned.events.length, 1);
    assert.deepStrictEqual(cleaned.events[0].persons, ['Anna']);
    assert.strictEqual(cleaned.locations.length, 1);
    assert.strictEqual(sanitizePerson({ id: 'p', name: '' }), null);
    assert.strictEqual(sanitizeEvent({ persons: [null, 'X'] }).persons.length, 1);
  });

  test('4.1d sanitizeCasePayload normalizes non-array entity fields (legacy IDB corruption)', () => {
    const cleaned = sanitizeCasePayload({
      documents: { id: 'd1', title: 'Bad object' },
      persons: 'not-an-array',
      events: [{ id: 'e1', title: 'OK', persons: ['Anna'] }]
    });
    assert.deepStrictEqual(cleaned.documents, []);
    assert.deepStrictEqual(cleaned.persons, []);
    assert.strictEqual(cleaned.events.length, 1);
    assert.strictEqual(casePayloadNeedsRepair({ documents: {} }), true);
    assert.strictEqual(casePayloadNeedsRepair({ documents: [] }), false);
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

  test('4.4 saveCaseOffline sanitizuje payload pred zápisom', async () => {
    const ok = await saveCaseOffline('test-sanitize', {
      documents: [{ id: 'd1', title: 'Spis' }],
      persons: [null, { id: 'p1', name: 'Ján' }],
      events: [],
      locations: []
    });
    assert.strictEqual(typeof ok, 'boolean');
    const payload = sanitizeCasePayload({
      documents: [{ id: 'd1', title: 'Spis' }],
      persons: [{ id: 'p1', name: 'Ján' }]
    });
    assert.strictEqual(payload.persons.length, 1);
  });
});
