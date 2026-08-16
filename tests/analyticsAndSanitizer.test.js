import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeAnalyticsProps, trackEvent, trackContradictionViewed, trackDemoLaunched } from '../src/lib/analytics.js';
import { sanitizeDiagnosticData } from '../src/lib/sentry.js';
import { DEMO_CASE_DATA } from '../src/data/demoCaseData.js';

describe('Privacy & Telemetry Sanitization Tests', () => {
  test('sanitizeAnalyticsProps striktne odstraňuje mená, citácie a texty výpovedí', () => {
    const rawData = {
      case_id: 'case-123',
      file_type: 'pdf',
      person_name: 'Ján Novák',
      witness_name: 'Peter Kováč',
      quote: 'Videl som ho o 14:15 s taškou',
      source_text: 'Kompletná výpoveď svedka...',
      address: 'Dunajská 12, Bratislava',
      contradiction_type: 'alibi_impossible',
      speed_kmh: 675
    };

    const sanitized = sanitizeAnalyticsProps(rawData);

    assert.equal(sanitized.case_id, 'case-123');
    assert.equal(sanitized.file_type, 'pdf');
    assert.equal(sanitized.contradiction_type, 'alibi_impossible');
    assert.equal(sanitized.speed_kmh, 675);
    assert.equal('person_name' in sanitized, false);
    assert.equal('witness_name' in sanitized, false);
    assert.equal('quote' in sanitized, false);
    assert.equal('source_text' in sanitized, false);
    assert.equal('address' in sanitized, false);
  });

  test('sanitizeDiagnosticData nahradí citlivé polia za anonymizovaný placeholder', () => {
    const context = {
      component: 'GraphCanvas',
      props: {
        document_id: 'doc-1',
        source_quote: 'Dôverná výpoveď podozrivého...',
        full_name: 'Jozef Mrkvička'
      }
    };

    const sanitized = sanitizeDiagnosticData(context);

    assert.equal(sanitized.component, 'GraphCanvas');
    assert.equal(sanitized.props.document_id, 'doc-1');
    assert.equal(sanitized.props.source_quote, '[ANONYMIZED_FORENSIC_DATA]');
    assert.equal(sanitized.props.full_name, '[ANONYMIZED_FORENSIC_DATA]');
  });

  test('Telemetrické funkcie fungujú bezpečne aj bez prítomnosti PostHog SDK (no-op)', () => {
    assert.doesNotThrow(() => {
      trackEvent('case_created', { file_count: 3 });
      trackContradictionViewed('alibi_impossible', 12);
      trackDemoLaunched('ba-ke');
    });
  });
});

describe('Demo Case Dataset (Kauza Bratislava – Košice)', () => {
  test('DEMO_CASE_DATA obsahuje kompletné entity a aspoň 2 rozpory', () => {
    assert.ok(DEMO_CASE_DATA.documents.length >= 3);
    assert.ok(DEMO_CASE_DATA.persons.length >= 3);
    assert.ok(DEMO_CASE_DATA.locations.length >= 3);
    assert.ok(DEMO_CASE_DATA.contradictions.length >= 2);

    const alibiContra = DEMO_CASE_DATA.contradictions.find((c) => c.type === 'alibi_impossible');
    assert.ok(alibiContra, 'Musí existovať alibi_impossible rozpor');
    assert.equal(alibiContra.speed_kmh, 675);
    assert.equal(alibiContra.distance_km, 450);
    assert.equal(alibiContra.time_delta_minutes, 40);
    assert.ok(alibiContra.source_quote_a.length > 10);
    assert.ok(alibiContra.source_quote_b.length > 10);
  });

  test('CZ_DEMO_CASE_DATA export je dostupný a obsahuje alibi rozpor', async () => {
    const { CZ_DEMO_CASE_DATA, CZ_DEMO_CASE } = await import('../src/data/index.js');
    assert.ok(CZ_DEMO_CASE);
    assert.strictEqual(CZ_DEMO_CASE, CZ_DEMO_CASE_DATA);
    assert.ok(CZ_DEMO_CASE_DATA.contradictions?.length >= 1);
    assert.ok(CZ_DEMO_CASE_DATA.persons?.length >= 1);
  });
});
