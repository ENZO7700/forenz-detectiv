import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CROSS_EXAM_MODES,
  buildCitation,
  generateCrossExamination,
  hasValidCitation,
  validateQuestionSet
} from '../src/lib/crossExamination.js';

describe('2. ⚖️ Cross-Examination Strategy Engine Test Suite', () => {

  const sampleDocuments = [
    { id: 'doc-001', title: 'Zápisnica o výsluchu svedka Kováč', page_number: 3 },
    { id: 'doc-002', title: 'Výpoveď obvineného Novák', page_number: 7 }
  ];

  const sampleContradiction = {
    id: 'contr-101',
    entity_ref: 'Ing. Peter Novák',
    type: 'alibi_conflict',
    severity: 'critical',
    explanation: 'Novák tvrdí, že bol v Bratislave, no kamerový záznam ho videl v Košiciach.',
    source_quote: '„Bol som celý večer od 18:00 do 22:00 doma v Bratislave."',
    document_id: 'doc-002',
    page_number: 7,
    line_number: 14
  };

  test('2.1 Determinizmus 3 taktických režimov (mild, aggressive, alibi)', async () => {
    assert.strictEqual(CROSS_EXAM_MODES.mild.id, 'mild');
    assert.strictEqual(CROSS_EXAM_MODES.aggressive.id, 'aggressive');
    assert.strictEqual(CROSS_EXAM_MODES.alibi.id, 'alibi');

    const mildResult = await generateCrossExamination({
      target: sampleContradiction,
      mode: 'mild',
      documents: sampleDocuments
    });
    assert.strictEqual(mildResult.mode.id, 'mild');
    assert.ok(mildResult.questions.length >= 2);

    const aggResult = await generateCrossExamination({
      target: sampleContradiction,
      mode: 'aggressive',
      documents: sampleDocuments
    });
    assert.strictEqual(aggResult.mode.id, 'aggressive');

    const alibiResult = await generateCrossExamination({
      target: sampleContradiction,
      mode: 'alibi',
      documents: sampleDocuments
    });
    assert.strictEqual(alibiResult.mode.id, 'alibi');
  });

  test('2.2 Anti-Halucinácia: Každá vygenerovaná otázka obsahuje overiteľnú citáciu', async () => {
    const questionsPack = await generateCrossExamination({
      target: sampleContradiction,
      mode: 'aggressive',
      documents: sampleDocuments
    });

    for (const q of questionsPack.questions) {
      assert.ok(q.citation, 'Otázka musí mať citáciu');
      assert.ok(q.citation.text.length > 0, 'Text citácie nesmie byť prázdny');
      assert.strictEqual(hasValidCitation(q), true, 'Otázka musí spĺňať pravidlo hasValidCitation');
    }

    const val = validateQuestionSet(questionsPack.questions);
    assert.strictEqual(val.ok, true);
    assert.strictEqual(val.invalid.length, 0);
  });

  test('2.3 buildCitation korektne syntetizuje metadáta zo zdrojového dokumentu', () => {
    const citation = buildCitation(
      { document_id: 'doc-001', line_number: 22, source_quote: 'Videl som auto odchádzať' },
      sampleDocuments
    );

    assert.strictEqual(citation.documentTitle, 'Zápisnica o výsluchu svedka Kováč');
    assert.strictEqual(citation.page, 3);
    assert.strictEqual(citation.line, 22);
    assert.match(citation.text, /s\.\s*3/i);
  });
});
