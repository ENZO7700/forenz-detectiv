import { afterEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { checkRate } from '../base44/shared/rateLimit.ts';
import { detectPair, runContradictionDetection } from '../base44/shared/contradictionEngine.ts';
import { createLegalAssessment } from '../base44/shared/legalAssessment.ts';
import {
  evaluateTravelFeasibility,
  getDistanceBetweenLocationsKm,
  getMinTravelTimeMinutes,
  normalizeLocationName,
  resolveLocationCoords
} from '../base44/shared/geospatialEngine.ts';

const REAL_DATE_NOW = Date.now;

afterEach(() => {
  Date.now = REAL_DATE_NOW;
});

function createRateLimitClient({ existing = [], fail = false } = {}) {
  const calls = { filter: [], create: [], update: [] };
  const entities = {
    RateLimit: {
      async filter(query) {
        calls.filter.push(query);
        if (fail) throw new Error('Databáza nie je dostupná');
        return existing;
      },
      async create(record) {
        calls.create.push(record);
      },
      async update(id, patch) {
        calls.update.push({ id, patch });
      }
    }
  };

  return { client: { entities }, calls };
}

function claim(overrides = {}) {
  return {
    id: 'claim-a',
    document_id: 'doc-a',
    document_title: 'Výpoveď A',
    subject: 'Ján Novák',
    predicate: 'bol_v',
    location: 'Bratislava',
    event_date: '2026-08-15',
    event_time: '14:00',
    approximate_time: false,
    confidence: 0.9,
    ...overrides
  };
}

describe('Diagnostic coverage: rate limiting', () => {
  test('vytvorí záznam v aktuálnom fixnom okne pri prvom požiadavku', async () => {
    Date.now = () => Date.parse('2026-08-16T10:07:30.000Z');
    const { client, calls } = createRateLimitClient();

    const result = await checkRate(client, 'user-1', 3, 60_000);

    assert.deepEqual(result, { ok: true });
    assert.equal(calls.create.length, 1);
    assert.deepEqual(calls.create[0], {
      key: 'user-1',
      window: '2026-08-16T10:07:00.000Z',
      count: 1
    });
  });

  test('zvýši existujúce počítadlo a pri dosiahnutom limite nevyžaduje zápis', async () => {
    Date.now = () => Date.parse('2026-08-16T10:07:30.000Z');
    const existing = [{ id: 'rate-1', count: 2 }];
    const { client, calls } = createRateLimitClient({ existing });

    assert.deepEqual(await checkRate(client, 'user-1', 3, 60_000), { ok: true });
    assert.deepEqual(calls.update, [{ id: 'rate-1', patch: { count: 3 } }]);

    existing[0].count = 3;
    const blocked = await checkRate(client, 'user-1', 3, 60_000);
    assert.deepEqual(blocked, { ok: false, retryAfterMs: 30_000 });
    assert.equal(calls.update.length, 1);
  });

  test('pri chybe databázy fail-open nezablokuje oprávneného používateľa', async () => {
    const { client } = createRateLimitClient({ fail: true });
    assert.deepEqual(await checkRate(client, 'user-1', 3, 60_000), { ok: true });
  });
});

describe('Diagnostic coverage: contradiction detection', () => {
  test('možný subjekt, nekompatibilný predikát a kompatibilná lokalita nevytvoria falošný rozpor', () => {
    assert.equal(detectPair(claim(), claim({ subject: 'Janko Novák', document_id: 'doc-b', location: 'Košice' })), null);
    assert.equal(detectPair(claim(), claim({ document_id: 'doc-b', predicate: 'vlastní', object: 'auto', location: '' })), null);
    assert.equal(detectPair(claim(), claim({ document_id: 'doc-b', location: 'Bratislava-Ružinov' })), null);
  });

  test('faktický rozpor bez lokality je iba možný, keď čas chýba', () => {
    const result = detectPair(claim({ predicate: 'vlastní', location: '', object: 'červené vozidlo', event_time: null }), claim({
      id: 'claim-b',
      document_id: 'doc-b',
      predicate: 'vlastní',
      location: '',
      object: 'modré vozidlo',
      event_time: null
    }));

    assert.equal(result?.type, 'factual_conflict');
    assert.equal(result?.status, 'possible');
  });

  test('scope dokumentu odstráni len dotknuté rozpory, deduplikuje dvojice a uloží výsledok', async () => {
    const claims = [
      claim(),
      claim({ id: 'claim-b', document_id: 'doc-b', document_title: 'Výpoveď B', location: 'Košice' }),
      claim({ id: 'claim-c', document_id: 'doc-c', document_title: 'Výpoveď C', location: 'Košice' })
    ];
    const calls = { deleted: [], created: [] };
    const client = {
      entities: {
        ForensicClaim: { async filter() { return claims; } },
        Contradiction: {
          async deleteMany(query) { calls.deleted.push(query); },
          async bulkCreate(records) { calls.created.push(...records); }
        }
      }
    };

    const result = await runContradictionDetection(client, 'owner-1', 'doc-a');

    assert.deepEqual(calls.deleted, [{ document_a_id: 'doc-a' }, { document_b_id: 'doc-a' }]);
    assert.equal(result.scope, 'document');
    assert.equal(result.candidates, 2);
    assert.equal(result.created, 2);
    assert.equal(calls.created.length, 2);
  });
});

describe('Diagnostic coverage: geospatial and legal guardrails', () => {
  test('normalizácia rozpozná slovenské skloňovanie a neznáme miesto zostane bez súradníc', () => {
    assert.equal(normalizeLocationName('V meste Košiciach'), 'kosiciach');
    assert.deepEqual(resolveLocationCoords('v Košiciach'), resolveLocationCoords('Košice'));
    assert.equal(resolveLocationCoords('Neexistujúca obec'), null);
    assert.equal(getDistanceBetweenLocationsKm('Bratislava', 'Neexistujúca obec'), null);
  });

  test('geospatial engine ošetrí lokálny presun, neplatný čas a high severity', () => {
    assert.equal(getMinTravelTimeMinutes(5), 8);
    assert.equal(evaluateTravelFeasibility('Bratislava', '14:00', 'Bratislava', '14:01'), null);
    assert.equal(evaluateTravelFeasibility('Bratislava', 'neplatný', 'Košice', '16:00'), null);

    const result = evaluateTravelFeasibility('Bratislava', '08:00', 'Košice', '11:00');
    assert.equal(result?.isFeasible, false);
    assert.equal(result?.severity, 'high');
  });

  test('právne posúdenie vyžaduje citát zo spisu aj pri platnom paragrafe', () => {
    const withoutQuote = createLegalAssessment('346', [{ subject: 'Svedok', predicate: 'uviedol', object: 'alibi' }]);
    assert.equal(withoutQuote.status, 'insufficient_evidence');
    assert.deepEqual(withoutQuote.supportingClaims, []);
    assert.equal(withoutQuote.requiresHumanReview, true);

    const withQuote = createLegalAssessment('346', [{
      subject: 'Svedok',
      predicate: 'uviedol',
      object: 'alibi',
      source_quote: 'O 14:00 som bol v Bratislave.'
    }]);
    assert.equal(withQuote.status, 'potentially_relevant');
    assert.equal(withQuote.supportingClaims.length, 1);
    assert.equal(withQuote.sourceEvidence[0].paragraph, '346');
  });
});
