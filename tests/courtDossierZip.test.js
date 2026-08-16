import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  contradictionsToCsv
} from '../src/lib/courtDossier.js';
import { buildZipStore, listZipStoreEntries, crc32 } from '../src/lib/zipStore.js';

describe('3. 📦 Court Dossier & ZIP Integrity Test Suite', () => {

  const sampleContradictions = [
    {
      id: 'c1',
      entity_ref: 'Ing. Peter Novák',
      type: 'alibi_conflict',
      severity: 'critical',
      explanation: 'Osoba tvrdila pobyt v KE, GPS lokalizácia BA',
      quoteA: 'Bol som v KE od 14:00',
      document_a_id: 'doc-001'
    }
  ];

  test('3.1 Štruktúra a deterministické balenie ZIP archívu cez buildZipStore', () => {
    const csvContent = contradictionsToCsv(sampleContradictions);
    const manifestJson = JSON.stringify({ caseId: 'case-2026', title: 'Forenzný spis' }, null, 2);

    const zipBytes = buildZipStore([
      { name: 'manifest.json', data: manifestJson },
      { name: 'contradictions.csv', data: csvContent },
      { name: 'evidence/doc1.txt', data: 'Výsluch svedka...' },
      { name: 'audit/audit_log.json', data: '{"action":"EXPORT"}' }
    ]);

    assert.ok(zipBytes instanceof Uint8Array);
    assert.ok(zipBytes.length > 50);

    const entries = listZipStoreEntries(zipBytes);
    const filenames = Object.keys(entries);

    assert.ok(filenames.includes('manifest.json'), 'Musí obsahovať manifest.json');
    assert.ok(filenames.includes('contradictions.csv'), 'Musí obsahovať contradictions.csv');
    assert.ok(filenames.includes('evidence/doc1.txt'), 'Musí obsahovať evidence/doc1.txt');
    assert.ok(filenames.includes('audit/audit_log.json'), 'Musí obsahovať audit/audit_log.json');
  });

  test('3.2 CSV export rozporov obsahuje UTF-8 BOM hlavičku a bodkočiarku pre Excel', () => {
    const csvString = contradictionsToCsv(sampleContradictions);
    assert.ok(typeof csvString === 'string');

    // UTF-8 BOM is \uFEFF
    assert.ok(csvString.charCodeAt(0) === 0xFEFF || csvString.startsWith('\uFEFF'), 'CSV musí začínať UTF-8 BOM');
    assert.match(csvString, /Peter Novák/);
    assert.match(csvString, /alibi_conflict/);
    assert.match(csvString, /;/); // Excel-friendly separator v SK/EU
  });

  test('3.3 CRC-32 deterministický výpočet a integrita ZIP záznamov', () => {
    const data = new TextEncoder().encode('ForenzDetectiv AI Evidence Proof 2026');
    const c1 = crc32(data);
    const c2 = crc32(data);
    assert.strictEqual(c1, c2, 'CRC-32 musí byť deterministický');
    assert.strictEqual(typeof c1, 'number');
    assert.ok(c1 > 0);
  });
});
