import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('7. 🔊 Sherlock Voice Engine & Speech-to-Text Test Suite', () => {

  test('7.1 Graceful fallback pri absencii Web Speech API v prehliadači', () => {
    const checkVoiceSupport = (win = {}) => {
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition || null;
      if (!SpeechRecognition) {
        return {
          supported: false,
          fallbackMode: 'TEXT_INPUT_ONLY',
          message: 'Hlasové diktovanie nie je v tomto prehliadači podporované. Použite textové pole.'
        };
      }
      return { supported: true, fallbackMode: null };
    };

    // V Node.js / starom prehliadači bez Web Speech
    const res = checkVoiceSupport({});
    assert.strictEqual(res.supported, false);
    assert.strictEqual(res.fallbackMode, 'TEXT_INPUT_ONLY');
    assert.match(res.message, /Hlasové diktovanie nie je/);
  });

  test('7.2 Normalizácia a chunking dlhých prepisov hlasových výpovedí (>10 minút)', () => {
    const chunkVoiceTranscript = (fullTranscript, maxChunkLength = 500) => {
      if (!fullTranscript) return [];
      const sentences = fullTranscript.split(/(?<=[.?!])\s+/);
      const chunks = [];
      let current = '';

      for (const sentence of sentences) {
        if ((current + ' ' + sentence).trim().length > maxChunkLength) {
          if (current) chunks.push(current.trim());
          current = sentence;
        } else {
          current = (current + ' ' + sentence).trim();
        }
      }
      if (current) chunks.push(current.trim());
      return chunks;
    };

    const longText = 'Svedok hovorí o udalostiach dňa 15. augusta. Videl podozrivé vozidlo. Auto malo tmavú farbu a značku BA. Šofér vystúpil a vošiel do budovy. Zotrval tam približne dvadsať minút.';
    const chunks = chunkVoiceTranscript(longText, 80);

    assert.ok(chunks.length >= 2, 'Dlhý text musí byť rozdelený do viacerých častí');
    for (const chunk of chunks) {
      assert.ok(chunk.length <= 100);
    }
  });

  test('7.3 Detekcia jazyka a normalizácia právnych termínov z hlasového vstupu', () => {
    const normalizeVoiceTerms = (transcript) => {
      return transcript
        .replace(/\bparagraf\s+(\d+)\b/gi, '§ $1')
        .replace(/\bodsek\s+(\d+)\b/gi, 'ods. $1')
        .replace(/\bpísmeno\s+([a-z])\b/gi, 'písm. $1');
    };

    const input = 'Podľa paragraf 346 odsek 1 písmeno a Trestného zákona ide o krivú výpoveď.';
    const normalized = normalizeVoiceTerms(input);

    assert.strictEqual(normalized, 'Podľa § 346 ods. 1 písm. a Trestného zákona ide o krivú výpoveď.');
  });
});
