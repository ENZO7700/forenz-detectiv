import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEntitiesFromOcrText,
  CLIENT_EXTRACTION_VERSION
} from '../src/lib/clientOcrPipeline.js';

/**
 * Synthetic (non-case) fixture — production must not hardcode these names either;
 * they exist only here to exercise generic inflection / particle / evidence rules.
 */
const SYNTHETIC_TEXT = `
ZÁPISNICA O VÝSLUCHU ZADRŽANÉHO - PODOZRIVÉHO
meno, priezvisko, dátum narodenia: Adam Novák, 01.01.1990
predošlé meno a priezvisko: Peter Holý

K veci uvádzam, že som robil s osobou Martin Kováč. Eva Horváth bola konateľka. Ján to financoval.
Otázka vyšetrovateľa: v akom vzťahu ste s osobou Martin Kováč?
Odpoveď: kolegovia z práce.

12:15 uviedol, že stretol Kováča v Nitre.
`.trim();

describe('Generic person canonicalization (no case-specific production maps)', () => {
  test('CLIENT_EXTRACTION_VERSION is exported and stamped on sync path', () => {
    assert.equal(typeof CLIENT_EXTRACTION_VERSION, 'number');
    assert.ok(CLIENT_EXTRACTION_VERSION >= 2);
  });

  test('primary + alias; particle "to" stripped; declined surname collapses', () => {
    const { persons, relationships } = buildEntitiesFromOcrText(
      SYNTHETIC_TEXT,
      null,
      'doc_synth',
      'vypoved-Adam-Novak.txt'
    );

    assert.strictEqual(persons[0].name, 'Adam Novák');
    assert.strictEqual(persons[0].type, 'podozrivý');
    assert.ok(!persons.some((p) => p.name === 'Peter Holý'));
    assert.match(persons[0].details, /Predošlé meno: Peter Holý/);

    assert.ok(persons.some((p) => p.name === 'Martin Kováč'));
    assert.ok(persons.some((p) => p.name === 'Eva Horváth'));
    assert.ok(persons.some((p) => p.name === 'Ján'));
    assert.ok(!persons.some((p) => /\bto\b/i.test(p.name)));
    // Declined "Kováča" must not create a second person
    assert.equal(persons.filter((p) => /Kováč/i.test(p.name)).length, 1);

    const kovacRel = relationships.find((r) => r.target_name === 'Martin Kováč');
    assert.ok(kovacRel);
    assert.strictEqual(kovacRel.label, 'kolegovia z práce');
    assert.ok(kovacRel.description, 'Q&A/merit relationship must store source fragment');
    assert.ok(
      SYNTHETIC_TEXT.includes(kovacRel.description.trim()) ||
        /Martin Kováč|Kováča/.test(kovacRel.description)
    );

    const weak = relationships.find((r) => r.target_name === 'Ján');
    assert.ok(weak);
    assert.strictEqual(weak.label, 'spomenutý vo výpovedi');
  });

  test('unresolved declined surname alone does not invent a person', () => {
    const text = `
ZÁPISNICA O VÝSLUCHU SVEDKA
meno, priezvisko: Anna Veselá
O: stretol Neznámeho v meste.
`.trim();
    const { persons } = buildEntitiesFromOcrText(text, null, 'doc_x', 'vypoved-Anna.txt');
    assert.strictEqual(persons[0].name, 'Anna Veselá');
    assert.ok(!persons.some((p) => /Neznám/i.test(p.name)));
  });
});
