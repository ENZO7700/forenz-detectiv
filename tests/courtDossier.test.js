import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  CROSS_EXAM_MODES,
  buildCitation,
  hasValidCitation,
  validateQuestionSet,
  generateTemplateQuestions,
  generateCrossExamination
} from '../src/lib/crossExamination.js';

import {
  contradictionsToCsv,
  createPlaceholderPng2k,
  exportCourtDossier
} from '../src/lib/courtDossier.js';

import { buildZipStore, listZipStoreEntries, crc32 } from '../src/lib/zipStore.js';
import { buildSha256Chain, calculateSha256Digest, generateCaseIntegrityDigest } from '../src/utils/cryptoUtils.js';

const FIXTURE_DOCS = [
  {
    id: 'doc-a',
    title: 'Výpoveď svedka Novák · s. 4',
    page_number: 4,
    content: 'Bol som v Bratislave o 14:15.'
  },
  {
    id: 'doc-b',
    title: 'Kamerový záznam Košice',
    page_number: 12,
    content: 'Obvinený preberal tovar o 14:55.'
  }
];

const FIXTURE_CLAIMS = [
  {
    id: 'claim-a',
    document_id: 'doc-a',
    document_title: 'Výpoveď svedka Novák · s. 4',
    subject: 'Peter Kováč',
    location: 'Bratislava',
    event_time: '14:15',
    source_quote: 'Bol som v Bratislave o 14:15',
    page_number: 4,
    line_number: 18
  },
  {
    id: 'claim-b',
    document_id: 'doc-b',
    document_title: 'Kamerový záznam Košice',
    subject: 'Peter Kováč',
    location: 'Košice',
    event_time: '14:55',
    source_quote: 'Obvinený preberal tovar o 14:55',
    page_number: 12,
    line_number: 3
  }
];

const FIXTURE_CONTRADICTION = {
  id: 'c-1',
  claim_a_id: 'claim-a',
  claim_b_id: 'claim-b',
  document_a_id: 'doc-a',
  document_b_id: 'doc-b',
  entity_ref: 'Peter Kováč',
  type: 'location_time_conflict',
  severity: 'high',
  status: 'confirmed',
  confidence: 0.9,
  explanation: 'Nemožný presun Bratislava → Košice za 40 minút',
  quoteA: 'Bol som v Bratislave o 14:15',
  quoteB: 'Obvinený preberal tovar o 14:55',
  locationA: 'Bratislava',
  locationB: 'Košice',
  timeA: '14:15',
  timeB: '14:55'
};

describe('Cross-Examination citation & modes', () => {
  test('tri taktické režimy sú definované so SK názvami', () => {
    assert.equal(CROSS_EXAM_MODES.mild.label, 'Mierny výsluch svedka');
    assert.equal(CROSS_EXAM_MODES.aggressive.label, 'Agresívny krížový výslech obhajoby');
    assert.equal(CROSS_EXAM_MODES.alibi.label, 'Detailná verifikácia alibi');
  });

  test('buildCitation obsahuje stranu alebo dokument + pasáž', () => {
    const c = buildCitation(
      {
        document_id: 'doc-a',
        source_quote: 'Bol som v Bratislave o 14:15',
        page_number: 4,
        line_number: 18
      },
      FIXTURE_DOCS
    );
    assert.match(c.text, /s\.\s*4/);
    assert.match(c.text, /riad\.\s*18/);
    assert.match(c.text, /pasáž:/);
    assert.equal(hasValidCitation(c.text), true);
  });

  test('otázka bez citácie je zamietnutá', () => {
    assert.equal(hasValidCitation({ question: 'Kde ste boli?', citationText: '' }), false);
    assert.equal(hasValidCitation({ question: 'Kde ste boli?', citation: { text: '' } }), false);
  });

  test('každý režim generuje otázky s validnou citáciou', async () => {
    for (const mode of Object.keys(CROSS_EXAM_MODES)) {
      const qs = generateTemplateQuestions({
        target: FIXTURE_CONTRADICTION,
        mode,
        documents: FIXTURE_DOCS,
        claims: FIXTURE_CLAIMS
      });
      assert.ok(qs.length >= 3, `mode ${mode} must produce questions`);
      const validation = validateQuestionSet(qs);
      assert.equal(validation.ok, true, `mode ${mode}: ${JSON.stringify(validation.invalid)}`);
      for (const q of qs) {
        assert.equal(hasValidCitation(q), true, q.question);
        assert.ok(q.citationText || q.citation?.text);
      }
    }
  });

  test('generateCrossExamination je deterministický (template) a validuje citácie', async () => {
    const a = await generateCrossExamination({
      target: FIXTURE_CONTRADICTION,
      mode: 'alibi',
      documents: FIXTURE_DOCS,
      claims: FIXTURE_CLAIMS
    });
    const b = await generateCrossExamination({
      target: FIXTURE_CONTRADICTION,
      mode: 'alibi',
      documents: FIXTURE_DOCS,
      claims: FIXTURE_CLAIMS
    });
    assert.equal(a.source, 'template');
    assert.deepEqual(
      a.questions.map((q) => q.question),
      b.questions.map((q) => q.question)
    );
    assert.equal(a.validation.ok, true);
  });

  test('AI bez citácie spadne na template fallback', async () => {
    const out = await generateCrossExamination({
      target: FIXTURE_CONTRADICTION,
      mode: 'mild',
      documents: FIXTURE_DOCS,
      claims: FIXTURE_CLAIMS,
      aiInvoke: async () => ({
        questions: [{ question: 'Kde ste boli včera?', citation: '' }]
      })
    });
    assert.ok(out.questions.length >= 1);
    assert.equal(validateQuestionSet(out.questions).ok, true);
    assert.match(out.source, /template/);
  });

  test('krížový výsluch osoby používa súvisiace rozpory', () => {
    const qs = generateTemplateQuestions({
      target: { id: 'p1', name: 'Peter Kováč', type: 'suspect', document_title: 'Výpoveď svedka Novák · s. 4', details: 'Alibi' },
      mode: 'mild',
      documents: FIXTURE_DOCS,
      claims: FIXTURE_CLAIMS,
      contradictions: [FIXTURE_CONTRADICTION]
    });
    assert.ok(qs.length >= 1);
    assert.equal(validateQuestionSet(qs).ok, true);
  });
});

describe('Court Dossier ZIP integrity', () => {
  test('ZIP STORE round-trip zachová súbory', () => {
    const payload = new TextEncoder().encode('hello-court');
    const zip = buildZipStore([
      { name: 'a.txt', data: payload },
      { name: 'b.bin', data: Uint8Array.from([1, 2, 3, 4]) }
    ]);
    const files = listZipStoreEntries(zip);
    assert.ok(files['a.txt']);
    assert.equal(new TextDecoder().decode(files['a.txt']), 'hello-court');
    assert.deepEqual([...files['b.bin']], [1, 2, 3, 4]);
    assert.equal(crc32(payload), crc32(files['a.txt']));
  });

  test('contradictionsToCsv je Excel-friendly (BOM + ;)', () => {
    const csv = contradictionsToCsv([FIXTURE_CONTRADICTION], []);
    assert.ok(csv.charCodeAt(0) === 0xfeff || csv.startsWith('\uFEFF'));
    assert.match(csv, /ID;Typ;Závažnosť/);
    assert.match(csv, /location_time_conflict/);
    assert.match(csv, /Peter Kováč/);
  });

  test('SHA-256 chain of custody je deterministický pri rovnakom vstupe', async () => {
    const stamp = '2026-08-16T12:00:00.000Z';
    const links = [
      { label: 'a', timestamp: stamp, sha256: 'sha256:aaa' },
      { label: 'b', timestamp: stamp, sha256: 'sha256:bbb' }
    ];
    const c1 = await buildSha256Chain(links, { seed: 'test-seed' });
    const c2 = await buildSha256Chain(links, { seed: 'test-seed' });
    assert.equal(c1.tip, c2.tip);
    assert.equal(c1.links.length, 2);
    assert.equal(c1.links[0].digest, c2.links[0].digest);
    assert.notEqual(c1.links[0].digest, c1.links[1].digest);
  });

  test('generateCaseIntegrityDigest je deterministický s fixedGeneratedAt', async () => {
    const stamp = '2026-08-16T12:00:00.000Z';
    const args = {
      documents: FIXTURE_DOCS,
      persons: [{ id: 'p1' }],
      redFlags: [],
      contradictions: [FIXTURE_CONTRADICTION],
      events: [],
      caseTitle: 'Test kauza',
      generatedAt: stamp
    };
    const h1 = await generateCaseIntegrityDigest(args);
    const h2 = await generateCaseIntegrityDigest(args);
    assert.equal(h1, h2);
    assert.match(h1, /^sha256:[a-f0-9]{64}$/);
  });

  test('exportCourtDossier vytvorí ZIP s povinnými súbormi a konzistentným hashom', async () => {
    const stamp = '2026-08-16T12:00:00.000Z';
    const graphPng = createPlaceholderPng2k('graph');
    const mapPng = createPlaceholderPng2k('map');

    const result = await exportCourtDossier({
      documents: FIXTURE_DOCS,
      persons: [{ id: 'p1', name: 'Peter Kováč' }],
      relationships: [],
      redFlags: [],
      contradictions: [FIXTURE_CONTRADICTION],
      events: [],
      claims: FIXTURE_CLAIMS,
      auditLogs: [{ id: 'LOG-1', timestamp: stamp, action: 'TEST', userRole: 'tester', details: {} }],
      graphPngBytes: graphPng,
      mapPngBytes: mapPng,
      scopeTitle: 'Test kauza',
      generatedAt: stamp,
      download: false
    });

    assert.ok(result.zipBytes?.length > 100);
    assert.match(result.zipSha256, /^sha256:[a-f0-9]{64}$/);
    assert.deepEqual(result.manifest.sort(), [
      'alibi_map_2k.png',
      'audit_log.json',
      'contradictions.csv',
      'investigation_report.pdf',
      'relationship_graph_2k.png'
    ].sort());

    const files = listZipStoreEntries(result.zipBytes);
    for (const name of result.manifest) {
      assert.ok(files[name]?.length > 0, `missing ${name}`);
    }

    // PDF magic
    assert.equal(String.fromCharCode(...files['investigation_report.pdf'].slice(0, 4)), '%PDF');

    // Audit log expert timestamps + chain
    const audit = JSON.parse(new TextDecoder().decode(files['audit_log.json']));
    assert.equal(audit.generatedAt, stamp);
    assert.ok(audit.chainOfCustody?.tip);
    assert.ok(audit.fileHashes['investigation_report.pdf']);
    assert.equal(audit.auditTrail.length, 1);

    // CSV presence
    const csvText = new TextDecoder().decode(files['contradictions.csv']);
    assert.match(csvText, /location_time_conflict/);

    // Determinism: second run identical tip + zip hash
    const result2 = await exportCourtDossier({
      documents: FIXTURE_DOCS,
      persons: [{ id: 'p1', name: 'Peter Kováč' }],
      relationships: [],
      redFlags: [],
      contradictions: [FIXTURE_CONTRADICTION],
      events: [],
      claims: FIXTURE_CLAIMS,
      auditLogs: [{ id: 'LOG-1', timestamp: stamp, action: 'TEST', userRole: 'tester', details: {} }],
      graphPngBytes: graphPng,
      mapPngBytes: mapPng,
      scopeTitle: 'Test kauza',
      generatedAt: stamp,
      download: false
    });

    assert.equal(result.zipSha256, result2.zipSha256);
    assert.equal(result.chainOfCustody.tip, result2.chainOfCustody.tip);

    const tipCheck = await calculateSha256Digest(result.zipBytes);
    assert.equal(result.zipSha256, `sha256:${tipCheck}`);
  });
});
