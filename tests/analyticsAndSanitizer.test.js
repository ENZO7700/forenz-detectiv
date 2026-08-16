import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeAnalyticsProps, trackEvent, trackContradictionViewed, trackDemoLaunched } from '../src/lib/analytics.js';
import { sanitizeDiagnosticData } from '../src/lib/sentry.js';
import { validateUploadSize, MAX_FILE_SIZE_BYTES, PIPELINE_STEPS, PDF_PAGE_CHUNKING_IMPLEMENTED } from '../src/lib/documentPipeline.js';

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

describe('Production upload pipeline helpers', () => {
  test('validateUploadSize odmietne súbory nad 50 MB', () => {
    const ok = validateUploadSize({ size: 1024 });
    assert.equal(ok.ok, true);
    const bad = validateUploadSize({ size: MAX_FILE_SIZE_BYTES + 1 });
    assert.equal(bad.ok, false);
    assert.ok(bad.sizeKb > 50_000);
  });

  test('pipeline kroky obsahujú PDF chunking a flag je zapnutý', () => {
    assert.ok(PIPELINE_STEPS.length >= 6);
    assert.ok(PIPELINE_STEPS.some((s) => s.id === 'chunk'));
    assert.equal(PDF_PAGE_CHUNKING_IMPLEMENTED, true);
  });
});
