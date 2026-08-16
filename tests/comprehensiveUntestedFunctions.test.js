import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { redirectToCheckout } from '../src/lib/stripe.js';
import { prepareFileForUpload, base64DataUrlToBlobFile } from '../src/lib/imageProcessor.js';
import { usePlanStore } from '../src/store/usePlanStore.js';
import { useAuditStore } from '../src/store/useAuditStore.js';
import {
  trackContradictionDetected,
  trackFileUploaded,
  trackPdfExported,
  trackCaseCreated,
  sanitizeAnalyticsProps
} from '../src/lib/analytics.js';

describe('1. Stripe Checkout & Monetization Functions (src/lib/stripe.js)', () => {
  test('redirectToCheckout vracia testMode objekt pri absencii živého kľúča', async () => {
    const result = await redirectToCheckout({ plan: 'pro', interval: 'year' });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.testMode, true);
    assert.strictEqual(result.plan, 'pro');
    assert.strictEqual(result.interval, 'year');
  });

  test('redirectToCheckout podporuje predvolené parametre (plan=pro, interval=month)', async () => {
    const result = await redirectToCheckout({});
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.plan, 'pro');
    assert.strictEqual(result.interval, 'month');
  });
});

describe('2. Image & File Pre-Processor Functions (src/lib/imageProcessor.js)', () => {
  test('prepareFileForUpload zachováva PDF súbor ako natívny File bez Image/Canvas normalizácie', async () => {
    const pdfFile = {
      name: 'vysetrovaci_spis_kauza.pdf',
      size: 35 * 1024 * 1024,
      type: 'application/pdf'
    };

    const out = await prepareFileForUpload(pdfFile);
    assert.strictEqual(out, pdfFile);
    assert.strictEqual(out.name, 'vysetrovaci_spis_kauza.pdf');
    assert.strictEqual(out.type, 'application/pdf');
  });

  test('prepareFileForUpload zachováva textové formáty (.txt, .docx, .odt, .doc)', async () => {
    const textFiles = [
      { name: 'zapisnica_vypovede.txt', type: 'text/plain', size: 12400 },
      { name: 'protokol.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 85000 },
      { name: 'posudok.odt', type: 'application/vnd.oasis.opendocument.text', size: 45000 },
      { name: 'dokument.doc', type: 'application/msword', size: 65000 }
    ];

    for (const file of textFiles) {
      const out = await prepareFileForUpload(file);
      assert.strictEqual(out, file, `Formát ${file.name} musí byť vrátený priamo`);
    }
  });

  test('prepareFileForUpload bezpečne vracia null/undefined pri prázdnom vstupe', async () => {
    const outNull = await prepareFileForUpload(null);
    assert.strictEqual(outNull, null);

    const outUndefined = await prepareFileForUpload(undefined);
    assert.strictEqual(outUndefined, undefined);
  });

  test('base64DataUrlToBlobFile vytvára platný binárny File objekt', () => {
    // 1x1 transparent PNG data URL
    const pngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const file = base64DataUrlToBlobFile(pngBase64, 'vypoved_fotodokumentacia.png');

    assert.ok(file);
    assert.strictEqual(file.name, 'vypoved_fotodokumentacia.jpg');
    assert.ok(file.size > 0);
    assert.strictEqual(file.type, 'image/png');
  });
});

describe('3. Plan & License Store Functions (src/store/usePlanStore.js)', () => {
  test('activateLicenseKey úspešne aktivuje všetky validné promo kľúče', () => {
    const store = usePlanStore.getState();

    // PRO-LAWYER-2026
    const res1 = store.activateLicenseKey('PRO-LAWYER-2026');
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.plan, 'pro');
    assert.strictEqual(res1.days, 365);
    assert.strictEqual(usePlanStore.getState().plan, 'pro');

    // AGENCY-PARTNER
    const res2 = store.activateLicenseKey('agency-partner'); // test case-insensitivity
    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.plan, 'agency');

    // Neplatný kľúč
    const resInvalid = store.activateLicenseKey('NEPLATNY-KLUC-999');
    assert.strictEqual(resInvalid.success, false);
    assert.ok(resInvalid.error);
  });

  test('canCreateCase a canAddDocument správne vyhodnocujú limity podľa plánu', () => {
    const store = usePlanStore.getState();

    // V stave pro / agency sú limity neobmedzené
    store.upgradePlan('pro');
    assert.strictEqual(store.canCreateCase(10), true);
    assert.strictEqual(store.canAddDocument(100), true);

    // V stave free
    store.upgradePlan('free');
    assert.strictEqual(store.canCreateCase(0), true);
    assert.strictEqual(store.canCreateCase(1), true);
    assert.strictEqual(store.canCreateCase(2), false);

    assert.strictEqual(store.canAddDocument(0), true);
    assert.strictEqual(store.canAddDocument(4), true);
    assert.strictEqual(store.canAddDocument(5), false);
  });

  test('getReferralLink generuje platný formát referral URL', () => {
    const store = usePlanStore.getState();
    const refLink = store.getReferralLink();
    assert.ok(refLink.includes('?ref='));
  });
});

describe('4. Audit Logging & Chain of Custody (src/store/useAuditStore.js)', () => {
  test('logAction vytvorí štruktúrovaný záznam s časovou pečiatkou a ID', () => {
    const auditStore = useAuditStore.getState();
    auditStore.clearLogs();

    const entry = auditStore.logAction('CASE_CREATED', { source: 'upload', caseId: 'K-900' });

    assert.ok(entry.id.startsWith('LOG-'));
    assert.strictEqual(entry.action, 'CASE_CREATED');
    assert.strictEqual(entry.details.caseId, 'K-900');
    assert.strictEqual(entry.userRole, 'Vyšetrovateľ / Obhajca');
    assert.ok(entry.timestamp);

    const logs = useAuditStore.getState().logs;
    assert.strictEqual(logs.length, 1);
    assert.strictEqual(logs[0].id, entry.id);
  });

  test('clearLogs vyčistí auditnú stopu', () => {
    const auditStore = useAuditStore.getState();
    auditStore.logAction('DOC_UPLOADED', { docId: 'd1' });
    auditStore.logAction('AI_ANALYSIS', { docId: 'd1' });

    assert.ok(useAuditStore.getState().logs.length >= 2);
    auditStore.clearLogs();
    assert.strictEqual(useAuditStore.getState().logs.length, 0);
  });
});

describe('5. Telemetry & Sanitization Functions (src/lib/analytics.js)', () => {
  test('Všetky analytické funkcie bezpečne prebehnú bez vyhodenia výnimky', () => {
    assert.doesNotThrow(() => {
      trackContradictionDetected(3, true);
      trackFileUploaded('pdf', 1024);
      trackPdfExported('full_report', 5);
      trackCaseCreated('hero_upload', 2);
    });
  });

  test('sanitizeAnalyticsProps striktne odstraňuje citlivé forenzné dáta a PII', () => {
    const dirty = {
      event_type: 'contradiction_detected',
      case_id: 'case-123',
      suspect_name: 'Milan Podozrivý',
      witness_statement: 'Videl som obvineného o 22:00 v aute...',
      national_id: '850101/1234',
      contradiction_count: 3
    };

    const clean = sanitizeAnalyticsProps(dirty);

    assert.strictEqual(clean.event_type, 'contradiction_detected');
    assert.strictEqual(clean.case_id, 'case-123');
    assert.strictEqual(clean.contradiction_count, 3);
    assert.strictEqual('suspect_name' in clean, false);
    assert.strictEqual('witness_statement' in clean, false);
    assert.strictEqual('national_id' in clean, false);
  });
});
