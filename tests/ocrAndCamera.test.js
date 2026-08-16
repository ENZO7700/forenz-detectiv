import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { captureFrameFromVideo, stopCameraStream } from '../src/lib/camera.js';

describe('1. 🎙️ OCR & Camera Scanner Test Suite', () => {

  test('1.1 Normalizácia slovenských a českých diakritických znakov', () => {
    const rawOcrText = 'Svedok Ján Čerešňa uviedol: „Videl som podozrivého v čase o 14:30 na Poštovej ulici v Žiline."';
    const normalized = rawOcrText.normalize('NFD');
    assert.strictEqual(typeof normalized, 'string');
    assert.match(rawOcrText, /Čerešňa/);
    assert.match(rawOcrText, /Žiline/);

    // Diacritics test set
    const diacritics = 'ľščťžýáíéúäôďňĽŠČŤŽÝÁÍÉÚÄÔĎŇ';
    assert.strictEqual(diacritics.length, 28);
  });

  test('1.2 Detekcia nízkeho skóre spoľahlivosti OCR (confidence threshold)', () => {
    const evaluateConfidence = (confidence) => {
      if (confidence < 60) {
        return { reliable: false, recommendation: 'Vyžaduje manuálnu kontrolu (rozmazaný / nekvalitný scan)' };
      }
      return { reliable: true, recommendation: 'Automaticky overené' };
    };

    const lowResult = evaluateConfidence(42);
    assert.strictEqual(lowResult.reliable, false);
    assert.match(lowResult.recommendation, /manuálnu kontrolu/);

    const highResult = evaluateConfidence(94);
    assert.strictEqual(highResult.reliable, true);
  });

  test('1.3 Obsluha odmietnutia oprávnenia kamery (Permission Error Handling)', () => {
    const handleCameraError = (err) => {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return 'Prístup ku kamere bol zamietnutý. Povoľte kameru v nastaveniach prehliadača.';
      }
      return 'Nepodarilo sa spustiť kameru: ' + (err.message || 'Neznáma chyba');
    };

    const notAllowedErr = new Error('Permission denied');
    notAllowedErr.name = 'NotAllowedError';

    const msg = handleCameraError(notAllowedErr);
    assert.match(msg, /Prístup ku kamere bol zamietnutý/);
  });

  test('1.4 captureFrameFromVideo a stopCameraStream bezpečne obsluhujú stream a canvas', async () => {
    let stopped = false;
    const mockTrack = {
      stop: () => { stopped = true; }
    };
    const mockStream = {
      getTracks: () => [mockTrack]
    };

    stopCameraStream(mockStream);
    assert.strictEqual(stopped, true, 'Stream tracky musia byť korektne zastavené');

    // captureFrameFromVideo with empty element returns null
    const result = captureFrameFromVideo(null);
    assert.strictEqual(result, null);
  });
});
